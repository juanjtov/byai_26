"""
Authentication endpoints.

Auth is now handled by Supabase directly on the frontend.
Backend only verifies JWTs and handles organization initialization.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.dependencies import get_current_user_id
from app.services.organization_init import OrganizationInitService
from app.schemas.auth import OrganizationInfo, UserInfo, UserResponse

router = APIRouter()
org_init_service = OrganizationInitService()


class InitializeOrganizationRequest(BaseModel):
    """Request body for organization initialization."""
    organization_name: str


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
