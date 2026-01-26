"""
Tests for document endpoints.

Tests:
- POST /api/v1/organizations/{org_id}/documents/upload-url
- POST /api/v1/organizations/{org_id}/documents
- GET /api/v1/organizations/{org_id}/documents
- GET /api/v1/organizations/{org_id}/documents/{doc_id}
- GET /api/v1/organizations/{org_id}/documents/{doc_id}/download-url
- DELETE /api/v1/organizations/{org_id}/documents/{doc_id}
"""

import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from uuid import uuid4

from tests.conftest import TEST_ORG_ID, OTHER_ORG_ID


class TestDocumentUploadUrl:
    """Tests for POST /api/v1/organizations/{org_id}/documents/upload-url"""

    @pytest.mark.asyncio
    async def test_get_upload_url_success(self, client, auth_headers):
        """Test getting signed upload URL."""
        mock_result = {
            "upload_url": "https://test.supabase.co/storage/v1/upload/signed/test",
            "file_path": f"organizations/{TEST_ORG_ID}/documents/test.pdf",
            "file_id": "test-file-id-123"
        }

        with patch(
            "app.api.v1.documents.doc_service.get_upload_url",
            new_callable=AsyncMock,
            return_value=mock_result
        ):
            response = await client.post(
                f"/api/v1/organizations/{TEST_ORG_ID}/documents/upload-url",
                json={
                    "filename": "contract.pdf",
                    "content_type": "application/pdf"
                },
                headers=auth_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert "upload_url" in data
        assert "file_path" in data

    @pytest.mark.asyncio
    async def test_get_upload_url_other_org(self, client, auth_headers):
        """Test getting upload URL for another org returns 403."""
        response = await client.post(
            f"/api/v1/organizations/{OTHER_ORG_ID}/documents/upload-url",
            json={
                "filename": "hacked.pdf",
                "content_type": "application/pdf"
            },
            headers=auth_headers
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_get_upload_url_no_auth(self, client, no_auth_headers):
        """Test getting upload URL without auth fails."""
        response = await client.post(
            f"/api/v1/organizations/{TEST_ORG_ID}/documents/upload-url",
            json={
                "filename": "contract.pdf",
                "content_type": "application/pdf"
            },
            headers=no_auth_headers
        )

        assert response.status_code == 401


class TestDocumentCreate:
    """Tests for POST /api/v1/organizations/{org_id}/documents"""

    @pytest.mark.asyncio
    async def test_create_document_success(
        self, client, auth_headers, mock_document
    ):
        """Test registering a document after upload."""
        with patch(
            "app.api.v1.documents.doc_service.create_document",
            new_callable=AsyncMock,
            return_value=mock_document
        ), patch(
            "app.api.v1.documents.doc_processor.process_and_embed_document",
            new_callable=AsyncMock
        ):
            response = await client.post(
                f"/api/v1/organizations/{TEST_ORG_ID}/documents",
                json={
                    "name": "Sample Contract.pdf",
                    "type": "contract",
                    "file_path": f"organizations/{TEST_ORG_ID}/documents/sample-contract.pdf",
                    "file_size": 1024000,
                    "mime_type": "application/pdf"
                },
                headers=auth_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Sample Contract.pdf"
        assert data["status"] == "completed"

    @pytest.mark.asyncio
    async def test_create_document_other_org(self, client, auth_headers):
        """Test creating document for another org returns 403."""
        response = await client.post(
            f"/api/v1/organizations/{OTHER_ORG_ID}/documents",
            json={
                "name": "Hacked Document.pdf",
                "type": "contract",
                "file_path": "hacked/path.pdf",
                "file_size": 1000,
                "mime_type": "application/pdf"
            },
            headers=auth_headers
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_create_document_missing_fields(self, client, auth_headers):
        """Test creating document with missing fields fails."""
        response = await client.post(
            f"/api/v1/organizations/{TEST_ORG_ID}/documents",
            json={"name": "Incomplete"},  # Missing required fields
            headers=auth_headers
        )

        assert response.status_code == 422  # Validation error


class TestDocumentList:
    """Tests for GET /api/v1/organizations/{org_id}/documents"""

    @pytest.mark.asyncio
    async def test_list_documents_success(
        self, client, auth_headers, mock_document
    ):
        """Test listing documents for own organization."""
        with patch(
            "app.api.v1.documents.doc_service.get_documents",
            new_callable=AsyncMock,
            return_value=[mock_document]
        ):
            response = await client.get(
                f"/api/v1/organizations/{TEST_ORG_ID}/documents",
                headers=auth_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == mock_document["name"]

    @pytest.mark.asyncio
    async def test_list_documents_empty(self, client, auth_headers):
        """Test listing documents returns empty array for org with no docs."""
        with patch(
            "app.api.v1.documents.doc_service.get_documents",
            new_callable=AsyncMock,
            return_value=[]
        ):
            response = await client.get(
                f"/api/v1/organizations/{TEST_ORG_ID}/documents",
                headers=auth_headers
            )

        assert response.status_code == 200
        assert response.json() == []

    @pytest.mark.asyncio
    async def test_list_documents_other_org(self, client, auth_headers):
        """Test listing documents for another org returns 403."""
        response = await client.get(
            f"/api/v1/organizations/{OTHER_ORG_ID}/documents",
            headers=auth_headers
        )

        assert response.status_code == 403


class TestDocumentGet:
    """Tests for GET /api/v1/organizations/{org_id}/documents/{doc_id}"""

    @pytest.mark.asyncio
    async def test_get_document_success(
        self, client, auth_headers, mock_document
    ):
        """Test getting a specific document."""
        doc_id = mock_document["id"]

        with patch(
            "app.api.v1.documents.doc_service.get_document",
            new_callable=AsyncMock,
            return_value=mock_document
        ):
            response = await client.get(
                f"/api/v1/organizations/{TEST_ORG_ID}/documents/{doc_id}",
                headers=auth_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == doc_id

    @pytest.mark.asyncio
    async def test_get_document_not_found(self, client, auth_headers):
        """Test getting non-existent document returns 404."""
        doc_id = str(uuid4())

        with patch(
            "app.api.v1.documents.doc_service.get_document",
            new_callable=AsyncMock,
            return_value=None
        ):
            response = await client.get(
                f"/api/v1/organizations/{TEST_ORG_ID}/documents/{doc_id}",
                headers=auth_headers
            )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_document_other_org(self, client, auth_headers):
        """Test getting document for another org returns 403."""
        doc_id = str(uuid4())

        response = await client.get(
            f"/api/v1/organizations/{OTHER_ORG_ID}/documents/{doc_id}",
            headers=auth_headers
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_get_document_wrong_org_in_db(
        self, client, auth_headers, mock_document
    ):
        """Test getting document that belongs to different org returns 403."""
        doc_id = mock_document["id"]
        wrong_org_doc = {**mock_document, "organization_id": OTHER_ORG_ID}

        with patch(
            "app.api.v1.documents.doc_service.get_document",
            new_callable=AsyncMock,
            return_value=wrong_org_doc
        ):
            response = await client.get(
                f"/api/v1/organizations/{TEST_ORG_ID}/documents/{doc_id}",
                headers=auth_headers
            )

        assert response.status_code == 403


class TestDocumentDownloadUrl:
    """Tests for GET /api/v1/organizations/{org_id}/documents/{doc_id}/download-url"""

    @pytest.mark.asyncio
    async def test_get_download_url_success(
        self, client, auth_headers, mock_document
    ):
        """Test getting signed download URL."""
        doc_id = mock_document["id"]
        mock_url = "https://test.supabase.co/storage/v1/download/signed/test"

        with patch(
            "app.api.v1.documents.doc_service.get_document",
            new_callable=AsyncMock,
            return_value=mock_document
        ), patch(
            "app.api.v1.documents.doc_service.get_download_url",
            new_callable=AsyncMock,
            return_value=mock_url
        ):
            response = await client.get(
                f"/api/v1/organizations/{TEST_ORG_ID}/documents/{doc_id}/download-url",
                headers=auth_headers
            )

        assert response.status_code == 200
        assert "download_url" in response.json()

    @pytest.mark.asyncio
    async def test_get_download_url_not_found(self, client, auth_headers):
        """Test getting download URL for non-existent document returns 404."""
        doc_id = str(uuid4())

        with patch(
            "app.api.v1.documents.doc_service.get_document",
            new_callable=AsyncMock,
            return_value=None
        ):
            response = await client.get(
                f"/api/v1/organizations/{TEST_ORG_ID}/documents/{doc_id}/download-url",
                headers=auth_headers
            )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_download_url_other_org(self, client, auth_headers):
        """Test getting download URL for another org returns 403."""
        doc_id = str(uuid4())

        response = await client.get(
            f"/api/v1/organizations/{OTHER_ORG_ID}/documents/{doc_id}/download-url",
            headers=auth_headers
        )

        assert response.status_code == 403


class TestDocumentDelete:
    """Tests for DELETE /api/v1/organizations/{org_id}/documents/{doc_id}"""

    @pytest.mark.asyncio
    async def test_delete_document_success(
        self, client, auth_headers, mock_document
    ):
        """Test deleting a document."""
        doc_id = mock_document["id"]

        with patch(
            "app.api.v1.documents.doc_service.get_document",
            new_callable=AsyncMock,
            return_value=mock_document
        ), patch(
            "app.api.v1.documents.doc_service.delete_document",
            new_callable=AsyncMock,
            return_value=None
        ):
            response = await client.delete(
                f"/api/v1/organizations/{TEST_ORG_ID}/documents/{doc_id}",
                headers=auth_headers
            )

        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()

    @pytest.mark.asyncio
    async def test_delete_document_not_found(self, client, auth_headers):
        """Test deleting non-existent document returns 404."""
        doc_id = str(uuid4())

        with patch(
            "app.api.v1.documents.doc_service.get_document",
            new_callable=AsyncMock,
            return_value=None
        ):
            response = await client.delete(
                f"/api/v1/organizations/{TEST_ORG_ID}/documents/{doc_id}",
                headers=auth_headers
            )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_document_other_org(self, client, auth_headers):
        """Test deleting document for another org returns 403."""
        doc_id = str(uuid4())

        response = await client.delete(
            f"/api/v1/organizations/{OTHER_ORG_ID}/documents/{doc_id}",
            headers=auth_headers
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_delete_document_wrong_org_in_db(
        self, client, auth_headers, mock_document
    ):
        """Test deleting document that belongs to different org returns 403."""
        doc_id = mock_document["id"]
        wrong_org_doc = {**mock_document, "organization_id": OTHER_ORG_ID}

        with patch(
            "app.api.v1.documents.doc_service.get_document",
            new_callable=AsyncMock,
            return_value=wrong_org_doc
        ):
            response = await client.delete(
                f"/api/v1/organizations/{TEST_ORG_ID}/documents/{doc_id}",
                headers=auth_headers
            )

        assert response.status_code == 403
