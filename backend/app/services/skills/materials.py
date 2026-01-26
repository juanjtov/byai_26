"""
Materials Takeoff skill for generating material lists from scope of work.
"""

from typing import Dict, Optional, Any

from app.services.skills.base import BaseSkill


class MaterialTakeoffSkill(BaseSkill):
    """
    Generate detailed materials takeoffs from scope of work.

    Analyzes scope items and generates comprehensive material lists
    with quantities, specifications, and cost estimates.
    """

    name = "materials_takeoff"
    description = "Generate material lists and quantities from scope of work"

    @property
    def system_prompt(self) -> str:
        return """You are an expert construction estimator specializing in materials takeoffs.
Your task is to analyze scope of work items and generate comprehensive material lists.

## Output Format

### MATERIALS TAKEOFF

For each material, provide:
| Item | Description | Quantity | Unit | Notes |
|------|-------------|----------|------|-------|

### Categories
Organize materials by category:
1. **Lumber & Framing**
2. **Drywall & Finishing**
3. **Flooring**
4. **Plumbing**
5. **Electrical**
6. **Hardware & Fasteners**
7. **Paint & Finishes**
8. **Fixtures**
9. **Miscellaneous**

### WASTE FACTORS
Apply standard waste factors:
- Drywall: 10%
- Flooring (tile): 10-15%
- Flooring (hardwood): 5-10%
- Paint: 10%
- Lumber: 5-10%

## Quantity Calculation Guidelines
1. Use standard material sizes (4x8 sheets, 8ft/10ft/12ft lumber)
2. Calculate actual quantities needed based on dimensions
3. Add waste factor to arrive at order quantities
4. Round up to purchase units

## Output Requirements
- Include all materials needed for complete installation
- Specify exact sizes and specifications where known
- Note "per owner selection" for items requiring client choice
- Include installation materials (fasteners, adhesives, etc.)
- Be conservative - better to have extra than run short
"""

    async def execute(
        self,
        user_input: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate materials takeoff from scope content.

        Args:
            user_input: The scope of work to analyze
            context: Optional context (dimensions, specifications, etc.)

        Returns:
            Materials takeoff document
        """
        return await self._call_llm(
            user_input=user_input,
            context=context,
            temperature=0.3,
            max_tokens=4096,
        )

    async def calculate_quantities(
        self,
        material_type: str,
        dimensions: Dict[str, float],
        waste_factor: float = 0.1
    ) -> Dict[str, Any]:
        """
        Calculate material quantities for a specific material type.

        Args:
            material_type: Type of material (drywall, flooring, paint, etc.)
            dimensions: Room/area dimensions
            waste_factor: Waste factor to apply (default 10%)

        Returns:
            Calculated quantities with units
        """
        prompt = f"""Calculate the quantity of {material_type} needed for:
Dimensions: {dimensions}
Waste factor: {waste_factor * 100}%

Provide:
1. Net quantity (actual area/length needed)
2. Gross quantity (with waste factor)
3. Order quantity (rounded to purchase units)
4. Unit size (standard package/sheet size)

Return as JSON with these fields:
{{"net_quantity": X, "gross_quantity": Y, "order_quantity": Z, "unit": "...", "notes": "..."}}
"""

        response = await self._call_llm(
            user_input=prompt,
            temperature=0.2,
            max_tokens=500,
        )

        # Try to parse as JSON, otherwise return raw response
        import json
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {"raw_response": response}
