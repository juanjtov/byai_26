from typing import Optional
from app.services.supabase import get_supabase_admin


class WaitlistService:
    """Service for waitlist operations."""

    def __init__(self):
        self.admin = get_supabase_admin()

    async def add_to_waitlist(self, email: str, source: str = "landing_page") -> dict:
        """
        Add an email to the waitlist.
        Returns the created entry or raises an error if duplicate.
        """
        # Check if email already exists
        existing = self.admin.table("waitlist").select("id, email").eq("email", email).execute()

        if existing.data:
            raise ValueError("This email is already on the waitlist")

        # Insert new entry
        response = self.admin.table("waitlist").insert({
            "email": email,
            "source": source,
            "status": "pending",
        }).execute()

        if not response.data:
            raise ValueError("Failed to add to waitlist")

        return response.data[0]

    async def get_waitlist_entry(self, email: str) -> Optional[dict]:
        """Get a waitlist entry by email."""
        response = self.admin.table("waitlist").select("*").eq("email", email).execute()
        return response.data[0] if response.data else None

    async def update_status(self, email: str, status: str) -> dict:
        """Update the status of a waitlist entry."""
        response = self.admin.table("waitlist").update({
            "status": status,
            "updated_at": "now()",
        }).eq("email", email).execute()

        if not response.data:
            raise ValueError("Waitlist entry not found")

        return response.data[0]

    async def get_all_entries(self, status: Optional[str] = None) -> list[dict]:
        """Get all waitlist entries, optionally filtered by status."""
        query = self.admin.table("waitlist").select("*").order("created_at", desc=True)

        if status:
            query = query.eq("status", status)

        response = query.execute()
        return response.data or []
