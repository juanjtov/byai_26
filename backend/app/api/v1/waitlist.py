from fastapi import APIRouter, HTTPException

from app.services.waitlist import WaitlistService
from app.schemas.waitlist import WaitlistRequest, WaitlistResponse

router = APIRouter()
waitlist_service = WaitlistService()


@router.post("", response_model=WaitlistResponse)
async def join_waitlist(request: WaitlistRequest):
    """
    Add an email to the waitlist.
    This is a public endpoint - no authentication required.
    """
    try:
        entry = await waitlist_service.add_to_waitlist(
            email=request.email,
            source=request.source,
        )

        return WaitlistResponse(
            id=entry["id"],
            email=entry["email"],
            message="You're on the list! We'll be in touch soon.",
        )
    except ValueError as e:
        # Handle duplicate email
        if "already on the waitlist" in str(e):
            raise HTTPException(
                status_code=409,
                detail="This email is already on the waitlist. We'll be in touch soon!"
            )
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Failed to join waitlist. Please try again later."
        )
