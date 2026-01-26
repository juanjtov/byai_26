"""
Shared fixtures for REMODLY backend tests.

Provides mocked authentication, Supabase client, and test data fixtures.
"""

import os
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport
from uuid import uuid4

# Set test environment variables BEFORE importing app modules
os.environ["SUPABASE_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_PUBLISHABLE_KEY"] = "test-publishable-key"
os.environ["SUPABASE_SECRET_KEY"] = "test-secret-key"
os.environ["OPENAI_API_KEY"] = "test-openai-key"
os.environ["OPENROUTER_API_KEY"] = "test-openrouter-key"
os.environ["APP_ENV"] = "test"
os.environ["DEBUG"] = "false"
os.environ["CORS_ORIGINS"] = "http://localhost:5173"


# Test data
TEST_USER_ID = str(uuid4())
TEST_USER_EMAIL = "test@example.com"
TEST_ORG_ID = str(uuid4())
TEST_ORG_NAME = "Test Company LLC"
TEST_ORG_SLUG = "test-company-llc"

# Second user/org for cross-org tests
OTHER_USER_ID = str(uuid4())
OTHER_ORG_ID = str(uuid4())


@pytest.fixture
def test_user_id():
    """Return the test user ID."""
    return TEST_USER_ID


@pytest.fixture
def test_org_id():
    """Return the test organization ID."""
    return TEST_ORG_ID


@pytest.fixture
def other_org_id():
    """Return another org ID for cross-org access tests."""
    return OTHER_ORG_ID


@pytest.fixture
def valid_token():
    """Return a valid test JWT token."""
    return "valid-test-token"


@pytest.fixture
def invalid_token():
    """Return an invalid test JWT token."""
    return "invalid-test-token"


@pytest.fixture
def mock_jwt_payload():
    """Return a mock JWT payload for a valid token."""
    return {
        "sub": TEST_USER_ID,
        "email": TEST_USER_EMAIL,
        "aud": "authenticated",
        "role": "authenticated",
        "exp": 9999999999,
        "iat": 1234567890,
    }


@pytest.fixture
def mock_supabase_client():
    """Create a mock Supabase client with common operations."""
    mock_client = MagicMock()

    # Mock table operations
    mock_table = MagicMock()
    mock_client.table.return_value = mock_table

    # Chain methods return self for fluent API
    mock_table.select.return_value = mock_table
    mock_table.insert.return_value = mock_table
    mock_table.update.return_value = mock_table
    mock_table.delete.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.neq.return_value = mock_table
    mock_table.limit.return_value = mock_table
    mock_table.order.return_value = mock_table
    mock_table.single.return_value = mock_table

    # Default execute returns empty
    mock_table.execute.return_value = MagicMock(data=[], count=0)

    # Mock storage
    mock_storage = MagicMock()
    mock_client.storage.from_.return_value = mock_storage
    mock_storage.create_signed_upload_url.return_value = {
        "signedURL": "https://test.supabase.co/storage/v1/upload/signed/test",
        "path": "test/path",
        "token": "upload-token"
    }
    mock_storage.create_signed_url.return_value = {
        "signedURL": "https://test.supabase.co/storage/v1/download/signed/test"
    }

    return mock_client


@pytest.fixture
def mock_org_member_response():
    """Mock response for organization member lookup."""
    return MagicMock(data=[{
        "organization_id": TEST_ORG_ID,
        "user_id": TEST_USER_ID,
        "role": "owner"
    }])


@pytest.fixture
def mock_company_profile():
    """Mock company profile data."""
    return {
        "id": str(uuid4()),
        "organization_id": TEST_ORG_ID,
        "company_name": TEST_ORG_NAME,
        "address": "123 Test St",
        "phone": "(555) 123-4567",
        "email": "contact@testcompany.com",
        "website": "https://testcompany.com",
        "license_number": "GC-12345",
        "primary_color": "#C88D74",
        "secondary_color": "#7A9E7E",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }


@pytest.fixture
def mock_pricing_profile():
    """Mock pricing profile data."""
    return {
        "id": str(uuid4()),
        "organization_id": TEST_ORG_ID,
        "labor_rate_per_hour": 75.00,
        "overhead_markup": 0.15,
        "profit_margin": 0.10,
        "minimum_charge": 150.00,
        "region": "Northeast",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }


@pytest.fixture
def mock_labor_item():
    """Mock labor item data."""
    return {
        "id": str(uuid4()),
        "organization_id": TEST_ORG_ID,
        "name": "Tile Installation",
        "unit": "sqft",
        "rate": 12.50,
        "category": "flooring",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }


