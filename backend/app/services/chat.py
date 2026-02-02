"""
Chat service for AI-powered estimate generation.

Handles conversations, messages, and RAG-enhanced AI responses.
Includes automatic conversation persistence and context retrieval.
Supports pricing mode selection and historical pricing context.
"""

import asyncio
import re
from datetime import date
from typing import Optional, List, Dict, AsyncGenerator

from app.services.supabase import get_supabase_admin
from app.services.openrouter import OpenRouterService
from app.services.embedding import EmbeddingService
from app.services.organization import OrganizationService
from app.services.format_extractor import FormatExtractorService
from app.services.pricing_extractor import PricingExtractorService


# Project type keywords for auto-tagging
PROJECT_TAGS = {
    "bathroom": ["bathroom", "bath", "shower", "tub", "toilet", "vanity", "lavatory"],
    "kitchen": ["kitchen", "cabinet", "countertop", "sink", "appliance", "backsplash"],
    "flooring": ["floor", "flooring", "tile", "hardwood", "carpet", "laminate", "vinyl"],
    "roofing": ["roof", "roofing", "shingle", "gutter", "fascia", "soffit"],
    "painting": ["paint", "painting", "primer", "wall", "ceiling", "trim"],
    "plumbing": ["plumbing", "pipe", "drain", "faucet", "water heater"],
    "electrical": ["electrical", "wiring", "outlet", "switch", "panel", "lighting"],
    "hvac": ["hvac", "heating", "cooling", "air conditioning", "furnace", "duct"],
    "siding": ["siding", "exterior", "vinyl siding", "stucco", "brick"],
    "windows": ["window", "glass", "replacement window", "storm window"],
    "doors": ["door", "entry door", "interior door", "garage door"],
    "deck": ["deck", "patio", "porch", "outdoor", "pergola"],
    "basement": ["basement", "foundation", "waterproofing", "sump pump"],
    "addition": ["addition", "extension", "room addition", "build out"],
}


