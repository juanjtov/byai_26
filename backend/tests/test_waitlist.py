"""
Tests for waitlist endpoints.

Tests:
- POST /api/v1/waitlist
"""

import pytest
from unittest.mock import patch, AsyncMock
from uuid import uuid4


class TestWaitlist:
    """Tests for POST /api/v1/waitlist"""

    @pytest.mark.asyncio
    async def test_join_waitlist_success(self, client):
        """Test successfully joining the waitlist."""
        mock_entry = {
            "id": str(uuid4()),
            "email": "test@example.com",
            "status": "pending"
        }

        with patch(
            "app.api.v1.waitlist.waitlist_service.add_to_waitlist",
            new_callable=AsyncMock,
            return_value=mock_entry
        ):
            response = await client.post(
                "/api/v1/waitlist",
                json={"email": "test@example.com"}
            )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert "message" in data

    @pytest.mark.asyncio
    async def test_join_waitlist_with_source(self, client):
        """Test joining waitlist with source tracking."""
        mock_entry = {
            "id": str(uuid4()),
            "email": "test@example.com",
            "source": "landing_page",
            "status": "pending"
        }

        with patch(
            "app.api.v1.waitlist.waitlist_service.add_to_waitlist",
            new_callable=AsyncMock,
            return_value=mock_entry
        ):
            response = await client.post(
                "/api/v1/waitlist",
                json={"email": "test@example.com", "source": "landing_page"}
            )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_join_waitlist_duplicate_email(self, client):
        """Test joining waitlist with duplicate email returns 409."""
        with patch(
            "app.api.v1.waitlist.waitlist_service.add_to_waitlist",
            new_callable=AsyncMock,
            side_effect=ValueError("Email is already on the waitlist")
        ):
            response = await client.post(
                "/api/v1/waitlist",
                json={"email": "duplicate@example.com"}
            )

        assert response.status_code == 409
        assert "already on the waitlist" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_join_waitlist_invalid_email(self, client):
        """Test joining waitlist with invalid email fails."""
        response = await client.post(
            "/api/v1/waitlist",
            json={"email": "not-an-email"}
        )

        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_join_waitlist_empty_email(self, client):
        """Test joining waitlist with empty email fails."""
        response = await client.post(
            "/api/v1/waitlist",
            json={"email": ""}
        )

        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_join_waitlist_no_auth_required(self, client):
        """Test that waitlist endpoint doesn't require authentication."""
        mock_entry = {
            "id": str(uuid4()),
            "email": "public@example.com",
            "status": "pending"
        }

        with patch(
            "app.api.v1.waitlist.waitlist_service.add_to_waitlist",
            new_callable=AsyncMock,
            return_value=mock_entry
        ):
            # No auth headers - should still work
            response = await client.post(
                "/api/v1/waitlist",
                json={"email": "public@example.com"}
            )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_join_waitlist_server_error(self, client):
        """Test handling of server errors."""
        with patch(
            "app.api.v1.waitlist.waitlist_service.add_to_waitlist",
            new_callable=AsyncMock,
            side_effect=Exception("Database connection failed")
        ):
            response = await client.post(
                "/api/v1/waitlist",
                json={"email": "test@example.com"}
            )

        assert response.status_code == 500
