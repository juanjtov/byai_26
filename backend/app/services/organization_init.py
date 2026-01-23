"""
Organization initialization service.

Handles creating organizations for newly signed-up users.
Called after Supabase Auth signup completes.
"""

import re
from typing import Optional

from app.services.supabase import get_supabase_secret_client


class OrganizationInitService:
    """Service for initializing organizations for new users."""

    def __init__(self):
        self.admin = get_supabase_secret_client()

    def _generate_slug(self, name: str) -> str:
        """
        Generate URL-friendly slug from organization name.

        Args:
            name: The organization name

        Returns:
            A lowercase, hyphenated slug
        """
        slug = name.lower()
        slug = re.sub(r"[^a-z0-9\s-]", "", slug)
        slug = re.sub(r"[\s]+", "-", slug)
        slug = slug.strip("-")
        return slug

    def _generate_unique_slug(self, name: str) -> str:
        """
        Generate unique URL-friendly slug, appending counter if collision exists.

        Args:
            name: The organization name

        Returns:
            A unique lowercase, hyphenated slug
        """
        base_slug = self._generate_slug(name)
        if not base_slug:
            base_slug = "organization"
        slug = base_slug
        counter = 1

        while True:
            existing = self.admin.table("organizations").select("id").eq("slug", slug).execute()
            if not existing.data:
                return slug
            counter += 1
            slug = f"{base_slug}-{counter}"

    async def initialize_for_user(
        self,
        user_id: str,
        org_name: str,
        user_email: Optional[str] = None,
    ) -> dict:
        """
        Initialize organization for a user.

        If user already has an organization, returns existing org.
        Otherwise creates new org with company/pricing profiles.

        Args:
            user_id: The Supabase user UUID
            org_name: The organization name to create
            user_email: Optional user email (for reference)

        Returns:
            dict with 'organization' and 'is_new' flag

        Raises:
            ValueError: If organization creation fails
        """
        # Check if user already has an organization
        existing = self.admin.table("organization_members").select(
            "organization_id, role, organizations(*)"
        ).eq("user_id", user_id).execute()

        if existing.data:
            # User already has an org - return it
            org_data = existing.data[0]
            return {
                "organization": {
                    "id": org_data["organizations"]["id"],
                    "name": org_data["organizations"]["name"],
                    "slug": org_data["organizations"]["slug"],
                    "role": org_data["role"],
                    "logo_url": org_data["organizations"].get("logo_url"),
                },
                "is_new": False,
            }

        # Create new organization with unique slug
        org_slug = self._generate_unique_slug(org_name)

        org_response = self.admin.table("organizations").insert({
            "name": org_name,
            "slug": org_slug,
        }).execute()

        if not org_response.data:
            raise ValueError("Failed to create organization")

        org_id = org_response.data[0]["id"]

        try:
            # Add user as organization owner
            self.admin.table("organization_members").insert({
                "organization_id": org_id,
                "user_id": user_id,
                "role": "owner",
            }).execute()

            # Create empty company profile
            self.admin.table("company_profiles").insert({
                "organization_id": org_id,
            }).execute()

            # Create empty pricing profile
            self.admin.table("pricing_profiles").insert({
                "organization_id": org_id,
            }).execute()
        except Exception as e:
            # Cleanup: delete the organization if subsequent inserts fail
            self.admin.table("organizations").delete().eq("id", org_id).execute()
            raise ValueError(f"Failed to initialize organization: {str(e)}")

        return {
            "organization": {
                "id": org_id,
                "name": org_name,
                "slug": org_slug,
                "role": "owner",
                "logo_url": None,
            },
            "is_new": True,
        }

    async def get_user_organization(self, user_id: str) -> Optional[dict]:
        """
        Get user's organization data.

        Args:
            user_id: The Supabase user UUID

        Returns:
            Organization data dict or None if user has no org
        """
        member_response = self.admin.table("organization_members").select(
            "organization_id, role, organizations(*)"
        ).eq("user_id", user_id).execute()

        if not member_response.data:
            return None

        org_data = member_response.data[0]
        return {
            "id": org_data["organizations"]["id"],
            "name": org_data["organizations"]["name"],
            "slug": org_data["organizations"]["slug"],
            "role": org_data["role"],
            "logo_url": org_data["organizations"].get("logo_url"),
        }
