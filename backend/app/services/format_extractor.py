"""
Format Extractor service for document pattern analysis.

Extracts and stores formatting patterns from uploaded contractor documents
to enable dynamic output formatting per organization.
"""

import json
import logging
from typing import Optional, Dict, List

from app.services.supabase import get_supabase_admin
from app.services.openrouter import OpenRouterService

logger = logging.getLogger("remodly.format_extractor")


class FormatExtractorService:
    """Service for extracting and managing document format patterns."""

    EXTRACTION_PROMPT = """Analyze this contractor document and extract the formatting patterns used.

Document text:
{document_text}

Formatting metadata detected from the document:
{formatting_metadata}

Extract and return a JSON object with these fields:
{{
    "section_headers": ["list of section headers used, e.g., 'Scope of Work', 'Materials'"],
    "numbering_style": "decimal|bullet|roman|none",
    "terminology": {{
        "key_terms": ["important industry terms used"],
        "phrasing_patterns": ["common sentence structures"],
        "price_language": "how costs are described"
    }},
    "structure": {{
        "sections_order": ["order of major sections"],
        "has_summary": true/false,
        "has_totals": true/false,
        "has_assumptions": true/false
    }},
    "pricing_format": "description of how prices/costs are formatted",
    "boilerplate_text": "any standard clauses or repeated legal/disclaimer text",
    "typography": {{
        "primary_font": "most commonly used font from the metadata",
        "heading_font": "font used for headings (often bold variant)",
        "body_font": "font used for body text",
        "heading_sizes": {{"h1": size, "h2": size, "h3": size}},
        "uses_bold_for_emphasis": true/false,
        "uses_italic_for_emphasis": true/false
    }},
    "colors": {{
        "primary_text_color": "#hex color for main text",
        "heading_color": "#hex color for headings",
        "accent_color": "#hex color for highlights/accents"
    }},
    "confidence_score": 0.0-1.0
}}

Use the formatting metadata to populate typography and colors accurately.
Return ONLY valid JSON, no markdown or explanation."""

    def __init__(self):
        self.admin = get_supabase_admin()
        self.openrouter = OpenRouterService()

    async def extract_format_from_document(
        self,
        doc_id: str,
        org_id: str,
        text: str,
        metadata: Optional[Dict] = None,
        formatting_metadata: Optional[Dict] = None
    ) -> Optional[Dict]:
        """
        Analyze a document to extract its formatting patterns.

        Args:
            doc_id: Document UUID
            org_id: Organization UUID
            text: Extracted document text
            metadata: Optional document metadata
            formatting_metadata: Optional formatting data (fonts, colors, etc.)

        Returns:
            Extracted format patterns or None if extraction failed
        """
        if not text or len(text.strip()) < 100:
            return None

        # Limit text to avoid token overflow
        truncated_text = text[:8000] if len(text) > 8000 else text

        # Format the formatting metadata for the prompt
        formatting_str = "None detected"
        if formatting_metadata:
            formatting_str = json.dumps(formatting_metadata, indent=2)

        try:
            prompt = self.EXTRACTION_PROMPT.format(
                document_text=truncated_text,
                formatting_metadata=formatting_str
            )

            response = await self.openrouter.chat_completion(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=2500,
            )

            # Parse JSON response
            patterns = self._parse_json_response(response)
            if not patterns:
                return None

            # Store in database
            await self._store_format_patterns(doc_id, org_id, patterns)

            return patterns

        except Exception as e:
            logger.error(f"Format extraction failed for doc {doc_id}: {e}", exc_info=True)
            return None

    def _parse_json_response(self, response: str) -> Optional[Dict]:
        """Parse JSON from LLM response, handling markdown code blocks."""
        try:
            # Try direct parse first
            return json.loads(response)
        except json.JSONDecodeError:
            pass

        # Try extracting from markdown code block
        if "```json" in response:
            start = response.find("```json") + 7
            end = response.find("```", start)
            if end > start:
                try:
                    return json.loads(response[start:end].strip())
                except json.JSONDecodeError:
                    pass

        # Try extracting from generic code block
        if "```" in response:
            start = response.find("```") + 3
            # Skip language identifier if present
            newline = response.find("\n", start)
            if newline > start:
                start = newline + 1
            end = response.find("```", start)
            if end > start:
                try:
                    return json.loads(response[start:end].strip())
                except json.JSONDecodeError:
                    pass

        return None

    async def _store_format_patterns(
        self,
        doc_id: str,
        org_id: str,
        patterns: Dict
    ) -> None:
        """Store extracted format patterns in database."""
        # Delete existing patterns for this document
        self.admin.table("document_format_patterns").delete().eq(
            "document_id", doc_id
        ).execute()

        # Insert new patterns with typography and colors
        self.admin.table("document_format_patterns").insert({
            "document_id": doc_id,
            "organization_id": org_id,
            "section_headers": patterns.get("section_headers", []),
            "numbering_style": patterns.get("numbering_style", "decimal"),
            "terminology": patterns.get("terminology", {}),
            "structure": patterns.get("structure", {}),
            "pricing_format": patterns.get("pricing_format"),
            "boilerplate_text": patterns.get("boilerplate_text"),
            "typography": patterns.get("typography", {}),
            "colors": patterns.get("colors", {}),
            "confidence_score": patterns.get("confidence_score", 0.5),
        }).execute()

    async def get_org_format_patterns(self, org_id: str) -> Optional[Dict]:
        """
        Get aggregated format patterns for an organization.

        Args:
            org_id: Organization UUID

        Returns:
            Aggregated format patterns or None if no patterns exist
        """
        # Query all patterns for the organization
        result = self.admin.table("document_format_patterns").select("*").eq(
            "organization_id", org_id
        ).order("confidence_score", desc=True).execute()

        patterns = result.data
        if not patterns:
            return None

        # Aggregate patterns from all documents
        return self._aggregate_patterns(patterns)

    def _aggregate_patterns(self, patterns: List[Dict]) -> Dict:
        """Merge patterns from multiple documents into a single set."""
        from collections import Counter

        # Collect unique section headers (ordered by frequency)
        all_headers = []
        for p in patterns:
            headers = p.get("section_headers") or []
            all_headers.extend(headers)

        # Count frequency and deduplicate
        header_counts = {}
        for h in all_headers:
            header_counts[h] = header_counts.get(h, 0) + 1
        unique_headers = sorted(
            header_counts.keys(),
            key=lambda x: header_counts[x],
            reverse=True
        )[:15]

        # Get most common numbering style
        numbering_styles = [p.get("numbering_style") for p in patterns if p.get("numbering_style")]
        most_common_style = max(set(numbering_styles), key=numbering_styles.count) if numbering_styles else "decimal"

        # Merge terminology
        merged_terminology = {}
        for p in patterns:
            term = p.get("terminology") or {}
            for key, value in term.items():
                if key not in merged_terminology:
                    merged_terminology[key] = value
                elif isinstance(value, list) and isinstance(merged_terminology[key], list):
                    merged_terminology[key] = list(set(merged_terminology[key] + value))

        # Get most detailed structure
        best_structure = {}
        for p in patterns:
            struct = p.get("structure") or {}
            if len(str(struct)) > len(str(best_structure)):
                best_structure = struct

        # Get pricing format from highest confidence pattern
        pricing_format = None
        for p in patterns:
            if p.get("pricing_format"):
                pricing_format = p.get("pricing_format")
                break

        # Aggregate typography - get most common fonts
        font_counter: Counter = Counter()
        all_heading_sizes: Dict[str, List[int]] = {"h1": [], "h2": [], "h3": []}
        bold_usage_count = 0
        italic_usage_count = 0

        for p in patterns:
            typo = p.get("typography") or {}
            if typo.get("primary_font"):
                font_counter[typo["primary_font"]] += 2  # Weight primary font higher
            if typo.get("heading_font"):
                font_counter[typo["heading_font"]] += 1
            if typo.get("body_font"):
                font_counter[typo["body_font"]] += 1

            heading_sizes = typo.get("heading_sizes") or {}
            for level in ["h1", "h2", "h3"]:
                if heading_sizes.get(level):
                    all_heading_sizes[level].append(heading_sizes[level])

            if typo.get("uses_bold_for_emphasis"):
                bold_usage_count += 1
            if typo.get("uses_italic_for_emphasis"):
                italic_usage_count += 1

        # Build aggregated typography
        most_common_fonts = [font for font, _ in font_counter.most_common(3)]
        aggregated_typography = {
            "primary_font": most_common_fonts[0] if most_common_fonts else None,
            "fonts_used": most_common_fonts,
            "heading_sizes": {
                level: round(sum(sizes) / len(sizes)) if sizes else None
                for level, sizes in all_heading_sizes.items()
            },
            "uses_bold_for_emphasis": bold_usage_count > len(patterns) / 2,
            "uses_italic_for_emphasis": italic_usage_count > len(patterns) / 2,
        }

        # Aggregate colors - get most common
        color_counter: Counter = Counter()
        for p in patterns:
            colors = p.get("colors") or {}
            if colors.get("primary_text_color"):
                color_counter[colors["primary_text_color"]] += 2
            if colors.get("heading_color"):
                color_counter[colors["heading_color"]] += 1
            if colors.get("accent_color"):
                color_counter[colors["accent_color"]] += 1

        most_common_colors = [color for color, _ in color_counter.most_common(5)]
        aggregated_colors = {
            "primary_text_color": most_common_colors[0] if most_common_colors else "#000000",
            "colors_used": most_common_colors,
        }

        return {
            "section_headers": unique_headers,
            "numbering_style": most_common_style,
            "terminology": merged_terminology,
            "structure": best_structure,
            "pricing_format": pricing_format,
            "typography": aggregated_typography,
            "colors": aggregated_colors,
            "document_count": len(patterns),
        }

    async def delete_document_patterns(self, doc_id: str) -> None:
        """Delete format patterns for a specific document."""
        self.admin.table("document_format_patterns").delete().eq(
            "document_id", doc_id
        ).execute()

    def suggest_format(self) -> Dict:
        """
        Return suggested format when organization has no documents.

        Returns:
            Default format suggestion
        """
        return {
            "note": "No company documents found to learn your format.",
            "suggestion": "Upload your existing estimates, contracts, or proposals and I'll match that style.",
            "default_sections": [
                "Project Summary",
                "Scope of Work",
                "Materials",
                "Labor",
                "Totals & Payment Terms"
            ],
            "default_style": "professional contractor estimate"
        }
