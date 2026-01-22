from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class WaitlistRequest(BaseModel):
    email: EmailStr
    source: str = "landing_page"


class WaitlistResponse(BaseModel):
    id: str
    email: str
    message: str


class WaitlistEntry(BaseModel):
    id: str
    email: str
    source: str
    status: str
    created_at: datetime
    updated_at: datetime
