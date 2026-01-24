"""
Chat service for AI-powered estimate generation.

Handles conversations, messages, and RAG-enhanced AI responses.
"""

from typing import Optional, List, Dict, AsyncGenerator

from app.services.supabase import get_supabase_admin
from app.services.openrouter import OpenRouterService
from app.services.embedding import EmbeddingService
from app.services.organization import OrganizationService
from app.services.format_extractor import FormatExtractorService


class ChatService:
    """Service for managing chat conversations and AI responses."""

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

{format_context}

## Assumption Handling Rules
- NEVER invent project scope beyond what the user described
- When details are unknown, use neutral phrasing: "Install vanity (size/style per owner selection)"
- Ask clarifying questions for: dimensions, material grades, fixture counts, access conditions
- Keep assumptions minimal and conservative
- Do not include pricing unless you have specific rates from context

## Quality Guidelines
- Scope matches user intent exactly - no additions
- All unknown specifications phrased neutrally
- Pricing uses organization's actual rates from uploaded documents

## Interaction Guidelines
1. Ask clarifying questions about project scope, materials, and specifications before providing estimates
2. Use the organization's labor items and rates when calculating costs
3. Apply overhead and profit margins to arrive at final prices
4. Provide itemized breakdowns when giving estimates
5. Be conversational but professional
6. If you don't have enough information to estimate accurately, ask before guessing
7. Reference pricing from uploaded documents when relevant

Remember: You represent this contractor's business. Use their actual rates and pricing from the context provided."""

    def __init__(self):
        self.admin = get_supabase_admin()
        self.openrouter = OpenRouterService()
        self.embedding_service = EmbeddingService()
        self.org_service = OrganizationService()
        self.format_extractor = FormatExtractorService()

    async def create_conversation(
        self,
        org_id: str,
        user_id: str,
        title: Optional[str] = None
    ) -> dict:
        """
        Create a new chat conversation.

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
            "is_saved": False,
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

    async def build_system_prompt(self, org_id: str, user_message: str) -> str:
        """
        Build system prompt with organization context and RAG.

        Args:
            org_id: Organization UUID
            user_message: Current user message for RAG context

        Returns:
            Formatted system prompt
        """
        # Get organization data
        profile = await self.org_service.get_company_profile(org_id)
        pricing = await self.org_service.get_pricing_profile(org_id)
        labor_items = await self.org_service.get_labor_items(org_id)

        # Get RAG context from documents
        doc_context = await self.embedding_service.get_org_context(org_id, user_message)

        # Get format patterns from documents
        format_patterns = await self.format_extractor.get_org_format_patterns(org_id)
        format_context = self._build_format_context(format_patterns)

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

        return self.SYSTEM_PROMPT_TEMPLATE.format(
            company_name=company_name,
            labor_rate=labor_rate,
            overhead_markup=overhead_markup,
            profit_margin=profit_margin,
            region=region,
            labor_items=labor_items_str,
            document_context=doc_context or "No relevant documents found for this query.",
            format_context=format_context,
        )

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

        context_parts = [
            f"## Company Document Format (learned from {doc_count} documents)",
            f"- Use these sections: {', '.join(sections[:10])}" if sections else "",
            f"- Numbering style: {numbering}",
            f"- Pricing format: {pricing_format}" if pricing_format else "",
        ]

        # Add terminology if available
        if terminology:
            key_terms = terminology.get("key_terms", [])
            if key_terms:
                context_parts.append(f"- Key terminology: {', '.join(key_terms[:10])}")

        context_parts.append("\nReplicate the style and format of this company's existing documents.")

        return "\n".join(part for part in context_parts if part)

    async def stream_response(
        self,
        org_id: str,
        conversation_id: str,
        user_message: str,
    ) -> AsyncGenerator[str, None]:
        """
        Stream AI response for a message.

        Args:
            org_id: Organization UUID
            conversation_id: Conversation UUID
            user_message: User's message

        Yields:
            Response content chunks
        """
        # Get conversation history
        conv = await self.get_conversation(conversation_id)

        # Build messages for API (limit history to recent messages)
        history = conv.get("messages", []) if conv else []
        messages = [
            {"role": msg["role"], "content": msg["content"]}
            for msg in history[-20:]  # Keep last 20 messages for context
        ]
        messages.append({"role": "user", "content": user_message})

        # Build system prompt with RAG context
        system_prompt = await self.build_system_prompt(org_id, user_message)

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
            {"model": self.openrouter.default_model}
        )

    async def get_user_conversations(
        self,
        org_id: str,
        user_id: str,
        saved_only: bool = True,
        limit: int = 50
    ) -> List[dict]:
        """
        Get user's conversations.

        Args:
            org_id: Organization UUID
            user_id: User UUID
            saved_only: Only return saved conversations
            limit: Maximum results

        Returns:
            List of conversations
        """
        query = self.admin.table("chat_conversations").select("*").eq(
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
