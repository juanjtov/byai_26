from typing import Optional
from app.services.supabase import get_supabase_admin


class OrganizationService:
    """Service for organization operations."""

    def __init__(self):
        self.admin = get_supabase_admin()

    async def get_organization(self, org_id: str) -> Optional[dict]:
        """Get organization by ID."""
        response = self.admin.table("organizations").select("*").eq("id", org_id).execute()
        return response.data[0] if response.data else None

    async def get_company_profile(self, org_id: str) -> Optional[dict]:
        """Get company profile for organization."""
        response = self.admin.table("company_profiles").select("*").eq("organization_id", org_id).execute()
        return response.data[0] if response.data else None

    async def update_company_profile(self, org_id: str, data: dict) -> dict:
        """Update company profile."""
        # Remove None values
        update_data = {k: v for k, v in data.items() if v is not None}
        update_data["updated_at"] = "now()"

        response = self.admin.table("company_profiles").update(update_data).eq("organization_id", org_id).execute()

        if not response.data:
            raise ValueError("Failed to update company profile")

        return response.data[0]

    async def get_pricing_profile(self, org_id: str) -> Optional[dict]:
        """Get pricing profile for organization."""
        response = self.admin.table("pricing_profiles").select("*").eq("organization_id", org_id).execute()
        return response.data[0] if response.data else None

    async def update_pricing_profile(self, org_id: str, data: dict) -> dict:
        """Update pricing profile."""
        update_data = {k: v for k, v in data.items() if v is not None}
        update_data["updated_at"] = "now()"

        response = self.admin.table("pricing_profiles").update(update_data).eq("organization_id", org_id).execute()

        if not response.data:
            raise ValueError("Failed to update pricing profile")

        return response.data[0]

    async def get_labor_items(self, org_id: str) -> list[dict]:
        """Get all labor items for organization."""
        response = self.admin.table("labor_items").select("*").eq("organization_id", org_id).order("category").execute()
        return response.data or []

    async def create_labor_item(self, org_id: str, data: dict) -> dict:
        """Create a new labor item."""
        item_data = {
            "organization_id": org_id,
            "name": data["name"],
            "unit": data["unit"],
            "rate": data["rate"],
            "category": data.get("category"),
        }

        response = self.admin.table("labor_items").insert(item_data).execute()

        if not response.data:
            raise ValueError("Failed to create labor item")

        return response.data[0]

    async def update_labor_item(self, item_id: str, data: dict) -> dict:
        """Update a labor item."""
        update_data = {k: v for k, v in data.items() if v is not None}

        response = self.admin.table("labor_items").update(update_data).eq("id", item_id).execute()

        if not response.data:
            raise ValueError("Failed to update labor item")

        return response.data[0]

    async def delete_labor_item(self, item_id: str) -> bool:
        """Delete a labor item."""
        self.admin.table("labor_items").delete().eq("id", item_id).execute()
        return True
