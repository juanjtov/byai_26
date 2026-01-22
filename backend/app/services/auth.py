from typing import Optional
from supabase import Client

from app.services.supabase import get_supabase_client, get_supabase_admin


class AuthService:
    """Service for authentication operations."""

    def __init__(self):
        self.client = get_supabase_client()
        self.admin = get_supabase_admin()

    async def signup(self, email: str, password: str, org_name: str) -> dict:
        """
        Sign up a new user and create their organization.
        Returns user data and organization info.
        """
        # Create user in Supabase Auth
        auth_response = self.client.auth.sign_up({
            "email": email,
            "password": password,
        })

        if auth_response.user is None:
            raise ValueError("Failed to create user")

        user_id = auth_response.user.id

        # Create organization
        org_slug = org_name.lower().replace(" ", "-").replace("'", "")
        org_response = self.admin.table("organizations").insert({
            "name": org_name,
            "slug": org_slug,
        }).execute()

        if not org_response.data:
            raise ValueError("Failed to create organization")

        org_id = org_response.data[0]["id"]

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

        return {
            "user": {
                "id": user_id,
                "email": email,
            },
            "organization": org_response.data[0],
            "session": auth_response.session,
        }

    async def login(self, email: str, password: str) -> dict:
        """Log in a user and return session info."""
        auth_response = self.client.auth.sign_in_with_password({
            "email": email,
            "password": password,
        })

        if auth_response.user is None:
            raise ValueError("Invalid credentials")

        # Get user's organization
        member_response = self.admin.table("organization_members").select(
            "organization_id, role, organizations(*)"
        ).eq("user_id", auth_response.user.id).execute()

        organization = None
        if member_response.data:
            org_data = member_response.data[0]
            organization = {
                **org_data["organizations"],
                "role": org_data["role"],
            }

        return {
            "user": {
                "id": auth_response.user.id,
                "email": auth_response.user.email,
            },
            "organization": organization,
            "session": {
                "access_token": auth_response.session.access_token,
                "refresh_token": auth_response.session.refresh_token,
                "expires_at": auth_response.session.expires_at,
            },
        }

    async def get_current_user(self, access_token: str) -> Optional[dict]:
        """Get current user from access token."""
        try:
            user_response = self.client.auth.get_user(access_token)
            if user_response.user is None:
                return None

            # Get user's organization
            member_response = self.admin.table("organization_members").select(
                "organization_id, role, organizations(*)"
            ).eq("user_id", user_response.user.id).execute()

            organization = None
            if member_response.data:
                org_data = member_response.data[0]
                organization = {
                    **org_data["organizations"],
                    "role": org_data["role"],
                }

            return {
                "user": {
                    "id": user_response.user.id,
                    "email": user_response.user.email,
                },
                "organization": organization,
            }
        except Exception:
            return None

    async def logout(self, access_token: str) -> bool:
        """Log out user."""
        try:
            self.client.auth.sign_out()
            return True
        except Exception:
            return False
