"""
Pricing Extractor service for structured pricing data extraction.

Extracts line items, totals, and project metadata from contractor documents
to enable accurate estimation based on historical pricing.
"""

import json
import logging
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Dict, List, Any

from app.services.supabase import get_supabase_admin
from app.services.openrouter import OpenRouterService
from app.services.embedding import EmbeddingService

logger = logging.getLogger("remodly.pricing_extractor")


class PricingExtractorService:
    """Service for extracting and querying structured pricing data from documents."""

    EXTRACTION_PROMPT = """Analyze this contractor document and extract ALL pricing information.

Document text:
{document_text}

Document metadata:
- Name: {doc_name}
- Type: {doc_type}

Extract and return a JSON object with these fields:
{{
    "project_info": {{
        "project_type": "bathroom remodel/kitchen remodel/full renovation/addition/etc",
        "project_date": "YYYY-MM-DD or null if not found",
        "location": "city, state if mentioned",
        "total_sqft": number or null
    }},
    "line_items": [
        {{
            "category": "demolition/framing/electrical/plumbing/drywall/flooring/painting/fixtures/cabinets/countertops/labor/materials/etc",
            "item_name": "specific description of the work/item",
            "quantity": number or null,
            "unit": "SF/LF/EA/HR/LS (lump sum)/etc",
            "unit_cost": number or null,
            "total_cost": number (required)
        }}
    ],
    "summary": {{
        "subtotal": number or null,
        "labor_total": number or null,
        "materials_total": number or null,
        "permit_fees": number or null,
        "overhead": number or null,
        "profit": number or null,
        "tax": number or null,
        "grand_total": number (required)
    }},
    "notes": {{
        "exclusions": ["list of items explicitly NOT included"],
        "assumptions": ["list of assumptions made"],
        "allowances": ["list of allowances/TBD items"],
        "payment_terms": "description if found"
    }},
    "confidence_score": 0.0-1.0 based on how complete/clear the pricing data is
}}

Important:
- Extract EVERY line item you can find, even if unit costs are missing
- For lump sum items, use "LS" as unit and quantity=1
- Category should be normalized to common contractor categories
- If amounts are ranges, use the midpoint
- confidence_score: 0.9+ = clear complete pricing, 0.7-0.9 = some gaps, <0.7 = limited data
- Return ONLY valid JSON, no markdown or explanation."""

    def __init__(self):
        self.admin = get_supabase_admin()
        self.openrouter = OpenRouterService()
        self.embedding_service = EmbeddingService()

    async def extract_pricing_from_document(
        self,
        doc_id: str,
        org_id: str,
        text: str,
        doc_name: str = "",
        doc_type: str = ""
    ) -> Optional[Dict]:
        """
        Extract structured pricing data from a document.

        Args:
            doc_id: Document UUID
            org_id: Organization UUID
            text: Extracted document text
            doc_name: Document filename
            doc_type: Document type (estimate, addendum, invoice, etc.)

        Returns:
            Extracted pricing data or None if extraction failed
        """
        if not text or len(text.strip()) < 50:
            logger.warning(f"Document {doc_id} too short for pricing extraction")
            return None

        # Limit text to avoid token overflow
        truncated_text = text[:12000] if len(text) > 12000 else text

        try:
            prompt = self.EXTRACTION_PROMPT.format(
                document_text=truncated_text,
                doc_name=doc_name,
                doc_type=doc_type
            )

            response = await self.openrouter.chat_completion(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,  # Low temperature for consistent extraction
                max_tokens=4000,
            )

            # Parse JSON response
            pricing_data = self._parse_json_response(response)
            if not pricing_data:
                logger.warning(f"Failed to parse pricing response for doc {doc_id}")
                return None

            # Validate and store
            if self._validate_pricing_data(pricing_data):
                await self._store_pricing_data(doc_id, org_id, pricing_data)
                logger.info(
                    f"Extracted pricing from doc {doc_id}: "
                    f"{len(pricing_data.get('line_items', []))} line items, "
                    f"confidence: {pricing_data.get('confidence_score', 0):.2f}"
                )
                return pricing_data
            else:
                logger.warning(f"Invalid pricing data structure for doc {doc_id}")
                return None

        except Exception as e:
            logger.error(f"Pricing extraction failed for doc {doc_id}: {e}", exc_info=True)
            return None

    def _parse_json_response(self, response: str) -> Optional[Dict]:
        """Parse JSON from LLM response, handling markdown code blocks."""
        try:
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

        # Try generic code block
        if "```" in response:
            start = response.find("```") + 3
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

    def _validate_pricing_data(self, data: Dict) -> bool:
        """Validate that pricing data has required fields."""
        if not isinstance(data, dict):
            return False

        # Must have line_items or summary
        has_line_items = isinstance(data.get("line_items"), list) and len(data["line_items"]) > 0
        has_summary = isinstance(data.get("summary"), dict) and data["summary"].get("grand_total")

        return has_line_items or has_summary

    async def _store_pricing_data(
        self,
        doc_id: str,
        org_id: str,
        pricing_data: Dict
    ) -> None:
        """Store extracted pricing data in database."""
        # Delete existing pricing for this document
        self.admin.table("document_pricing").delete().eq(
            "document_id", doc_id
        ).execute()

        project_info = pricing_data.get("project_info", {})
        summary = pricing_data.get("summary", {})

        # Parse project date
        project_date = None
        if project_info.get("project_date"):
            try:
                project_date = datetime.strptime(
                    project_info["project_date"], "%Y-%m-%d"
                ).date().isoformat()
            except ValueError:
                pass

        # Insert pricing record
        self.admin.table("document_pricing").insert({
            "document_id": doc_id,
            "organization_id": org_id,
            "project_type": project_info.get("project_type"),
            "project_date": project_date,
            "total_amount": summary.get("grand_total"),
            "labor_total": summary.get("labor_total"),
            "materials_total": summary.get("materials_total"),
            "line_items": pricing_data.get("line_items", []),
            "confidence_score": pricing_data.get("confidence_score", 0.5),
            "extraction_metadata": {
                "notes": pricing_data.get("notes", {}),
                "project_info": project_info,
            }
        }).execute()

    async def get_historical_pricing(
        self,
        org_id: str,
        project_type: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict]:
        """
        Query historical pricing data by project type or category.

        Args:
            org_id: Organization UUID
            project_type: Filter by project type (e.g., "bathroom")
            category: Filter line items by category (e.g., "electrical")
            limit: Maximum results

        Returns:
            List of pricing records with line items
        """
        try:
            result = self.admin.rpc(
                "get_historical_pricing",
                {
                    "search_org_id": org_id,
                    "search_project_type": project_type,
                    "search_category": category,
                    "result_limit": limit,
                }
            ).execute()

            return result.data or []

        except Exception as e:
            logger.error(f"Failed to get historical pricing: {e}")
            return []

    async def find_similar_projects(
        self,
        org_id: str,
        scope_description: str,
        limit: int = 3
    ) -> List[Dict]:
        """
        Find similar historical projects based on scope description using RAG.

        Uses semantic search (embeddings) to find relevant document chunks,
        then retrieves pricing data for those documents. This is more accurate
        than keyword matching because "bathroom remodel" will match documents
        that discuss bathrooms even if the project_type is "house remodel".

        Args:
            org_id: Organization UUID
            scope_description: Description of the work to estimate
            limit: Maximum results

        Returns:
            List of similar projects with pricing data
        """
        try:
            # Step 1: Use RAG to find relevant document chunks
            similar_chunks = await self.embedding_service.search_similar(
                org_id, scope_description, limit=10, min_similarity=0.3
            )

            if not similar_chunks:
                logger.info(f"No similar chunks found for: {scope_description[:50]}...")
                # Fallback to keyword-based search
                return await self._find_similar_projects_by_keywords(org_id, scope_description, limit)

            # Step 2: Get unique document IDs from matching chunks
            doc_ids = list(set(chunk.get('document_id') for chunk in similar_chunks if chunk.get('document_id')))

            if not doc_ids:
                logger.info("No document IDs found in similar chunks")
                return []

            logger.info(f"Found {len(doc_ids)} relevant documents via RAG for: {scope_description[:50]}...")

            # Step 3: Fetch pricing data for those documents
            result = self.admin.table("document_pricing").select("*").in_(
                "document_id", doc_ids
            ).eq("organization_id", org_id).execute()

            projects = result.data or []

            if not projects:
                logger.info("No pricing data found for matched documents, trying keyword fallback")
                return await self._find_similar_projects_by_keywords(org_id, scope_description, limit)

            # Step 4: Sort by relevance (based on chunk similarity)
            # Create a map of document_id to max similarity score
            doc_similarity = {}
            for chunk in similar_chunks:
                doc_id = chunk.get('document_id')
                similarity = chunk.get('similarity', 0)
                if doc_id:
                    doc_similarity[doc_id] = max(doc_similarity.get(doc_id, 0), similarity)

            # Add similarity score to projects and sort
            for project in projects:
                project['similarity'] = doc_similarity.get(project.get('document_id'), 0)

            projects.sort(key=lambda x: x.get('similarity', 0), reverse=True)

            return projects[:limit]

        except Exception as e:
            logger.error(f"Failed to find similar projects via RAG: {e}")
            # Fallback to keyword-based search
            return await self._find_similar_projects_by_keywords(org_id, scope_description, limit)

    async def _find_similar_projects_by_keywords(
        self,
        org_id: str,
        scope_description: str,
        limit: int = 3
    ) -> List[Dict]:
        """
        Fallback method using keyword matching when RAG doesn't find results.

        Args:
            org_id: Organization UUID
            scope_description: Description of the work to estimate
            limit: Maximum results

        Returns:
            List of similar projects with pricing data
        """
        keywords = self._extract_scope_keywords(scope_description)

        try:
            result = self.admin.rpc(
                "find_similar_projects",
                {
                    "search_org_id": org_id,
                    "scope_keywords": keywords,
                    "result_limit": limit,
                }
            ).execute()

            projects = result.data or []
            projects = [p for p in projects if p.get("match_score", 0) > 0]

            return projects

        except Exception as e:
            logger.error(f"Failed to find similar projects by keywords: {e}")
            return []

    def _extract_scope_keywords(self, description: str) -> List[str]:
        """Extract relevant keywords from a scope description."""
        # Common project keywords to look for
        keyword_patterns = [
            # Room types
            "bathroom", "kitchen", "bedroom", "living room", "basement",
            "attic", "garage", "laundry", "deck", "patio",
            # Work types
            "remodel", "renovation", "addition", "repair", "replace",
            "install", "upgrade", "demo", "demolition",
            # Trades
            "plumbing", "electrical", "hvac", "roofing", "flooring",
            "painting", "drywall", "framing", "insulation",
            # Features
            "shower", "tub", "vanity", "toilet", "sink", "faucet",
            "cabinets", "countertop", "backsplash", "tile", "hardwood",
            "window", "door", "lighting",
        ]

        description_lower = description.lower()
        found_keywords = []

        for keyword in keyword_patterns:
            if keyword in description_lower:
                found_keywords.append(keyword)

        # Add any quoted phrases or specific terms
        return found_keywords[:10]  # Limit to avoid overly broad queries

    async def get_category_averages(
        self,
        org_id: str,
        category: str,
        project_type: Optional[str] = None
    ) -> Dict:
        """
        Get average pricing for a category across historical projects.

        Args:
            org_id: Organization UUID
            category: Category to analyze (e.g., "electrical", "plumbing")
            project_type: Optional project type filter

        Returns:
            Dict with average unit costs and totals for the category
        """
        historical = await self.get_historical_pricing(
            org_id, project_type=project_type, category=category
        )

        if not historical:
            return {"category": category, "sample_count": 0}

        # Aggregate line items for this category
        all_items = []
        for project in historical:
            items = project.get("line_items") or []
            for item in items:
                if item and isinstance(item, dict):
                    all_items.append(item)

        if not all_items:
            return {"category": category, "sample_count": 0}

        # Calculate averages
        totals = [
            item.get("total_cost", 0) for item in all_items
            if item.get("total_cost")
        ]

        unit_costs = [
            item.get("unit_cost", 0) for item in all_items
            if item.get("unit_cost")
        ]

        return {
            "category": category,
            "sample_count": len(all_items),
            "avg_total": sum(totals) / len(totals) if totals else None,
            "min_total": min(totals) if totals else None,
            "max_total": max(totals) if totals else None,
            "avg_unit_cost": sum(unit_costs) / len(unit_costs) if unit_costs else None,
            "common_items": self._get_common_items(all_items),
        }

    def _get_common_items(self, items: List[Dict], top_n: int = 5) -> List[str]:
        """Get most common item names from a list of line items."""
        from collections import Counter
        names = [
            item.get("item_name", "").lower().strip()
            for item in items
            if item.get("item_name")
        ]
        return [name for name, _ in Counter(names).most_common(top_n)]

    async def delete_document_pricing(self, doc_id: str) -> None:
        """Delete pricing data for a specific document."""
        self.admin.table("document_pricing").delete().eq(
            "document_id", doc_id
        ).execute()
        logger.debug(f"Deleted pricing data for document {doc_id}")
