"""
Chat API endpoints for AI-powered estimate generation.
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import List, Optional
import json

from app.dependencies import get_current_user_context
from app.services.chat import ChatService
from app.services.vision import VisionService
from app.services.document_generator import DocumentGeneratorService
from app.schemas.chat import (
    ConversationCreate,
    ConversationUpdate,
    ConversationResponse,
    ConversationWithMessagesResponse,
    ConversationSearchResult,
    SearchRequest,
    StreamingChatRequest,
    ImageAnalysisResponse,
)

router = APIRouter()
chat_service = ChatService()
vision_service = VisionService()
document_generator = DocumentGeneratorService()


@router.post("/{org_id}/chat/conversations", response_model=ConversationResponse)
async def create_conversation(
    org_id: str,
    data: ConversationCreate,
    user_context: tuple = Depends(get_current_user_context),
):
    """Create a new chat conversation."""
    user_id, current_org_id = user_context

    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    conversation = await chat_service.create_conversation(org_id, user_id, data.title)
    return conversation


@router.get("/{org_id}/chat/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    org_id: str,
    saved_only: bool = False,
    search: Optional[str] = None,
    limit: int = 50,
    user_context: tuple = Depends(get_current_user_context),
):
    """
    Get user's conversations.

    - saved_only: Filter to only saved conversations (default False since auto-save)
    - search: Optional search query for full-text search
    - limit: Maximum results to return
    """
    user_id, current_org_id = user_context

    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    if search:
        # Use full-text search
        conversations = await chat_service.search_conversations(
            org_id, user_id, search, limit
        )
    else:
        conversations = await chat_service.get_user_conversations(
            org_id, user_id, saved_only, limit
        )
    return conversations


@router.get("/{org_id}/chat/conversations/{conversation_id}", response_model=ConversationWithMessagesResponse)
async def get_conversation(
    org_id: str,
    conversation_id: str,
    user_context: tuple = Depends(get_current_user_context),
):
    """Get a specific conversation with messages."""
    user_id, current_org_id = user_context

    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    conv = await chat_service.get_conversation(conversation_id)

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conv["organization_id"] != org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return conv


@router.patch("/{org_id}/chat/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    org_id: str,
    conversation_id: str,
    data: ConversationUpdate,
    user_context: tuple = Depends(get_current_user_context),
):
    """Update a conversation (save, rename)."""
    user_id, current_org_id = user_context

    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Verify conversation belongs to org
    conv = await chat_service.get_conversation(conversation_id)
    if not conv or conv["organization_id"] != org_id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if data.is_saved:
        # Generate title if not provided
        title = data.title
        if not title and data.is_saved:
            try:
                title = await chat_service.generate_conversation_title(conversation_id)
            except Exception:
                title = "Saved Estimate"

        return await chat_service.save_conversation(conversation_id, title)

    # Other updates (just title)
    if data.title:
        return await chat_service.save_conversation(conversation_id, data.title)

    return conv


@router.delete("/{org_id}/chat/conversations/{conversation_id}")
async def delete_conversation(
    org_id: str,
    conversation_id: str,
    user_context: tuple = Depends(get_current_user_context),
):
    """Delete a conversation."""
    user_id, current_org_id = user_context

    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Verify conversation belongs to org
    conv = await chat_service.get_conversation(conversation_id)
    if not conv or conv["organization_id"] != org_id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await chat_service.delete_conversation(conversation_id)
    return {"message": "Conversation deleted"}


@router.post("/{org_id}/chat/search", response_model=List[ConversationSearchResult])
async def search_conversations(
    org_id: str,
    data: SearchRequest,
    user_context: tuple = Depends(get_current_user_context),
):
    """Search user's conversations using full-text search."""
    user_id, current_org_id = user_context

    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    results = await chat_service.search_conversations(
        org_id, user_id, data.query, data.limit
    )
    return results


