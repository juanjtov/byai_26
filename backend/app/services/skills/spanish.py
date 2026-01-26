"""
Spanish Job Order skill for generating field-ready documentation in Spanish.
"""

from typing import Dict, Optional, Any

from app.services.skills.base import BaseSkill


class SpanishJobOrderSkill(BaseSkill):
    """
    Generate Spanish job orders (orden de trabajo) from estimates.

    Translates scope items to Spanish and includes rough materials lists
    for field crews.
    """

    name = "spanish_job_order"
    description = "Generate Spanish job orders from English estimates"

    @property
    def system_prompt(self) -> str:
        return """You are an expert translator specializing in construction and renovation terminology.
Your task is to create Spanish job orders (orden de trabajo) from English estimates.

## Output Format

Create a document with these sections:

### ORDEN DE TRABAJO
[Project name/address in Spanish]

### FECHA: [Current date]

### ALCANCE DEL TRABAJO (Scope of Work)
Translate each scope item to clear, actionable Spanish that field workers can understand.
Use common construction terminology used in Latin American Spanish.

### MATERIALES APROXIMADOS (Rough Materials)
List rough quantities of materials needed based on the scope.
Use metric units where appropriate.

### NOTAS IMPORTANTES (Important Notes)
Include any safety notes, access requirements, or special instructions.

## Translation Guidelines
1. Use clear, simple Spanish suitable for field crews
2. Keep technical terms that are commonly understood (e.g., "drywall", "PVC")
3. Include quantities and measurements from the original
4. Use imperative verb forms for action items (e.g., "Instalar", "Remover")
5. Be specific about locations (e.g., "en el baño principal")

## Quality Standards
- Accurate translation of all scope items
- No scope creep - translate only what is specified
- Include all measurements and quantities
- Materials list should be practical and complete
"""

    async def execute(
        self,
        user_input: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate Spanish job order from estimate content.

        Args:
            user_input: The estimate or scope content to translate
            context: Optional context (company name, project address, etc.)

        Returns:
            Spanish job order document
        """
        return await self._call_llm(
            user_input=user_input,
            context=context,
            temperature=0.3,  # Lower temperature for consistent translations
            max_tokens=4096,
        )

    async def translate_scope_items(
        self,
        scope_items: list[str],
        context: Optional[Dict[str, Any]] = None
    ) -> list[str]:
        """
        Translate a list of scope items to Spanish.

        Args:
            scope_items: List of English scope items
            context: Optional context

        Returns:
            List of translated scope items
        """
        items_text = "\n".join([f"- {item}" for item in scope_items])

        prompt = f"""Translate these scope items to Spanish for a field job order.
Keep the format as a bulleted list.

{items_text}

Return only the translated items, one per line with bullet points."""

        response = await self._call_llm(
            user_input=prompt,
            context=context,
            temperature=0.2,
            max_tokens=2000,
        )

        # Parse response back into list
        lines = response.strip().split("\n")
        translated = [line.lstrip("- •").strip() for line in lines if line.strip()]

        return translated
