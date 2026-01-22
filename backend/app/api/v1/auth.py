from fastapi import APIRouter, HTTPException, Header
from typing import Optional

from app.services.auth import AuthService
from app.schemas.auth import SignupRequest, LoginRequest, AuthResponse, UserResponse

router = APIRouter()
auth_service = AuthService()


@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    """
    Register a new user and create their organization.
    """
    try:
        result = await auth_service.signup(
            email=request.email,
            password=request.password,
            org_name=request.organization_name,
        )

        return AuthResponse(
            user={"id": result["user"]["id"], "email": result["user"]["email"]},
            organization={
                "id": result["organization"]["id"],
                "name": result["organization"]["name"],
                "slug": result["organization"]["slug"],
                "role": "owner",
            },
            session={
                "access_token": result["session"].access_token,
                "refresh_token": result["session"].refresh_token,
                "expires_at": result["session"].expires_at,
            } if result["session"] else None,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    Log in a user with email and password.
    """
    try:
        result = await auth_service.login(
            email=request.email,
            password=request.password,
        )

        return AuthResponse(
            user=result["user"],
            organization=result["organization"],
            session=result["session"],
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")


@router.get("/me", response_model=UserResponse)
async def get_current_user(authorization: Optional[str] = Header(None)):
    """
    Get the current authenticated user.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    access_token = authorization.replace("Bearer ", "")

    result = await auth_service.get_current_user(access_token)

    if result is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return UserResponse(
        user=result["user"],
        organization=result["organization"],
    )


@router.post("/logout")
async def logout(authorization: Optional[str] = Header(None)):
    """
    Log out the current user.
    """
    if authorization and authorization.startswith("Bearer "):
        access_token = authorization.replace("Bearer ", "")
        await auth_service.logout(access_token)

    return {"message": "Logged out successfully"}
