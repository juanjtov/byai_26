from supabase import create_client, Client
from functools import lru_cache

from app.config import get_settings


@lru_cache
def get_supabase_publishable_client() -> Client:
    """Get Supabase client with publishable key (for auth operations)."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_publishable_key)


@lru_cache
def get_supabase_secret_client() -> Client:
    """Get Supabase client with secret key (for admin operations)."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_secret_key)


# Backward compatibility aliases
def get_supabase_client() -> Client:
    """Alias for get_supabase_publishable_client (backward compatibility)."""
    return get_supabase_publishable_client()


def get_supabase_admin() -> Client:
    """Alias for get_supabase_secret_client (backward compatibility)."""
    return get_supabase_secret_client()
