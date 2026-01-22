from fastapi import APIRouter

from app.api.v1 import auth, organizations, documents

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["Organizations"])
api_router.include_router(documents.router, prefix="/organizations", tags=["Documents"])
