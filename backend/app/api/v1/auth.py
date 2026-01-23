"""
Authentication endpoints.

Auth is now handled by Supabase directly on the frontend.
Backend only verifies JWTs and handles organization initialization.
"""

import re

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, field_validator

from app.dependencies import get_current_user_id
from app.services.organization_init import OrganizationInitService
from app.schemas.auth import OrganizationInfo, UserInfo, UserResponse

router = APIRouter()
org_init_service = OrganizationInitService()


class InitializeOrganizationRequest(BaseModel):
    """Request body for organization initialization."""
    organization_name: str

    @field_validator('organization_name')
    @classmethod
    def validate_organization_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError('Organization name cannot be empty')
        # Check if name produces valid slug (has at least one alphanumeric char)
        slug = re.sub(r"[^a-z0-9\s-]", "", v.lower())
        slug = re.sub(r"[\s]+", "-", slug).strip("-")
        if not slug:
            raise ValueError('Organization name must contain at least one letter or number')
        return v


class InitializeOrganizationResponse(BaseModel):
    """Response for organization initialization."""
    organization: OrganizationInfo
    is_new: bool


@router.post("/initialize-organization", response_model=InitializeOrganizationResponse)
async def initialize_organization(
    request: InitializeOrganizationRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Initialize organization for a newly signed-up user.

    Called by frontend after Supabase signup completes.
    - If user already has an org, returns existing org
    - If user has no org, creates one with company/pricing profiles

    Requires valid Supabase JWT in Authorization header.
    """
    try:
        result = await org_init_service.initialize_for_user(
            user_id=user_id,
            org_name=request.organization_name,
        )
        return InitializeOrganizationResponse(
            organization=OrganizationInfo(**result["organization"]),
            is_new=result["is_new"],
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize organization: {str(e)}")


@router.get("/me", response_model=UserResponse)
async def get_current_user(user_id: str = Depends(get_current_user_id)):
    """
    Get the current authenticated user and their organization.

    JWT is verified via JWKS (no Supabase API call for auth).
    Organization data is fetched from database.
    """
    # Get user's organization
    org = await org_init_service.get_user_organization(user_id)

    # We don't have email in JWT claims reliably, so we return empty string
    # Frontend already has the email from Supabase session
    return UserResponse(
        user=UserInfo(id=user_id, email=""),
        organization=OrganizationInfo(**org) if org else None,
    )
