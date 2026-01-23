"""
FastAPI dependencies for authentication and authorization.

Uses JWKS-based JWT verification - no shared secrets needed.
"""

from fastapi import Header, HTTPException
from typing import Optional

from app.utils.jwt import verify_supabase_jwt_async, JWTVerificationError
from app.services.supabase import get_supabase_secret_client


def extract_bearer_token(authorization: Optional[str]) -> str:
    """
    Extract Bearer token from Authorization header.

    Args:
        authorization: The Authorization header value

    Returns:
        The JWT token string

    Raises:
        HTTPException: If header is missing or malformed
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid authorization header"
        )
    return authorization.replace("Bearer ", "")


async def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """
    Extract and validate the current user ID from the JWT.

    Uses JWKS-based verification - no Supabase API call needed.

    Args:
        authorization: The Authorization header value

    Returns:
        The user UUID from the token's 'sub' claim

    Raises:
        HTTPException: If token is invalid or missing user ID
    """
    token = extract_bearer_token(authorization)

    try:
        payload = await verify_supabase_jwt_async(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token: missing user ID"
            )
        return user_id
    except JWTVerificationError as e:
        raise HTTPException(status_code=401, detail=str(e))


async def get_current_org_id(authorization: Optional[str] = Header(None)) -> str:
    """
    Extract user ID from JWT and look up their organization.

    JWT verification is local (JWKS), but org lookup requires database access.

    Args:
        authorization: The Authorization header value

    Returns:
        The organization UUID

    Raises:
        HTTPException: If token invalid or user has no organization
    """
    user_id = await get_current_user_id(authorization)

    # Look up user's organization
    admin = get_supabase_secret_client()
    result = admin.table("organization_members").select(
        "organization_id"
    ).eq("user_id", user_id).execute()

    if not result.data:
        raise HTTPException(
            status_code=403,
            detail="User does not belong to any organization"
        )

    return result.data[0]["organization_id"]


async def get_current_user_context(
    authorization: Optional[str] = Header(None)
) -> tuple[str, str]:
    """
    Get both user_id and org_id in a single call.

    Useful for endpoints that need both values.

    Args:
        authorization: The Authorization header value

    Returns:
        Tuple of (user_id, org_id)

    Raises:
        HTTPException: If token invalid or user has no organization
    """
    user_id = await get_current_user_id(authorization)

    admin = get_supabase_secret_client()
    result = admin.table("organization_members").select(
        "organization_id, role"
    ).eq("user_id", user_id).execute()

    if not result.data:
        raise HTTPException(
            status_code=403,
            detail="User does not belong to any organization"
        )

    return user_id, result.data[0]["organization_id"]
