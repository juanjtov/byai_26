from fastapi import Header, HTTPException
from typing import Optional

from app.services.auth import AuthService

auth_service = AuthService()


async def get_current_org_id(authorization: Optional[str] = Header(None)) -> str:
    """
    Extract and validate the current user's organization ID from the auth token.
    Used as a FastAPI dependency for protected routes.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    access_token = authorization.replace("Bearer ", "")

    result = await auth_service.get_current_user(access_token)

    if result is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if result.get("organization") is None:
        raise HTTPException(status_code=403, detail="User does not belong to any organization")

    return result["organization"]["id"]


async def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """
    Extract and validate the current user ID from the auth token.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    access_token = authorization.replace("Bearer ", "")

    result = await auth_service.get_current_user(access_token)

    if result is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return result["user"]["id"]