class ChatService:
    """Service for managing chat conversations and AI responses."""

    # Pricing mode options
    PRICING_MODE_PENDING = "pending"
    PRICING_MODE_CRITERIA = "criteria"
    PRICING_MODE_HISTORICAL = "historical"
    PRICING_MODE_COMBINED = "combined"

    # Initial prompt to ask user about pricing approach
    PRICING_MODE_PROMPT = """Before I create your estimate, I'd like to understand how you'd prefer me to calculate pricing:

**Option 1: Use Configured Rates** (criteria)
I'll use your organization's labor rates, overhead, and profit margins to calculate from scratch.

**Option 2: Reference Historical Projects** (historical)
I'll find similar projects from your uploaded documents (addendums, past estimates) and base pricing on those.

**Option 3: Combined Approach** (combined) - *Recommended*
I'll reference historical project pricing AND apply your configured margins. This gives the most accurate estimates.

Which approach would you prefer? You can say "historical", "criteria", "combined", or describe what you'd like."""

    SYSTEM_PROMPT_TEMPLATE = """You are REMODLY AI, an expert estimating assistant for {company_name}.

Your role is to help create accurate estimates for remodeling and renovation projects.

## Organization Pricing Context
- Base Labor Rate: ${labor_rate}/hour
- Overhead Markup: {overhead_markup}%
- Profit Margin: {profit_margin}%
- Region: {region}

## Available Labor Items
{labor_items}

## Relevant Document Context
{document_context}

{historical_pricing_context}

{format_context}

{past_context}

## Pricing Estimation Guidelines

### What Estimates Include
**INCLUDED in your estimates:** Labor costs, rough materials (framing, drywall, wiring, plumbing supplies), permits
**NOT INCLUDED (client-supplied):** Finish materials (tile, fixtures, appliances, vanities, countertops) unless specified

### Estimation Process ({pricing_mode} mode)
{pricing_mode_instructions}

### Output Format for Estimates
Always provide estimates in this format:
1. **Price Range:** Low / Mid / High estimate
2. **Reference Projects:** Which documents/past projects informed this estimate
3. **Assumptions Made:** List EVERY assumption (be transparent)
4. **Confidence Level:** High (strong references) / Medium (some gaps) / Low (limited data)
5. **Line Item Breakdown:** Category, description, quantity, unit, cost

### Assumptions Tracking
When making assumptions, categorize them:
| Category | Your Assumption | Flag When |
|----------|----------------|-----------|
| Square Footage | Use reference average | User didn't specify |
| Material Grade | Mid-grade | User didn't specify |
| Demolition | Included | Not mentioned |
| Permits | Included | Varies by jurisdiction |
| Timeline | Standard (no rush premium) | Not specified |
| Finish Materials | Client-supplied | Always clarify |
| Access Conditions | Standard access | Not mentioned |

## Assumption Handling Rules
- NEVER invent project scope beyond what the user described
- When details are unknown, use neutral phrasing: "Install vanity (size/style per owner selection)"
- Ask clarifying questions for: dimensions, material grades, fixture counts, access conditions
- Keep assumptions minimal and conservative
- When using historical pricing, always cite the source document

## Quality Guidelines
- Scope matches user intent exactly - no additions
- All unknown specifications phrased neutrally
- Pricing uses organization's actual rates from uploaded documents
- Always show your work: how you arrived at the numbers

## Interaction Guidelines
1. Ask clarifying questions about project scope, materials, and specifications before providing estimates
2. Use the organization's labor items and rates when calculating costs
3. Apply overhead and profit margins to arrive at final prices
4. Provide itemized breakdowns when giving estimates
5. Be conversational but professional
6. If you don't have enough information to estimate accurately, ask before guessing
7. Reference pricing from uploaded documents when relevant
8. When relevant, reference previous conversations with this user to provide continuity

Remember: You represent this contractor's business. Use their actual rates and pricing from the context provided."""

    # Pricing mode-specific instructions
    PRICING_MODE_INSTRUCTIONS = {
        "pending": """Not yet selected - ask the user which pricing approach they prefer before providing estimates.""",

        "criteria": """1. Calculate labor hours based on scope
2. Apply base labor rate (${labor_rate}/hr)
3. Add material estimates based on industry standards
4. Apply overhead ({overhead_markup}%) and profit margin ({profit_margin}%)
5. Provide itemized breakdown""",

        "historical": """1. Find 2-3 similar reference projects from historical addendums/estimates
2. Extract relevant line items and totals
3. Apply adjustments:
   - Size scaling: Use 0.8 factor for economies of scale on larger projects
   - Inflation: Add 3-5% per year from reference date
   - Material upgrades/downgrades: ±15-30%
4. Cite which documents informed the estimate""",

        "combined": """1. Find 2-3 similar reference projects from historical addendums/estimates
2. Calculate base price from references
3. Validate against configured labor rates
4. Apply adjustments:
   - Size scaling: 0.8 factor for economies of scale
   - Material upgrades/downgrades: ±15-30%
   - Inflation: 3-5% per year from reference date
5. Apply overhead ({overhead_markup}%) and profit margin ({profit_margin}%)
6. Cite references and show calculation methodology"""
    }

    def __init__(self):
        self.admin = get_supabase_admin()
        self.openrouter = OpenRouterService()
        self.embedding_service = EmbeddingService()
        self.org_service = OrganizationService()
        self.format_extractor = FormatExtractorService()
        self.pricing_extractor = PricingExtractorService()

    async def create_conversation(
        self,
        org_id: str,
        user_id: str,
        title: Optional[str] = None
    ) -> dict:
        """
        Create a new chat conversation.

        Conversations are auto-saved by default for persistence.

        Args:
            org_id: Organization UUID
            user_id: User UUID
            title: Optional conversation title

        Returns:
            Created conversation record
        """
        result = self.admin.table("chat_conversations").insert({
            "organization_id": org_id,
            "user_id": user_id,
            "title": title or "New Estimate",
            "is_saved": True,  # Auto-save all conversations
            "message_count": 0,
            "tags": [],
            "project_context": {},
            "pricing_mode": self.PRICING_MODE_COMBINED,  # Default to combined for best results
            "pricing_assumptions": {},
        }).execute()

        return result.data[0]

    async def get_conversation(self, conversation_id: str) -> Optional[dict]:
        """
        Get conversation with its messages.

        Args:
            conversation_id: Conversation UUID

        Returns:
            Conversation with messages or None
        """
        conv = self.admin.table("chat_conversations").select("*").eq(
            "id", conversation_id
        ).execute()

        if not conv.data:
            return None

        messages = self.admin.table("chat_messages").select("*").eq(
            "conversation_id", conversation_id
        ).order("created_at").execute()

        result = conv.data[0]
        result["messages"] = messages.data or []
        return result

    async def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        metadata: Optional[dict] = None
    ) -> dict:
        """
        Add a message to a conversation.

        Args:
            conversation_id: Conversation UUID
            role: Message role ('user', 'assistant', 'system')
            content: Message content
            metadata: Optional metadata

        Returns:
            Created message record
        """
        result = self.admin.table("chat_messages").insert({
            "conversation_id": conversation_id,
            "role": role,
            "content": content,
            "metadata": metadata or {},
        }).execute()

        # Update conversation timestamp
        self.admin.table("chat_conversations").update({
            "updated_at": "now()"
        }).eq("id", conversation_id).execute()

        return result.data[0]

    async def build_system_prompt(
        self,
        org_id: str,
        user_id: str,
        user_message: str,
        conversation_id: Optional[str] = None,
        pricing_mode: str = "pending"
    ) -> str:
        """
        Build system prompt with organization context, RAG, and past conversation context.

        Args:
            org_id: Organization UUID
            user_id: User UUID for retrieving past conversations
            user_message: Current user message for RAG context
            conversation_id: Current conversation ID to exclude from context
            pricing_mode: Pricing approach (pending, criteria, historical, combined)

        Returns:
            Formatted system prompt
        """
        # Get organization data
        profile = await self.org_service.get_company_profile(org_id)
        pricing = await self.org_service.get_pricing_profile(org_id)
        labor_items = await self.org_service.get_labor_items(org_id)

        # Get RAG context from documents
        doc_context = await self.embedding_service.get_org_context(org_id, user_message)

        # Get historical pricing context
        historical_pricing_context = await self._build_historical_pricing_context(
            org_id, user_message, pricing_mode
        )

        # Get format patterns from documents
        format_patterns = await self.format_extractor.get_org_format_patterns(org_id)
        format_context = self._build_format_context(format_patterns)

        # Get relevant past conversation context
        past_context = await self.get_relevant_past_context(
            org_id, user_id, user_message, conversation_id
        )

        # Format labor items (limit to prevent token overflow)
        if labor_items:
            labor_items_str = "\n".join([
                f"- {item['name']}: ${item['rate']}/{item['unit']} ({item.get('category', 'General')})"
                for item in labor_items[:25]
            ])
            if len(labor_items) > 25:
                labor_items_str += f"\n... and {len(labor_items) - 25} more items"
        else:
            labor_items_str = "No labor items configured yet. Ask the user about their rates."

        # Extract values with defaults
        company_name = "the contractor"
        if profile:
            company_name = profile.get("company_name") or company_name

        labor_rate = "N/A"
        overhead_markup = 0
        profit_margin = 0
        region = "Not specified"

        if pricing:
            labor_rate = str(pricing.get("labor_rate_per_hour", "N/A"))
            overhead_markup = float(pricing.get("overhead_markup") or 0) * 100
            profit_margin = float(pricing.get("profit_margin") or 0) * 100
            region = pricing.get("region") or "Not specified"

        # Get pricing mode instructions
        pricing_mode_instructions = self.PRICING_MODE_INSTRUCTIONS.get(
            pricing_mode, self.PRICING_MODE_INSTRUCTIONS["combined"]
        ).format(
            labor_rate=labor_rate,
            overhead_markup=overhead_markup,
            profit_margin=profit_margin
        )

        return self.SYSTEM_PROMPT_TEMPLATE.format(
            company_name=company_name,
            labor_rate=labor_rate,
            overhead_markup=overhead_markup,
            profit_margin=profit_margin,
            region=region,
            labor_items=labor_items_str,
            document_context=doc_context or "No relevant documents found for this query.",
            historical_pricing_context=historical_pricing_context,
            format_context=format_context,
            past_context=past_context,
            pricing_mode=pricing_mode,
            pricing_mode_instructions=pricing_mode_instructions,
        )

    async def _build_historical_pricing_context(
        self,
        org_id: str,
        user_message: str,
        pricing_mode: str
    ) -> str:
        """
        Build historical pricing context from similar projects.

        Args:
            org_id: Organization UUID
            user_message: User's message to find relevant projects
            pricing_mode: Current pricing mode

        Returns:
            Formatted historical pricing context string
        """
        # Skip if using criteria-only mode
        if pricing_mode == self.PRICING_MODE_CRITERIA:
            return ""

        try:
            # Find similar projects based on user's message
            similar_projects = await self.pricing_extractor.find_similar_projects(
                org_id, user_message, limit=3
            )

            if not similar_projects:
                return """## Historical Pricing
**⚠️ No similar historical projects found in your uploaded documents.**

Your estimate will be based on configured labor rates and general industry standards.
For more accurate, company-specific pricing:
- Upload past addendums or estimates for similar projects
- The AI will then base estimates on YOUR actual historical pricing

**IMPORTANT:** When no historical data is available, clearly state this to the user and explain that the estimate is based on industry averages, not company-specific data."""

            # Calculate average confidence
            confidences = [p.get("confidence_score", 0.5) for p in similar_projects]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.5

            # Build context header with strong instruction
            context_parts = [
                "## CRITICAL: Historical Pricing Data Available",
                f"**Found {len(similar_projects)} similar project(s) from your documents.**",
                "",
                "**INSTRUCTION:** Base your estimate primarily on these reference projects. Do NOT use generic industry averages when this data is available. Always cite which document(s) informed your pricing.",
                ""
            ]

            # Add confidence warning if low
            if avg_confidence < 0.7:
                context_parts.append(f"*Note: Data confidence is moderate ({avg_confidence:.0%}). Some line items may be incomplete.*\n")

            today = date.today()

            for i, project in enumerate(similar_projects, 1):
                project_type = project.get("project_type", "Unknown")
                total = project.get("total_amount")
                labor = project.get("labor_total")
                materials = project.get("materials_total")
                project_date = project.get("project_date")
                confidence = project.get("confidence_score", 0.5)

                # Calculate inflation adjustment
                inflation_note = ""
                if project_date:
                    try:
                        proj_date = date.fromisoformat(str(project_date))
                        years_old = (today - proj_date).days / 365
                        if years_old > 0.5:
                            inflation_pct = round(years_old * 4, 1)  # ~4% annual inflation
                            inflation_note = f" (add ~{inflation_pct}% for inflation)"
                    except (ValueError, TypeError):
                        pass

                project_line = f"### Reference {i}: {project_type}"
                if project_date:
                    project_line += f" ({project_date})"

                context_parts.append(project_line)

                if total:
                    context_parts.append(f"- **Total:** ${total:,.2f}{inflation_note}")
                if labor:
                    context_parts.append(f"- **Labor:** ${labor:,.2f}")
                if materials:
                    context_parts.append(f"- **Materials:** ${materials:,.2f}")

                # Include key line items (limit to 5 per project)
                line_items = project.get("line_items") or []
                if line_items and isinstance(line_items, list):
                    context_parts.append("- **Key Line Items:**")
                    for item in line_items[:5]:
                        if isinstance(item, dict):
                            item_name = item.get("item_name", "")
                            item_cost = item.get("total_cost")
                            if item_name and item_cost:
                                context_parts.append(f"  - {item_name}: ${item_cost:,.2f}")

                context_parts.append("")  # Add spacing between projects

            return "\n".join(context_parts)

        except Exception as e:
            # Don't fail the request if historical pricing fails
            print(f"Error building historical pricing context: {e}")
            return ""

    def detect_pricing_mode(self, user_message: str) -> Optional[str]:
        """
        Detect if user is selecting a pricing mode from their message.

        Args:
            user_message: User's response to pricing mode prompt

        Returns:
            Detected mode or None if not a mode selection
        """
        message_lower = user_message.lower().strip()

        # Check for explicit mode mentions
        if any(word in message_lower for word in ["criteria", "configured rate", "labor rate", "from scratch"]):
            return self.PRICING_MODE_CRITERIA

        if any(word in message_lower for word in ["historical", "past project", "reference", "similar project", "previous"]):
            if "combined" in message_lower or "both" in message_lower:
                return self.PRICING_MODE_COMBINED
            return self.PRICING_MODE_HISTORICAL

        if any(word in message_lower for word in ["combined", "both", "recommend"]):
            return self.PRICING_MODE_COMBINED

        # Check for option numbers
        if re.search(r'\b(option\s*)?1\b', message_lower):
            return self.PRICING_MODE_CRITERIA
        if re.search(r'\b(option\s*)?2\b', message_lower):
            return self.PRICING_MODE_HISTORICAL
        if re.search(r'\b(option\s*)?3\b', message_lower):
            return self.PRICING_MODE_COMBINED

        return None

    async def update_conversation_pricing_mode(
        self,
        conversation_id: str,
        pricing_mode: str
    ) -> dict:
        """
        Update the pricing mode for a conversation.

        Args:
            conversation_id: Conversation UUID
            pricing_mode: New pricing mode

        Returns:
            Updated conversation
        """
        result = self.admin.table("chat_conversations").update({
            "pricing_mode": pricing_mode,
            "updated_at": "now()"
        }).eq("id", conversation_id).execute()

        return result.data[0] if result.data else {}

    async def update_conversation_assumptions(
        self,
        conversation_id: str,
        assumptions: dict
    ) -> dict:
        """
        Update the pricing assumptions for a conversation.

        Args:
            conversation_id: Conversation UUID
            assumptions: Dict of assumptions made

        Returns:
            Updated conversation
        """
        result = self.admin.table("chat_conversations").update({
            "pricing_assumptions": assumptions,
            "updated_at": "now()"
        }).eq("id", conversation_id).execute()

        return result.data[0] if result.data else {}

    def _build_format_context(self, format_patterns: dict | None) -> str:
        """
        Build format context string from extracted patterns.

        Args:
            format_patterns: Aggregated format patterns or None

        Returns:
            Formatted context string for system prompt
        """
        if not format_patterns:
            return """## Document Format
No company documents uploaded yet. Before providing an estimate, ASK the user:
"What format would you like for this estimate? Options:
1. Simple summary (line items + total)
2. Detailed breakdown (labor, materials, overhead separately)
3. Formal proposal (with scope description, terms, and signature line)
Or describe your preferred format."

Once they specify, use that format consistently for the conversation."""

        sections = format_patterns.get("section_headers", [])
        numbering = format_patterns.get("numbering_style", "decimal")
        pricing_format = format_patterns.get("pricing_format", "")
        doc_count = format_patterns.get("document_count", 0)
        terminology = format_patterns.get("terminology", {})
        typography = format_patterns.get("typography", {})
        colors = format_patterns.get("colors", {})

        context_parts = [
            f"## Company Document Format (learned from {doc_count} documents)",
            f"- Use these sections: {', '.join(sections[:10])}" if sections else "",
            f"- Numbering style: {numbering}",
            f"- Pricing format: {pricing_format}" if pricing_format else "",
        ]

        # Add typography information
        if typography:
            typo_parts = []
            if typography.get("primary_font"):
                typo_parts.append(f"Primary font: {typography['primary_font']}")
            if typography.get("fonts_used"):
                fonts = typography["fonts_used"]
                if len(fonts) > 1:
                    typo_parts.append(f"Also uses: {', '.join(fonts[1:3])}")
            if typography.get("heading_sizes"):
                sizes = typography["heading_sizes"]
                size_str = ", ".join([
                    f"{k}={v}pt" for k, v in sizes.items() if v
                ])
                if size_str:
                    typo_parts.append(f"Heading sizes: {size_str}")
            if typography.get("uses_bold_for_emphasis"):
                typo_parts.append("Uses bold for emphasis")
            if typography.get("uses_italic_for_emphasis"):
                typo_parts.append("Uses italic for emphasis")

            if typo_parts:
                context_parts.append(f"- Typography: {'; '.join(typo_parts)}")

        # Add color information
        if colors:
            color_parts = []
            if colors.get("primary_text_color") and colors["primary_text_color"] != "#000000":
                color_parts.append(f"Text: {colors['primary_text_color']}")
            if colors.get("colors_used"):
                non_black = [c for c in colors["colors_used"] if c != "#000000"]
                if non_black:
                    color_parts.append(f"Accent colors: {', '.join(non_black[:3])}")

            if color_parts:
                context_parts.append(f"- Colors: {'; '.join(color_parts)}")

        # Add terminology if available
        if terminology:
            key_terms = terminology.get("key_terms", [])
            if key_terms:
                context_parts.append(f"- Key terminology: {', '.join(key_terms[:10])}")
            phrasing = terminology.get("phrasing_patterns", [])
            if phrasing:
                context_parts.append(f"- Common phrases: {', '.join(phrasing[:5])}")

        context_parts.append("\nReplicate the style and format of this company's existing documents.")

        return "\n".join(part for part in context_parts if part)

    async def stream_response(
        self,
        org_id: str,
        user_id: str,
        conversation_id: str,
        user_message: str,
    ) -> AsyncGenerator[str, None]:
        """
        Stream AI response for a message.

        Handles pricing mode selection on first message and injects
        historical pricing context based on selected mode.

        Args:
            org_id: Organization UUID
            user_id: User UUID for context retrieval
            conversation_id: Conversation UUID
            user_message: User's message

        Yields:
            Response content chunks
        """
        # Get conversation history
        conv = await self.get_conversation(conversation_id)
        history = conv.get("messages", []) if conv else []
        # Default to combined mode for best results (uses both historical pricing AND configured rates)
        pricing_mode = conv.get("pricing_mode", self.PRICING_MODE_COMBINED) if conv else self.PRICING_MODE_COMBINED

        # Build messages for API (limit history to recent messages)
        messages = [
            {"role": msg["role"], "content": msg["content"]}
            for msg in history[-20:]  # Keep last 20 messages for context
        ]
        messages.append({"role": "user", "content": user_message})

        # Build system prompt with RAG context and pricing mode
        system_prompt = await self.build_system_prompt(
            org_id, user_id, user_message, conversation_id, pricing_mode
        )

        # Collect full response for storage
        full_response = ""

        async for chunk in self.openrouter.chat_completion_stream(
            messages=messages,
            system_prompt=system_prompt,
        ):
            full_response += chunk
            yield chunk

        # Save assistant message after streaming completes
        await self.add_message(
            conversation_id,
            "assistant",
            full_response,
            {"model": self.openrouter.default_model, "pricing_mode": pricing_mode}
        )

        # Update conversation metadata after response (async, don't block)
        # Get updated message count
        updated_conv = await self.get_conversation(conversation_id)
        message_count = len(updated_conv.get("messages", [])) if updated_conv else 0

        # Generate metadata after 3+ messages
        if message_count >= 3:
            asyncio.create_task(
                self.update_conversation_metadata(conversation_id)
            )

    async def get_user_conversations(
        self,
        org_id: str,
        user_id: str,
        saved_only: bool = False,
        limit: int = 50
    ) -> List[dict]:
        """
        Get user's conversations.

        Args:
            org_id: Organization UUID
            user_id: User UUID
            saved_only: Only return saved conversations (default False since auto-save)
            limit: Maximum results

        Returns:
            List of conversations with metadata
        """
        query = self.admin.table("chat_conversations").select(
            "id, organization_id, user_id, title, summary, tags, message_count, "
            "project_context, is_saved, created_at, updated_at"
        ).eq(
            "organization_id", org_id
        ).eq("user_id", user_id)

        if saved_only:
            query = query.eq("is_saved", True)

        result = query.order("updated_at", desc=True).limit(limit).execute()
        return result.data or []

    async def save_conversation(
        self,
        conversation_id: str,
        title: Optional[str] = None
    ) -> dict:
        """
        Mark a conversation as saved.

        Args:
            conversation_id: Conversation UUID
            title: Optional new title

        Returns:
            Updated conversation
        """
        update_data = {"is_saved": True, "updated_at": "now()"}
        if title:
            update_data["title"] = title

        result = self.admin.table("chat_conversations").update(update_data).eq(
            "id", conversation_id
        ).execute()

        return result.data[0]

    async def delete_conversation(self, conversation_id: str) -> bool:
        """
        Delete a conversation and its messages.

        Args:
            conversation_id: Conversation UUID

        Returns:
            True if deleted
        """
        # Messages are cascade deleted via foreign key
        self.admin.table("chat_conversations").delete().eq(
            "id", conversation_id
        ).execute()
        return True

    async def generate_conversation_title(
        self,
        conversation_id: str
    ) -> str:
        """
        Generate a title for a conversation based on its content.

        Args:
            conversation_id: Conversation UUID

        Returns:
            Generated title
        """
        conv = await self.get_conversation(conversation_id)
        if not conv or not conv.get("messages"):
            return "New Estimate"

        # Get first few messages
        messages = conv["messages"][:3]
        context = "\n".join([
            f"{m['role']}: {m['content'][:200]}"
            for m in messages
        ])

        # Use LLM to generate title
        title = await self.openrouter.chat_completion(
            messages=[{
                "role": "user",
                "content": f"Generate a short (3-5 word) title for this conversation about a home renovation estimate:\n\n{context}\n\nTitle:"
            }],
            temperature=0.5,
            max_tokens=20,
        )

        return title.strip().strip('"').strip("'")[:50]

    async def generate_summary(self, conversation_id: str) -> str:
        """
        Generate a 1-2 sentence summary of the conversation.

        Args:
            conversation_id: Conversation UUID

        Returns:
            Generated summary
        """
        conv = await self.get_conversation(conversation_id)
        if not conv or not conv.get("messages"):
            return ""

        # Get all messages, limit content length
        messages = conv["messages"]
        context = "\n".join([
            f"{m['role']}: {m['content'][:300]}"
            for m in messages[:10]  # Limit to first 10 messages
        ])

        summary = await self.openrouter.chat_completion(
            messages=[{
                "role": "user",
                "content": f"""Summarize this contractor estimate conversation in 1-2 sentences. Focus on:
- The project type (bathroom, kitchen, etc.)
- Key details discussed (dimensions, materials, budget)
- Any estimates or quotes provided

Conversation:
{context}

Summary:"""
            }],
            temperature=0.3,
            max_tokens=100,
        )

        return summary.strip()[:500]

    def extract_tags(self, messages: List[dict]) -> List[str]:
        """
        Extract project tags from conversation messages.

        Args:
            messages: List of conversation messages

        Returns:
            List of relevant project tags
        """
        # Combine all message content
        content = " ".join([
            m["content"].lower()
            for m in messages
            if m.get("content")
        ])

        # Find matching tags
        found_tags = set()
        for tag, keywords in PROJECT_TAGS.items():
            for keyword in keywords:
                if keyword in content:
                    found_tags.add(tag)
                    break

        return list(found_tags)[:5]  # Limit to 5 tags

    async def extract_project_context(self, conversation_id: str) -> dict:
        """
        Extract structured project details from conversation.

        Args:
            conversation_id: Conversation UUID

        Returns:
            Structured project context dict
        """
        conv = await self.get_conversation(conversation_id)
        if not conv or not conv.get("messages"):
            return {}

        messages = conv["messages"]
        context = "\n".join([
            f"{m['role']}: {m['content'][:300]}"
            for m in messages[:10]
        ])

        # Use LLM to extract structured data
        response = await self.openrouter.chat_completion(
            messages=[{
                "role": "user",
                "content": f"""Extract key project details from this conversation. Return ONLY a JSON object with these fields (use null for unknown values):
{{
  "project_type": "bathroom/kitchen/flooring/etc",
  "rooms": ["list of rooms mentioned"],
  "materials": ["list of materials discussed"],
  "dimensions": "any dimensions mentioned",
  "budget": "budget if mentioned",
  "timeline": "timeline if mentioned"
}}

Conversation:
{context}

JSON:"""
            }],
            temperature=0.1,
            max_tokens=200,
        )

        try:
            import json
            # Clean up response and parse
            clean_response = response.strip()
            if clean_response.startswith("```"):
                clean_response = clean_response.split("```")[1]
                if clean_response.startswith("json"):
                    clean_response = clean_response[4:]
            return json.loads(clean_response)
        except (json.JSONDecodeError, IndexError):
            return {}

    async def update_conversation_metadata(self, conversation_id: str) -> dict:
        """
        Update conversation with generated summary, tags, and project context.

        Args:
            conversation_id: Conversation UUID

        Returns:
            Updated conversation record
        """
        conv = await self.get_conversation(conversation_id)
        if not conv:
            return {}

        messages = conv.get("messages", [])

        # Generate all metadata in parallel
        summary_task = self.generate_summary(conversation_id)
        context_task = self.extract_project_context(conversation_id)

        summary, project_context = await asyncio.gather(
            summary_task, context_task
        )

        # Extract tags synchronously (fast operation)
        tags = self.extract_tags(messages)

        # Generate title if still default
        title = conv.get("title")
        if not title or title == "New Estimate":
            title = await self.generate_conversation_title(conversation_id)

        # Update database
        update_data = {
            "summary": summary,
            "tags": tags,
            "project_context": project_context,
            "title": title,
            "updated_at": "now()",
        }

        result = self.admin.table("chat_conversations").update(update_data).eq(
            "id", conversation_id
        ).execute()

        return result.data[0] if result.data else {}

    async def search_conversations(
        self,
        org_id: str,
        user_id: str,
        query: str,
        limit: int = 20
    ) -> List[dict]:
        """
        Search user's conversations using full-text search.

        Args:
            org_id: Organization UUID
            user_id: User UUID
            query: Search query
            limit: Maximum results

        Returns:
            List of matching conversations
        """
        result = self.admin.rpc(
            "search_conversations",
            {
                "search_query": query,
                "search_org_id": org_id,
                "search_user_id": user_id,
                "result_limit": limit,
            }
        ).execute()

        return result.data or []

    async def get_relevant_past_context(
        self,
        org_id: str,
        user_id: str,
        current_query: str,
        exclude_conversation_id: Optional[str] = None
    ) -> str:
        """
        Retrieve relevant past conversation context for AI continuity.

        Args:
            org_id: Organization UUID
            user_id: User UUID
            current_query: Current user message for relevance matching
            exclude_conversation_id: Current conversation to exclude

        Returns:
            Formatted past context string for system prompt
        """
        try:
            result = self.admin.rpc(
                "get_relevant_conversations",
                {
                    "search_query": current_query,
                    "search_org_id": org_id,
                    "search_user_id": user_id,
                    "exclude_conversation_id": exclude_conversation_id,
                    "result_limit": 3,
                }
            ).execute()

            conversations = result.data or []

            if not conversations:
                return ""

            # Build context string (limit to ~1500 chars)
            context_parts = ["## Previous Conversations with This User"]
            char_count = 0
            max_chars = 1500

            for conv in conversations:
                if char_count >= max_chars:
                    break

                title = conv.get("title", "Untitled")
                summary = conv.get("summary", "")
                tags = conv.get("tags", [])
                project_ctx = conv.get("project_context", {})

                entry = f"\n### {title}"
                if tags:
                    entry += f" [{', '.join(tags)}]"
                if summary:
                    entry += f"\n{summary}"
                if project_ctx:
                    details = []
                    if project_ctx.get("dimensions"):
                        details.append(f"Dimensions: {project_ctx['dimensions']}")
                    if project_ctx.get("budget"):
                        details.append(f"Budget: {project_ctx['budget']}")
                    if project_ctx.get("materials"):
                        materials = project_ctx["materials"][:3]
                        details.append(f"Materials: {', '.join(materials)}")
                    if details:
                        entry += f"\nDetails: {'; '.join(details)}"

                if char_count + len(entry) <= max_chars:
                    context_parts.append(entry)
                    char_count += len(entry)

            if len(context_parts) > 1:
                return "\n".join(context_parts)
            return ""

        except Exception as e:
            # Don't fail the request if context retrieval fails
            print(f"Error retrieving past context: {e}")
            return ""
