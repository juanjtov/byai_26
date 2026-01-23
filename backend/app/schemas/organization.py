from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CompanyProfileResponse(BaseModel):
    id: str
    organization_id: str
    company_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    license_number: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CompanyProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    license_number: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None


class PricingProfileResponse(BaseModel):
    id: str
    organization_id: str
    labor_rate_per_hour: Optional[float] = None
    overhead_markup: Optional[float] = None
    profit_margin: Optional[float] = None
    minimum_charge: Optional[float] = None
    region: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class PricingProfileUpdate(BaseModel):
    labor_rate_per_hour: Optional[float] = None
    overhead_markup: Optional[float] = None
    profit_margin: Optional[float] = None
    minimum_charge: Optional[float] = None
    region: Optional[str] = None


class LaborItemCreate(BaseModel):
    name: str
    unit: str  # 'sqft', 'lf', 'each', 'hour'
    rate: float
    category: Optional[str] = None  # 'demolition', 'plumbing', 'electrical', 'tile', etc.


class LaborItemUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    rate: Optional[float] = None
    category: Optional[str] = None


class LaborItemResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    unit: str
    rate: float
    category: Optional[str] = None
    created_at: datetime
