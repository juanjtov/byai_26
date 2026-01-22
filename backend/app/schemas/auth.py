from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    organization_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserInfo(BaseModel):
    id: str
    email: str


class OrganizationInfo(BaseModel):
    id: str
    name: str
    slug: str
    role: str
    logo_url: Optional[str] = None


class SessionInfo(BaseModel):
    access_token: str
    refresh_token: str
    expires_at: Optional[int] = None


class AuthResponse(BaseModel):
    user: UserInfo
    organization: Optional[OrganizationInfo] = None
    session: Optional[SessionInfo] = None


class UserResponse(BaseModel):
    user: UserInfo
    organization: Optional[OrganizationInfo] = None
