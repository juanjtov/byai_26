"""
Tests for authentication endpoints.

Tests:
- POST /api/v1/auth/initialize-organization
- GET /api/v1/auth/me
"""

import pytest
from unittest.mock import MagicMock, patch, AsyncMock

from tests.conftest import TEST_USER_ID, TEST_ORG_ID, TEST_ORG_NAME, TEST_ORG_SLUG


class TestInitializeOrganization:
    """Tests for POST /api/v1/auth/initialize-organization"""

    @pytest.mark.asyncio
    async def test_initialize_organization_new_user(self, client, auth_headers):
        """Test initializing organization for a new user."""
        mock_result = {
            "organization": {
                "id": TEST_ORG_ID,
                "name": TEST_ORG_NAME,
                "slug": TEST_ORG_SLUG,
                "role": "owner"
            },
            "is_new": True
        }

        with patch(
            "app.api.v1.auth.org_init_service.initialize_for_user",
            new_callable=AsyncMock,
            return_value=mock_result
        ):
            response = await client.post(
                "/api/v1/auth/initialize-organization",
                json={"organization_name": TEST_ORG_NAME},
                headers=auth_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert data["is_new"] is True
        assert data["organization"]["id"] == TEST_ORG_ID
        assert data["organization"]["name"] == TEST_ORG_NAME

    @pytest.mark.asyncio
    async def test_initialize_organization_existing_user(self, client, auth_headers):
        """Test initializing organization returns existing org for existing user."""
        mock_result = {
            "organization": {
                "id": TEST_ORG_ID,
                "name": TEST_ORG_NAME,
                "slug": TEST_ORG_SLUG,
                "role": "owner"
            },
            "is_new": False
        }

        with patch(
            "app.api.v1.auth.org_init_service.initialize_for_user",
            new_callable=AsyncMock,
            return_value=mock_result
        ):
            response = await client.post(
                "/api/v1/auth/initialize-organization",
                json={"organization_name": TEST_ORG_NAME},
                headers=auth_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert data["is_new"] is False

    @pytest.mark.asyncio
    async def test_initialize_organization_empty_name(self, client, auth_headers):
        """Test initializing with empty organization name fails."""
        response = await client.post(
            "/api/v1/auth/initialize-organization",
            json={"organization_name": ""},
            headers=auth_headers
        )

        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_initialize_organization_invalid_name(self, client, auth_headers):
        """Test initializing with invalid organization name fails."""
        response = await client.post(
            "/api/v1/auth/initialize-organization",
            json={"organization_name": "!!!@@@###"},  # No alphanumeric chars
            headers=auth_headers
        )

        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_initialize_organization_no_auth(self, client, no_auth_headers):
        """Test initializing without auth token fails."""
        response = await client.post(
            "/api/v1/auth/initialize-organization",
            json={"organization_name": TEST_ORG_NAME},
            headers=no_auth_headers
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_initialize_organization_invalid_token(self, client, invalid_auth_headers):
        """Test initializing with invalid token fails."""
        response = await client.post(
            "/api/v1/auth/initialize-organization",
            json={"organization_name": TEST_ORG_NAME},
            headers=invalid_auth_headers
        )

        assert response.status_code == 401


class TestGetCurrentUser:
    """Tests for GET /api/v1/auth/me"""

    @pytest.mark.asyncio
    async def test_get_current_user_with_org(self, client, auth_headers):
        """Test getting current user who has an organization."""
        mock_org = {
            "id": TEST_ORG_ID,
            "name": TEST_ORG_NAME,
            "slug": TEST_ORG_SLUG,
            "role": "owner"
        }

        with patch(
            "app.api.v1.auth.org_init_service.get_user_organization",
            new_callable=AsyncMock,
            return_value=mock_org
        ):
            response = await client.get(
                "/api/v1/auth/me",
                headers=auth_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert data["user"]["id"] == TEST_USER_ID
        assert data["organization"]["id"] == TEST_ORG_ID

    @pytest.mark.asyncio
    async def test_get_current_user_without_org(self, client, auth_headers):
        """Test getting current user who has no organization."""
        with patch(
            "app.api.v1.auth.org_init_service.get_user_organization",
            new_callable=AsyncMock,
            return_value=None
        ):
            response = await client.get(
                "/api/v1/auth/me",
                headers=auth_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert data["user"]["id"] == TEST_USER_ID
        assert data["organization"] is None

    @pytest.mark.asyncio
    async def test_get_current_user_no_auth(self, client, no_auth_headers):
        """Test getting current user without auth fails."""
        response = await client.get(
            "/api/v1/auth/me",
            headers=no_auth_headers
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self, client, invalid_auth_headers):
        """Test getting current user with invalid token fails."""
        response = await client.get(
            "/api/v1/auth/me",
            headers=invalid_auth_headers
        )

        assert response.status_code == 401