@pytest.fixture
def mock_document():
    """Mock document data."""
    return {
        "id": str(uuid4()),
        "organization_id": TEST_ORG_ID,
        "name": "Sample Contract.pdf",
        "type": "contract",
        "file_path": f"organizations/{TEST_ORG_ID}/documents/sample-contract.pdf",
        "file_size": 1024000,
        "mime_type": "application/pdf",
        "status": "completed",
        "extracted_data": {"sections": [], "terms": []},
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }


@pytest.fixture
def mock_conversation():
    """Mock chat conversation data."""
    return {
        "id": str(uuid4()),
        "organization_id": TEST_ORG_ID,
        "user_id": TEST_USER_ID,
        "title": "Bathroom Renovation Estimate",
        "is_saved": False,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }


@pytest.fixture
def mock_message():
    """Mock chat message data."""
    return {
        "id": str(uuid4()),
        "conversation_id": str(uuid4()),
        "role": "user",
        "content": "I need an estimate for a bathroom renovation",
        "metadata": {},
        "created_at": "2024-01-01T00:00:00Z"
    }


@pytest.fixture
def auth_headers(valid_token):
    """Return authorization headers with valid token."""
    return {"Authorization": f"Bearer {valid_token}"}


@pytest.fixture
def invalid_auth_headers(invalid_token):
    """Return authorization headers with invalid token."""
    return {"Authorization": f"Bearer {invalid_token}"}


@pytest.fixture
def no_auth_headers():
    """Return empty headers (no auth)."""
    return {}


@pytest.fixture
async def client(mock_supabase_client, mock_jwt_payload, mock_org_member_response):
    """
    Create an async test client with mocked dependencies.

    Mocks:
    - JWT verification (returns mock payload for valid tokens)
    - Supabase client (returns mock responses)
    """
    # Patch JWT verification
    async def mock_verify_jwt(token):
        if token == "invalid-test-token":
            from app.utils.jwt import JWTVerificationError
            raise JWTVerificationError("Invalid token")
        return mock_jwt_payload

    # Configure Supabase mock to return org member for auth lookups
    def mock_table_handler(table_name):
        mock_table = MagicMock()
        mock_table.select.return_value = mock_table
        mock_table.insert.return_value = mock_table
        mock_table.update.return_value = mock_table
        mock_table.delete.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.neq.return_value = mock_table
        mock_table.limit.return_value = mock_table
        mock_table.order.return_value = mock_table
        mock_table.single.return_value = mock_table

        if table_name == "organization_members":
            mock_table.execute.return_value = mock_org_member_response
        else:
            mock_table.execute.return_value = MagicMock(data=[], count=0)

        return mock_table

    mock_supabase_client.table.side_effect = mock_table_handler

    with patch("app.utils.jwt.verify_supabase_jwt_async", mock_verify_jwt), \
         patch("app.services.supabase.get_supabase_secret_client", return_value=mock_supabase_client), \
         patch("app.services.supabase.get_supabase_publishable_client", return_value=mock_supabase_client), \
         patch("app.dependencies.get_supabase_secret_client", return_value=mock_supabase_client):

        # Import app after patches are in place
        from app.main import app

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac


@pytest.fixture
def configure_mock_response(mock_supabase_client):
    """
    Factory fixture to configure specific mock responses.

    Usage:
        def test_something(client, configure_mock_response, mock_company_profile):
            configure_mock_response("company_profiles", mock_company_profile)
            # Now client.table("company_profiles").execute() returns mock_company_profile
    """
    def _configure(table_name: str, data, single: bool = False):
        mock_table = MagicMock()
        mock_table.select.return_value = mock_table
        mock_table.insert.return_value = mock_table
        mock_table.update.return_value = mock_table
        mock_table.delete.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.neq.return_value = mock_table
        mock_table.limit.return_value = mock_table
        mock_table.order.return_value = mock_table
        mock_table.single.return_value = mock_table

        if single:
            mock_table.execute.return_value = MagicMock(data=data)
        else:
            mock_table.execute.return_value = MagicMock(
                data=[data] if isinstance(data, dict) else data,
                count=1 if data else 0
            )

        original_side_effect = mock_supabase_client.table.side_effect

        def new_side_effect(name):
            if name == table_name:
                return mock_table
            if original_side_effect:
                return original_side_effect(name)
            return MagicMock()

        mock_supabase_client.table.side_effect = new_side_effect
        return mock_table

    return _configure
