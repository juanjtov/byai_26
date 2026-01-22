import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api.v1.router import api_router
from app.services.supabase import get_supabase_secret_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("remodly")

settings = get_settings()


def mask_url(url: str) -> str:
    """Mask sensitive parts of URL for logging."""
    if not url:
        return "NOT SET"
    # Show first 30 chars + ...
    if len(url) > 35:
        return url[:35] + "..."
    return url


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    # Startup
    logger.info("=" * 50)
    logger.info("Starting REMODLY API")
    logger.info("=" * 50)

    # Log configuration
    logger.info(f"Environment: {settings.app_env}")
    logger.info(f"Debug mode: {settings.debug}")
    logger.info(f"Supabase URL: {mask_url(settings.supabase_url)}")
    logger.info(f"CORS origins: {settings.cors_origins_list}")
    logger.info(f"API docs: {'enabled' if settings.debug else 'disabled'}")

    # Test Supabase connection
    logger.info("Testing Supabase connection...")
    try:
        client = get_supabase_secret_client()
        # Simple query to test connection
        result = client.table("organizations").select("id").limit(1).execute()
        logger.info("Supabase connection: OK")
    except Exception as e:
        logger.error(f"Supabase connection: FAILED - {e}")

    logger.info("=" * 50)
    logger.info("REMODLY API ready")
    logger.info("=" * 50)

    yield  # Application runs here

    # Shutdown
    logger.info("Shutting down REMODLY API...")


app = FastAPI(
    title="REMODLY API",
    description="AI-powered in-home estimator for general contractors",
    version="0.1.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "0.1.0"}
