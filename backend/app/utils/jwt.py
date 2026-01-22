"""
JWKS-based JWT verification for Supabase tokens.

This module verifies Supabase JWTs using the public keys from the JWKS endpoint,
supporting automatic key rotation without needing a shared secret.
"""

import time
from typing import Optional

import httpx
from jose import jwt, JWTError
from jose.exceptions import JWKError

from app.config import get_settings


class JWTVerificationError(Exception):
    """Raised when JWT verification fails."""
    pass


class JWKSClient:
    """Client to fetch and cache JWKS from Supabase."""

    def __init__(self, jwks_url: str, cache_ttl: int = 3600):
        """
        Initialize the JWKS client.

        Args:
            jwks_url: The JWKS endpoint URL
            cache_ttl: Cache time-to-live in seconds (default: 1 hour)
        """
        self.jwks_url = jwks_url
        self.cache_ttl = cache_ttl
        self._keys: dict = {}
        self._last_fetch: float = 0

    def _should_refresh(self) -> bool:
        """Check if the cached keys should be refreshed."""
        return time.time() - self._last_fetch > self.cache_ttl

    def _fetch_jwks(self) -> None:
        """Fetch JWKS from Supabase endpoint."""
        response = httpx.get(self.jwks_url, timeout=10)
        response.raise_for_status()
        jwks = response.json()

        # Index keys by kid for fast lookup
        self._keys = {key["kid"]: key for key in jwks.get("keys", [])}
        self._last_fetch = time.time()

    def get_signing_key(self, kid: str) -> dict:
        """
        Get the signing key matching the kid.

        Args:
            kid: The key ID from the JWT header

        Returns:
            The JWK dictionary for the specified key ID

        Raises:
            JWTVerificationError: If the key ID is not found
        """
        # Refresh if cache expired or key not found
        if self._should_refresh() or kid not in self._keys:
            self._fetch_jwks()

        if kid not in self._keys:
            raise JWTVerificationError(f"Key ID '{kid}' not found in JWKS")

        return self._keys[kid]


# Singleton JWKS client
_jwks_client: Optional[JWKSClient] = None


def get_jwks_client() -> JWKSClient:
    """Get or create the singleton JWKS client."""
    global _jwks_client
    if _jwks_client is None:
        settings = get_settings()
        # Extract project ref from URL: https://xxx.supabase.co -> xxx
        project_ref = settings.supabase_url.replace("https://", "").replace(".supabase.co", "")
        jwks_url = f"https://{project_ref}.supabase.co/auth/v1/.well-known/jwks.json"
        _jwks_client = JWKSClient(jwks_url)
    return _jwks_client


def verify_supabase_jwt(token: str) -> dict:
    """
    Verify a Supabase JWT using JWKS public keys.

    This function:
    1. Extracts the key ID (kid) from the token header
    2. Fetches the corresponding public key from the JWKS endpoint
    3. Verifies the token signature using RS256 or ES256
    4. Returns the decoded payload

    Args:
        token: The JWT access token from Supabase

    Returns:
        The decoded JWT payload containing claims like:
        - sub: User UUID
        - email: User's email
        - role: "authenticated"
        - exp: Expiration timestamp
        - iat: Issued at timestamp

    Raises:
        JWTVerificationError: If token is invalid, expired, or verification fails
    """
    try:
        # Get unverified header to find kid
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        if not kid:
            raise JWTVerificationError("Token missing 'kid' header")

        # Fetch the public key from JWKS
        client = get_jwks_client()
        key_data = client.get_signing_key(kid)

        # Verify and decode the token
        payload = jwt.decode(
            token,
            key_data,
            algorithms=["RS256", "ES256"],
            audience="authenticated"
        )

        return payload

    except JWTError as e:
        raise JWTVerificationError(f"Invalid token: {str(e)}")
    except JWKError as e:
        raise JWTVerificationError(f"Key error: {str(e)}")
    except httpx.HTTPError as e:
        raise JWTVerificationError(f"Failed to fetch JWKS: {str(e)}")


def extract_user_id(token: str) -> str:
    """
    Extract user_id (sub claim) from a verified JWT.

    Args:
        token: The JWT access token

    Returns:
        The user UUID from the 'sub' claim

    Raises:
        JWTVerificationError: If token is invalid or missing 'sub' claim
    """
    payload = verify_supabase_jwt(token)
    user_id = payload.get("sub")
    if not user_id:
        raise JWTVerificationError("Token missing 'sub' claim")
    return user_id


def extract_user_email(token: str) -> Optional[str]:
    """
    Extract user email from a verified JWT.

    Args:
        token: The JWT access token

    Returns:
        The user's email or None if not present
    """
    payload = verify_supabase_jwt(token)
    return payload.get("email")
