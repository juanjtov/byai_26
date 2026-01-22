from fastapi import APIRouter, HTTPException, Depends
from typing import List

from app.dependencies import get_current_org_id
from app.services.organization import OrganizationService
from app.schemas.organization import (
    CompanyProfileResponse,
    CompanyProfileUpdate,
    PricingProfileResponse,
    PricingProfileUpdate,
    LaborItemCreate,
    LaborItemUpdate,
    LaborItemResponse,
)

router = APIRouter()
org_service = OrganizationService()


# Company Profile endpoints
@router.get("/{org_id}/profile", response_model=CompanyProfileResponse)
async def get_company_profile(org_id: str, current_org_id: str = Depends(get_current_org_id)):
    """Get company profile for an organization."""
    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    profile = await org_service.get_company_profile(org_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Company profile not found")

    return profile


@router.patch("/{org_id}/profile", response_model=CompanyProfileResponse)
async def update_company_profile(
    org_id: str,
    data: CompanyProfileUpdate,
    current_org_id: str = Depends(get_current_org_id),
):
    """Update company profile."""
    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        profile = await org_service.update_company_profile(org_id, data.model_dump(exclude_unset=True))
        return profile
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Pricing Profile endpoints
@router.get("/{org_id}/pricing", response_model=PricingProfileResponse)
async def get_pricing_profile(org_id: str, current_org_id: str = Depends(get_current_org_id)):
    """Get pricing profile for an organization."""
    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    profile = await org_service.get_pricing_profile(org_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Pricing profile not found")

    return profile


@router.patch("/{org_id}/pricing", response_model=PricingProfileResponse)
async def update_pricing_profile(
    org_id: str,
    data: PricingProfileUpdate,
    current_org_id: str = Depends(get_current_org_id),
):
    """Update pricing profile."""
    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        profile = await org_service.update_pricing_profile(org_id, data.model_dump(exclude_unset=True))
        return profile
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Labor Items endpoints
@router.get("/{org_id}/labor-items", response_model=List[LaborItemResponse])
async def get_labor_items(org_id: str, current_org_id: str = Depends(get_current_org_id)):
    """Get all labor items for an organization."""
    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    items = await org_service.get_labor_items(org_id)
    return items


@router.post("/{org_id}/labor-items", response_model=LaborItemResponse)
async def create_labor_item(
    org_id: str,
    data: LaborItemCreate,
    current_org_id: str = Depends(get_current_org_id),
):
    """Create a new labor item."""
    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        item = await org_service.create_labor_item(org_id, data.model_dump())
        return item
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{org_id}/labor-items/{item_id}", response_model=LaborItemResponse)
async def update_labor_item(
    org_id: str,
    item_id: str,
    data: LaborItemUpdate,
    current_org_id: str = Depends(get_current_org_id),
):
    """Update a labor item."""
    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        item = await org_service.update_labor_item(item_id, data.model_dump(exclude_unset=True))
        return item
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{org_id}/labor-items/{item_id}")
async def delete_labor_item(
    org_id: str,
    item_id: str,
    current_org_id: str = Depends(get_current_org_id),
):
    """Delete a labor item."""
    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    await org_service.delete_labor_item(item_id)
    return {"message": "Labor item deleted"}
