"""
Tests for chat endpoints.

Tests:
- POST /api/v1/organizations/{org_id}/chat/conversations
- GET /api/v1/organizations/{org_id}/chat/conversations
- GET /api/v1/organizations/{org_id}/chat/conversations/{conversation_id}
- PATCH /api/v1/organizations/{org_id}/chat/conversations/{conversation_id}
- DELETE /api/v1/organizations/{org_id}/chat/conversations/{conversation_id}
- POST /api/v1/organizations/{org_id}/chat/stream
- POST /api/v1/organizations/{org_id}/chat/analyze-image
- POST /api/v1/organizations/{org_id}/chat/extract-measurements
"""

import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from uuid import uuid4
import io

from tests.conftest import TEST_ORG_ID, TEST_USER_ID, OTHER_ORG_ID


class TestConversationCreate:
    """Tests for POST /api/v1/organizations/{org_id}/chat/conversations"""

    @pytest.mark.asyncio
    async def test_create_conversation_success(
        self, client, auth_headers, mock_conversation
    ):
        """Test creating a new conversation."""
        with patch(
            "app.api.v1.chat.chat_service.create_conversation",
            new_callable=AsyncMock,
            return_value=mock_conversation
        ):
            response = await client.post(
                f"/api/v1/organizations/{TEST_ORG_ID}/chat/conversations",
                json={"title": "Test Conversation"},
                headers=auth_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["organization_id"] == TEST_ORG_ID

    @pytest.mark.asyncio
    async def test_create_conversation_other_org(self, client, auth_headers):
        """Test creating conversation for another org returns 403."""
        response = await client.post(
            f"/api/v1/organizations/{OTHER_ORG_ID}/chat/conversations",
            json={"title": "Hacked Conversation"},
            headers=auth_headers
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_create_conversation_no_auth(self, client, no_auth_headers):
        """Test creating conversation without auth fails."""
        response = await client.post(
            f"/api/v1/organizations/{TEST_ORG_ID}/chat/conversations",
            json={"title": "Test"},
            headers=no_auth_headers
        )

        assert response.status_code == 401


class TestConversationList:
    """Tests for GET /api/v1/organizations/{org_id}/chat/conversations"""

    @pytest.mark.asyncio
    async def test_list_conversations_success(
        self, client, auth_headers, mock_conversation
    ):
        """Test listing conversations."""
        with patch(
            "app.api.v1.chat.chat_service.get_user_conversations",
            new_callable=AsyncMock,
            return_value=[mock_conversation]
        ):
            response = await client.get(
                f"/api/v1/organizations/{TEST_ORG_ID}/chat/conversations",
                headers=auth_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

    @pytest.mark.asyncio
    async def test_list_conversations_saved_only(
        self, client, auth_headers, mock_conversation
    ):
        """Test listing only saved conversations."""
        saved_conv = {**mock_conversation, "is_saved": True}

        with patch(
            "app.api.v1.chat.chat_service.get_user_conversations",
            new_callable=AsyncMock,
            return_value=[saved_conv]
        ):
            response = await client.get(
                f"/api/v1/organizations/{TEST_ORG_ID}/chat/conversations?saved_only=true",
                headers=auth_headers
            )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_list_conversations_empty(self, client, auth_headers):
        """Test listing conversations returns empty array."""
        with patch(
            "app.api.v1.chat.chat_service.get_user_conversations",
            new_callable=AsyncMock,
            return_value=[]
        ):
            response = await client.get(
                f"/api/v1/organizations/{TEST_ORG_ID}/chat/conversations",
                headers=auth_headers
            )

        assert response.status_code == 200
        assert response.json() == []

    @pytest.mark.asyncio
    async def test_list_conversations_other_org(self, client, auth_headers):
        """Test listing conversations for another org returns 403."""
        response = await client.get(
            f"/api/v1/organizations/{OTHER_ORG_ID}/chat/conversations",
            headers=auth_headers
        )

        assert response.status_code == 403


class TestConversationGet:
    """Tests for GET /api/v1/organizations/{org_id}/chat/conversations/{id}"""

    @pytest.mark.asyncio
    async def test_get_conversation_success(
        self, client, auth_headers, mock_conversation, mock_message
    ):
        """Test getting a specific conversation with messages."""
        conv_id = mock_conversation["id"]
        conv_with_messages = {**mock_conversation, "messages": [mock_message]}

        with patch(
            "app.api.v1.chat.chat_service.get_conversation",
            new_callable=AsyncMock,
            return_value=conv_with_messages
        ):
            response = await client.get(
                f"/api/v1/organizations/{TEST_ORG_ID}/chat/conversations/{conv_id}",
                headers=auth_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == conv_id
        assert "messages" in data

    @pytest.mark.asyncio
    async def test_get_conversation_not_found(self, client, auth_headers):
        """Test getting non-existent conversation returns 404."""
        conv_id = str(uuid4())

        with patch(
            "app.api.v1.chat.chat_service.get_conversation",
            new_callable=AsyncMock,
            return_value=None
        ):
            response = await client.get(
                f"/api/v1/organizations/{TEST_ORG_ID}/chat/conversations/{conv_id}",
                headers=auth_headers
            )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_conversation_other_org(self, client, auth_headers):
        """Test getting conversation for another org returns 403."""
        conv_id = str(uuid4())

        response = await client.get(
            f"/api/v1/organizations/{OTHER_ORG_ID}/chat/conversations/{conv_id}",
            headers=auth_headers
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_get_conversation_wrong_org_in_db(
        self, client, auth_headers, mock_conversation
    ):
        """Test getting conversation belonging to different org returns 403."""
        conv_id = mock_conversation["id"]
        wrong_org_conv = {**mock_conversation, "organization_id": OTHER_ORG_ID}

        with patch(
            "app.api.v1.chat.chat_service.get_conversation",
            new_callable=AsyncMock,
            return_value=wrong_org_conv
        ):
            response = await client.get(
                f"/api/v1/organizations/{TEST_ORG_ID}/chat/conversations/{conv_id}",
                headers=auth_headers
            )

        assert response.status_code == 403


class TestConversationUpdate:
    """Tests for PATCH /api/v1/organizations/{org_id}/chat/conversations/{id}"""

    @pytest.mark.asyncio
    async def test_update_conversation_save(
        self, client, auth_headers, mock_conversation
    ):
        """Test saving a conversation."""
        conv_id = mock_conversation["id"]
        saved_conv = {**mock_conversation, "is_saved": True, "title": "Saved Estimate"}

        with patch(
            "app.api.v1.chat.chat_service.get_conversation",
            new_callable=AsyncMock,
            return_value=mock_conversation
        ), patch(
            "app.api.v1.chat.chat_service.save_conversation",
            new_callable=AsyncMock,
            return_value=saved_conv
        ):
            response = await client.patch(
                f"/api/v1/organizations/{TEST_ORG_ID}/chat/conversations/{conv_id}",
                json={"is_saved": True},
                headers=auth_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert data["is_saved"] is True

    @pytest.mark.asyncio
    async def test_update_conversation_rename(
        self, client, auth_headers, mock_conversation
    ):
        """Test renaming a conversation."""
        conv_id = mock_conversation["id"]
        renamed_conv = {**mock_conversation, "title": "New Title"}

        with patch(
            "app.api.v1.chat.chat_service.get_conversation",
            new_callable=AsyncMock,
            return_value=mock_conversation
        ), patch(
            "app.api.v1.chat.chat_service.save_conversation",
            new_callable=AsyncMock,
            return_value=renamed_conv
        ):
            response = await client.patch(
                f"/api/v1/organizations/{TEST_ORG_ID}/chat/conversations/{conv_id}",
                json={"title": "New Title"},
                headers=auth_headers
            )

        assert response.status_code == 200
        assert response.json()["title"] == "New Title"

    @pytest.mark.asyncio
    async def test_update_conversation_not_found(self, client, auth_headers):
        """Test updating non-existent conversation returns 404."""
        conv_id = str(uuid4())

        with patch(
            "app.api.v1.chat.chat_service.get_conversation",
            new_callable=AsyncMock,
            return_value=None
        ):
            response = await client.patch(
                f"/api/v1/organizations/{TEST_ORG_ID}/chat/conversations/{conv_id}",
                json={"is_saved": True},
                headers=auth_headers
            )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_conversation_other_org(self, client, auth_headers):
        """Test updating conversation for another org returns 403."""
        conv_id = str(uuid4())

        response = await client.patch(
            f"/api/v1/organizations/{OTHER_ORG_ID}/chat/conversations/{conv_id}",
            json={"is_saved": True},
            headers=auth_headers
        )

        assert response.status_code == 403


class TestConversationDelete:
    """Tests for DELETE /api/v1/organizations/{org_id}/chat/conversations/{id}"""

    @pytest.mark.asyncio
    async def test_delete_conversation_success(
        self, client, auth_headers, mock_conversation
    ):
        """Test deleting a conversation."""
        conv_id = mock_conversation["id"]

        with patch(
            "app.api.v1.chat.chat_service.get_conversation",
            new_callable=AsyncMock,
            return_value=mock_conversation
        ), patch(
            "app.api.v1.chat.chat_service.delete_conversation",
            new_callable=AsyncMock,
            return_value=None
        ):
            response = await client.delete(
                f"/api/v1/organizations/{TEST_ORG_ID}/chat/conversations/{conv_id}",
                headers=auth_headers
            )

        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()

    @pytest.mark.asyncio
    async def test_delete_conversation_not_found(self, client, auth_headers):
        """Test deleting non-existent conversation returns 404."""
        conv_id = str(uuid4())

        with patch(
            "app.api.v1.chat.chat_service.get_conversation",
            new_callable=AsyncMock,
            return_value=None
        ):
            response = await client.delete(
                f"/api/v1/organizations/{TEST_ORG_ID}/chat/conversations/{conv_id}",
                headers=auth_headers
            )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_conversation_other_org(self, client, auth_headers):
        """Test deleting conversation for another org returns 403."""
        conv_id = str(uuid4())

        response = await client.delete(
            f"/api/v1/organizations/{OTHER_ORG_ID}/chat/conversations/{conv_id}",
            headers=auth_headers
        )

        assert response.status_code == 403


class TestChatStream:
    """Tests for POST /api/v1/organizations/{org_id}/chat/stream"""

    @pytest.mark.asyncio
    async def test_stream_chat_new_conversation(
        self, client, auth_headers, mock_conversation
    ):
        """Test streaming chat creates new conversation if none provided."""
        async def mock_stream():
            yield "Hello"
            yield " world"

        with patch(
            "app.api.v1.chat.chat_service.create_conversation",
            new_callable=AsyncMock,
            return_value=mock_conversation
        ), patch(
            "app.api.v1.chat.chat_service.add_message",
            new_callable=AsyncMock
        ), patch(
            "app.api.v1.chat.chat_service.stream_response",
            return_value=mock_stream()
        ):
            response = await client.post(
                f"/api/v1/organizations/{TEST_ORG_ID}/chat/stream",
                json={"message": "Hello"},
                headers=auth_headers
            )

        assert response.status_code == 200
        assert response.headers["content-type"] == "text/event-stream; charset=utf-8"

    @pytest.mark.asyncio
    async def test_stream_chat_existing_conversation(
        self, client, auth_headers, mock_conversation
    ):
        """Test streaming chat with existing conversation."""
        conv_id = mock_conversation["id"]

        async def mock_stream():
            yield "Response"

        with patch(
            "app.api.v1.chat.chat_service.get_conversation",
            new_callable=AsyncMock,
            return_value=mock_conversation
        ), patch(
            "app.api.v1.chat.chat_service.add_message",
            new_callable=AsyncMock
        ), patch(
            "app.api.v1.chat.chat_service.stream_response",
            return_value=mock_stream()
        ):
            response = await client.post(
                f"/api/v1/organizations/{TEST_ORG_ID}/chat/stream",
                json={"message": "Hello", "conversation_id": conv_id},
                headers=auth_headers
            )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_stream_chat_invalid_conversation(
        self, client, auth_headers
    ):
        """Test streaming with invalid conversation ID returns 404."""
        conv_id = str(uuid4())

        with patch(
            "app.api.v1.chat.chat_service.get_conversation",
            new_callable=AsyncMock,
            return_value=None
        ):
            response = await client.post(
                f"/api/v1/organizations/{TEST_ORG_ID}/chat/stream",
                json={"message": "Hello", "conversation_id": conv_id},
                headers=auth_headers
            )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_stream_chat_other_org(self, client, auth_headers):
        """Test streaming chat for another org returns 403."""
        response = await client.post(
            f"/api/v1/organizations/{OTHER_ORG_ID}/chat/stream",
            json={"message": "Hello"},
            headers=auth_headers
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_stream_chat_no_auth(self, client, no_auth_headers):
        """Test streaming chat without auth fails."""
        response = await client.post(
            f"/api/v1/organizations/{TEST_ORG_ID}/chat/stream",
            json={"message": "Hello"},
            headers=no_auth_headers
        )

        assert response.status_code == 401


class TestImageAnalysis:
    """Tests for POST /api/v1/organizations/{org_id}/chat/analyze-image"""

    @pytest.mark.asyncio
    async def test_analyze_image_success(self, client, auth_headers):
        """Test analyzing a project image."""
        mock_result = {
            "success": True,
            "analysis": "This appears to be a bathroom with...",
        }

        # Create a small test image
        image_content = b'\x89PNG\r\n\x1a\n' + b'\x00' * 100

        with patch(
            "app.api.v1.chat.vision_service.analyze_image",
            new_callable=AsyncMock,
            return_value=mock_result
        ):
            response = await client.post(
                f"/api/v1/organizations/{TEST_ORG_ID}/chat/analyze-image",
                files={"file": ("test.png", io.BytesIO(image_content), "image/png")},
                headers=auth_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "analysis" in data

    @pytest.mark.asyncio
    async def test_analyze_image_invalid_type(self, client, auth_headers):
        """Test analyzing with invalid file type returns 400."""
        response = await client.post(
            f"/api/v1/organizations/{TEST_ORG_ID}/chat/analyze-image",
            files={"file": ("test.pdf", io.BytesIO(b"PDF content"), "application/pdf")},
            headers=auth_headers
        )

        assert response.status_code == 400
        assert "Invalid file type" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_analyze_image_too_large(self, client, auth_headers):
        """Test analyzing oversized image returns 400."""
        # Create a file larger than 10MB
        large_content = b'\x89PNG\r\n\x1a\n' + b'\x00' * (11 * 1024 * 1024)

        response = await client.post(
            f"/api/v1/organizations/{TEST_ORG_ID}/chat/analyze-image",
            files={"file": ("large.png", io.BytesIO(large_content), "image/png")},
            headers=auth_headers
        )

        assert response.status_code == 400
        assert "too large" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_analyze_image_other_org(self, client, auth_headers):
        """Test analyzing image for another org returns 403."""
        image_content = b'\x89PNG\r\n\x1a\n' + b'\x00' * 100

        response = await client.post(
            f"/api/v1/organizations/{OTHER_ORG_ID}/chat/analyze-image",
            files={"file": ("test.png", io.BytesIO(image_content), "image/png")},
            headers=auth_headers
        )

        assert response.status_code == 403


class TestMeasurementExtraction:
    """Tests for POST /api/v1/organizations/{org_id}/chat/extract-measurements"""

    @pytest.mark.asyncio
    async def test_extract_measurements_success(self, client, auth_headers):
        """Test extracting measurements from an image."""
        mock_result = {
            "success": True,
            "measurements": "Length: 10ft, Width: 8ft...",
        }

        image_content = b'\x89PNG\r\n\x1a\n' + b'\x00' * 100

        with patch(
            "app.api.v1.chat.vision_service.extract_measurements",
            new_callable=AsyncMock,
            return_value=mock_result
        ):
            response = await client.post(
                f"/api/v1/organizations/{TEST_ORG_ID}/chat/extract-measurements",
                files={"file": ("scan.png", io.BytesIO(image_content), "image/png")},
                headers=auth_headers
            )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    @pytest.mark.asyncio
    async def test_extract_measurements_invalid_type(self, client, auth_headers):
        """Test extracting measurements with invalid file type returns 400."""
        response = await client.post(
            f"/api/v1/organizations/{TEST_ORG_ID}/chat/extract-measurements",
            files={"file": ("test.pdf", io.BytesIO(b"PDF"), "application/pdf")},
            headers=auth_headers
        )

        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_extract_measurements_other_org(self, client, auth_headers):
        """Test extracting measurements for another org returns 403."""
        image_content = b'\x89PNG\r\n\x1a\n' + b'\x00' * 100

        response = await client.post(
            f"/api/v1/organizations/{OTHER_ORG_ID}/chat/extract-measurements",
            files={"file": ("scan.png", io.BytesIO(image_content), "image/png")},
            headers=auth_headers
        )

        assert response.status_code == 403
