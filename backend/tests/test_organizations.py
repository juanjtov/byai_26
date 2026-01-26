"""
Tests for organization endpoints.

Tests:
- GET/PATCH /api/v1/organizations/{org_id}/profile
- GET/PATCH /api/v1/organizations/{org_id}/pricing
- GET/POST/PATCH/DELETE /api/v1/organizations/{org_id}/labor-items
"""

import pytest
from unittest.mock import patch, AsyncMock
from uuid import uuid4

from tests.conftest import TEST_ORG_ID, OTHER_ORG_ID


class TestCompanyProfile:
    """Tests for company profile endpoints."""

    @pytest.mark.asyncio
    async def test_get_company_profile_success(
        self, client, auth_headers, mock_company_profile
    ):
        """Test getting company profile for own organization."""
        with patch(
            "app.api.v1.organizations.org_service.get_company_profile",
            new_callable=AsyncMock,
            return_value=mock_company_profile
        ):
            response = await client.get(
                f"/api/v1/organizations/{TEST_ORG_ID}/profile",
                headers=auth_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert data["company_name"] == mock_company_profile["company_name"]

    @pytest.mark.asyncio
    async def test_get_company_profile_other_org(self, client, auth_headers):
        """Test getting company profile for another org returns 403."""
        response = await client.get(
            f"/api/v1/organizations/{OTHER_ORG_ID}/profile",
            headers=auth_headers
        )

        assert response.status_code == 403
        assert "Access denied" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_get_company_profile_not_found(self, client, auth_headers):
        """Test getting non-existent profile returns 404."""
        with patch(
            "app.api.v1.organizations.org_service.get_company_profile",
            new_callable=AsyncMock,
            return_value=None
        ):
            response = await client.get(
                f"/api/v1/organizations/{TEST_ORG_ID}/profile",
                headers=auth_headers
            )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_company_profile_no_auth(self, client, no_auth_headers):
        """Test getting profile without auth fails."""
        response = await client.get(
            f"/api/v1/organizations/{TEST_ORG_ID}/profile",
            headers=no_auth_headers
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_update_company_profile_success(
        self, client, auth_headers, mock_company_profile
    ):
        """Test updating company profile."""
        updated_profile = {**mock_company_profile, "company_name": "Updated Company"}

        with patch(
            "app.api.v1.organizations.org_service.update_company_profile",
            new_callable=AsyncMock,
            return_value=updated_profile
        ):
            response = await client.patch(
                f"/api/v1/organizations/{TEST_ORG_ID}/profile",
                json={"company_name": "Updated Company"},
                headers=auth_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert data["company_name"] == "Updated Company"

    @pytest.mark.asyncio
    async def test_update_company_profile_other_org(self, client, auth_headers):
        """Test updating another org's profile returns 403."""
        response = await client.patch(
            f"/api/v1/organizations/{OTHER_ORG_ID}/profile",
            json={"company_name": "Hacked Company"},
            headers=auth_headers
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_update_company_profile_partial(
        self, client, auth_headers, mock_company_profile
    ):
        """Test partial update of company profile."""
        updated_profile = {**mock_company_profile, "phone": "(555) 999-8888"}

        with patch(
            "app.api.v1.organizations.org_service.update_company_profile",
            new_callable=AsyncMock,
            return_value=updated_profile
        ):
            response = await client.patch(
                f"/api/v1/organizations/{TEST_ORG_ID}/profile",
                json={"phone": "(555) 999-8888"},
                headers=auth_headers
            )

        assert response.status_code == 200
        assert response.json()["phone"] == "(555) 999-8888"


class TestPricingProfile:
    """Tests for pricing profile endpoints."""

    @pytest.mark.asyncio
    async def test_get_pricing_profile_success(
        self, client, auth_headers, mock_pricing_profile
    ):
        """Test getting pricing profile for own organization."""
        with patch(
            "app.api.v1.organizations.org_service.get_pricing_profile",
            new_callable=AsyncMock,
            return_value=mock_pricing_profile
        ):
            response = await client.get(
                f"/api/v1/organizations/{TEST_ORG_ID}/pricing",
                headers=auth_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert data["labor_rate_per_hour"] == mock_pricing_profile["labor_rate_per_hour"]

    @pytest.mark.asyncio
    async def test_get_pricing_profile_other_org(self, client, auth_headers):
        """Test getting pricing profile for another org returns 403."""
        response = await client.get(
            f"/api/v1/organizations/{OTHER_ORG_ID}/pricing",
            headers=auth_headers
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_get_pricing_profile_not_found(self, client, auth_headers):
        """Test getting non-existent pricing profile returns 404."""
        with patch(
            "app.api.v1.organizations.org_service.get_pricing_profile",
            new_callable=AsyncMock,
            return_value=None
        ):
            response = await client.get(
                f"/api/v1/organizations/{TEST_ORG_ID}/pricing",
                headers=auth_headers
            )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_pricing_profile_success(
        self, client, auth_headers, mock_pricing_profile
    ):
        """Test updating pricing profile."""
        updated_profile = {**mock_pricing_profile, "labor_rate_per_hour": 85.00}

        with patch(
            "app.api.v1.organizations.org_service.update_pricing_profile",
            new_callable=AsyncMock,
            return_value=updated_profile
        ):
            response = await client.patch(
                f"/api/v1/organizations/{TEST_ORG_ID}/pricing",
                json={"labor_rate_per_hour": 85.00},
                headers=auth_headers
            )

        assert response.status_code == 200
        assert response.json()["labor_rate_per_hour"] == 85.00

    @pytest.mark.asyncio
    async def test_update_pricing_profile_other_org(self, client, auth_headers):
        """Test updating another org's pricing returns 403."""
        response = await client.patch(
            f"/api/v1/organizations/{OTHER_ORG_ID}/pricing",
            json={"labor_rate_per_hour": 1.00},
            headers=auth_headers
        )

        assert response.status_code == 403


class TestLaborItems:
    """Tests for labor items endpoints."""

    @pytest.mark.asyncio
    async def test_get_labor_items_success(
        self, client, auth_headers, mock_labor_item
    ):
        """Test getting labor items for own organization."""
        with patch(
            "app.api.v1.organizations.org_service.get_labor_items",
            new_callable=AsyncMock,
            return_value=[mock_labor_item]
        ):
            response = await client.get(
                f"/api/v1/organizations/{TEST_ORG_ID}/labor-items",
                headers=auth_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == mock_labor_item["name"]

    @pytest.mark.asyncio
    async def test_get_labor_items_empty(self, client, auth_headers):
        """Test getting labor items returns empty array for org with no items."""
        with patch(
            "app.api.v1.organizations.org_service.get_labor_items",
            new_callable=AsyncMock,
            return_value=[]
        ):
            response = await client.get(
                f"/api/v1/organizations/{TEST_ORG_ID}/labor-items",
                headers=auth_headers
            )

        assert response.status_code == 200
        assert response.json() == []

    @pytest.mark.asyncio
    async def test_get_labor_items_other_org(self, client, auth_headers):
        """Test getting labor items for another org returns 403."""
        response = await client.get(
            f"/api/v1/organizations/{OTHER_ORG_ID}/labor-items",
            headers=auth_headers
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_create_labor_item_success(
        self, client, auth_headers, mock_labor_item
    ):
        """Test creating a new labor item."""
        with patch(
            "app.api.v1.organizations.org_service.create_labor_item",
            new_callable=AsyncMock,
            return_value=mock_labor_item
        ):
            response = await client.post(
                f"/api/v1/organizations/{TEST_ORG_ID}/labor-items",
                json={
                    "name": "Tile Installation",
                    "unit": "sqft",
                    "rate": 12.50,
                    "category": "flooring"
                },
                headers=auth_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Tile Installation"

    @pytest.mark.asyncio
    async def test_create_labor_item_other_org(self, client, auth_headers):
        """Test creating labor item for another org returns 403."""
        response = await client.post(
            f"/api/v1/organizations/{OTHER_ORG_ID}/labor-items",
            json={
                "name": "Hacked Item",
                "unit": "each",
                "rate": 100.00,
                "category": "other"
            },
            headers=auth_headers
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_create_labor_item_missing_fields(self, client, auth_headers):
        """Test creating labor item with missing fields fails."""
        response = await client.post(
            f"/api/v1/organizations/{TEST_ORG_ID}/labor-items",
            json={"name": "Incomplete Item"},  # Missing required fields
            headers=auth_headers
        )

        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_update_labor_item_success(
        self, client, auth_headers, mock_labor_item
    ):
        """Test updating a labor item."""
        item_id = mock_labor_item["id"]
        updated_item = {**mock_labor_item, "rate": 15.00}

        with patch(
            "app.api.v1.organizations.org_service.update_labor_item",
            new_callable=AsyncMock,
            return_value=updated_item
        ):
            response = await client.patch(
                f"/api/v1/organizations/{TEST_ORG_ID}/labor-items/{item_id}",
                json={"rate": 15.00},
                headers=auth_headers
            )

        assert response.status_code == 200
        assert response.json()["rate"] == 15.00

    @pytest.mark.asyncio
    async def test_update_labor_item_other_org(self, client, auth_headers):
        """Test updating labor item for another org returns 403."""
        item_id = str(uuid4())
        response = await client.patch(
            f"/api/v1/organizations/{OTHER_ORG_ID}/labor-items/{item_id}",
            json={"rate": 1.00},
            headers=auth_headers
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_delete_labor_item_success(
        self, client, auth_headers, mock_labor_item
    ):
        """Test deleting a labor item."""
        item_id = mock_labor_item["id"]

        with patch(
            "app.api.v1.organizations.org_service.delete_labor_item",
            new_callable=AsyncMock,
            return_value=None
        ):
            response = await client.delete(
                f"/api/v1/organizations/{TEST_ORG_ID}/labor-items/{item_id}",
                headers=auth_headers
            )

        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()

    @pytest.mark.asyncio
    async def test_delete_labor_item_other_org(self, client, auth_headers):
        """Test deleting labor item for another org returns 403."""
        item_id = str(uuid4())
        response = await client.delete(
            f"/api/v1/organizations/{OTHER_ORG_ID}/labor-items/{item_id}",
            headers=auth_headers
        )

        assert response.status_code == 403