@router.post("/{org_id}/chat/stream")
async def stream_chat(
    org_id: str,
    data: StreamingChatRequest,
    user_context: tuple = Depends(get_current_user_context),
):
    """
    Stream a chat response using Server-Sent Events (SSE).

    The response format is:
    - data: {"conversation_id": "uuid", "type": "start"} - Start event with conversation ID
    - data: {"content": "chunk", "type": "chunk"} - Content chunks
    - data: {"type": "done"} - Completion event
    """
    user_id, current_org_id = user_context

    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Create or validate conversation
    conversation_id = data.conversation_id
    if conversation_id:
        # Validate existing conversation
        conv = await chat_service.get_conversation(conversation_id)
        if not conv or conv["organization_id"] != org_id:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        # Create new conversation
        conv = await chat_service.create_conversation(org_id, user_id)
        conversation_id = conv["id"]

    # Save user message
    await chat_service.add_message(conversation_id, "user", data.message)

    async def generate():
        """Generate SSE stream."""
        # Send start event with conversation ID
        yield f"data: {json.dumps({'conversation_id': conversation_id, 'type': 'start'})}\n\n"

        try:
            # Stream AI response (pass user_id for context retrieval)
            async for chunk in chat_service.stream_response(
                org_id, user_id, conversation_id, data.message
            ):
                yield f"data: {json.dumps({'content': chunk, 'type': 'chunk'})}\n\n"

            # Send done event
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            # Send error event
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


@router.post("/{org_id}/chat/analyze-image", response_model=ImageAnalysisResponse)
async def analyze_project_image(
    org_id: str,
    file: UploadFile = File(...),
    context: Optional[str] = Form(None),
    user_context: tuple = Depends(get_current_user_context),
):
    """
    Analyze an uploaded project image for estimation purposes.

    Extracts room type, dimensions, existing conditions, materials,
    fixtures, and any visible measurements.
    """
    user_id, current_org_id = user_context

    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )

    # Read file content
    content = await file.read()

    # Limit file size (10MB)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB.")

    # Analyze image
    result = await vision_service.analyze_image(
        content,
        mime_type=file.content_type,
        additional_context=context or ""
    )

    if not result.get("success"):
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "Image analysis failed")
        )

    return {
        "success": True,
        "analysis": result.get("analysis", ""),
        "filename": file.filename,
    }


@router.post("/{org_id}/chat/extract-measurements", response_model=ImageAnalysisResponse)
async def extract_image_measurements(
    org_id: str,
    file: UploadFile = File(...),
    user_context: tuple = Depends(get_current_user_context),
):
    """
    Extract measurements and dimensions from a project image or LiDAR scan.

    Specifically designed for images with visible measurements,
    annotations, or LiDAR scan outputs.
    """
    user_id, current_org_id = user_context

    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )

    # Read file content
    content = await file.read()

    # Limit file size (10MB)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB.")

    # Extract measurements
    result = await vision_service.extract_measurements(
        content,
        mime_type=file.content_type
    )

    if not result.get("success"):
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "Measurement extraction failed")
        )

    return {
        "success": True,
        "analysis": result.get("measurements", ""),
        "filename": file.filename,
    }


@router.post("/{org_id}/chat/conversations/{conversation_id}/export")
async def export_conversation_message(
    org_id: str,
    conversation_id: str,
    message_id: Optional[str] = None,
    user_context: tuple = Depends(get_current_user_context),
):
    """
    Export a conversation message as a Word document.

    The document is styled using the organization's format patterns
    (fonts, colors, sections) extracted from their uploaded documents.

    Args:
        org_id: Organization ID
        conversation_id: Conversation ID
        message_id: Optional specific message ID to export.
                   If not provided, exports the last assistant message.

    Returns:
        {"download_url": "signed URL to download the document"}
    """
    user_id, current_org_id = user_context

    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Get conversation
    conv = await chat_service.get_conversation(conversation_id)
    if not conv or conv["organization_id"] != org_id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = conv.get("messages", [])
    if not messages:
        raise HTTPException(status_code=400, detail="No messages in conversation")

    # Find the message to export
    message_content = None
    if message_id:
        # Find specific message
        for msg in messages:
            if msg["id"] == message_id:
                message_content = msg["content"]
                break
        if not message_content:
            raise HTTPException(status_code=404, detail="Message not found")
    else:
        # Get last assistant message
        for msg in reversed(messages):
            if msg["role"] == "assistant":
                message_content = msg["content"]
                break
        if not message_content:
            raise HTTPException(status_code=400, detail="No assistant messages to export")

    # Generate title from conversation
    title = conv.get("title", "Estimate")
    if title == "New Estimate":
        title = "Estimate"

    # Generate and upload document
    try:
        download_url = await document_generator.export_message(
            org_id, message_content, title
        )
        return {"download_url": download_url}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate document: {str(e)}"
        )
