"""
Authentication schemas.

Note: SignupRequest and LoginRequest have been removed.
Auth is now handled directly by Supabase on the frontend.
"""

from pydantic import BaseModel
from typing import Optional


class UserInfo(BaseModel):
    """User information."""
    id: str
    email: str


class OrganizationInfo(BaseModel):
    """Organization information with user's role."""
    id: str
    name: str
    slug: str
    role: str
    logo_url: Optional[str] = None


class UserResponse(BaseModel):
    """Response for /me endpoint."""
    user: UserInfo
    organization: Optional[OrganizationInfo] = None
