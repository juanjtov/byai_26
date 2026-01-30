"""
Pydantic schemas for chat functionality.
"""

from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


# Request schemas

class ChatMessageCreate(BaseModel):
    """Request to create a chat message."""
    content: str


class ConversationCreate(BaseModel):
    """Request to create a conversation."""
    title: Optional[str] = None


class ConversationUpdate(BaseModel):
    """Request to update a conversation."""
    title: Optional[str] = None
    is_saved: Optional[bool] = None


class StreamingChatRequest(BaseModel):
    """Request to send a streaming chat message."""
    conversation_id: Optional[str] = None  # None = create new conversation
    message: str


# Response schemas

class ChatMessageResponse(BaseModel):
    """Response for a chat message."""
    id: str
    conversation_id: str
    role: str  # 'user', 'assistant', 'system'
    content: str
    metadata: Optional[dict] = None
    created_at: datetime


class ConversationResponse(BaseModel):
    """Response for a conversation."""
    id: str
    organization_id: str
    user_id: Optional[str] = None
    title: Optional[str] = None
    summary: Optional[str] = None
    tags: List[str] = []
    message_count: int = 0
    project_context: Optional[dict] = None
    is_saved: bool
    created_at: datetime
    updated_at: datetime


class ConversationWithMessagesResponse(ConversationResponse):
    """Response for a conversation with its messages."""
    messages: List[ChatMessageResponse] = []


class ConversationListResponse(BaseModel):
    """Response for listing conversations."""
    conversations: List[ConversationResponse]


class ImageAnalysisResponse(BaseModel):
    """Response for image analysis."""
    success: bool
    analysis: str
    filename: Optional[str] = None


class ConversationSearchResult(BaseModel):
    """Response for a conversation search result."""
    id: str
    organization_id: str
    user_id: Optional[str] = None
    title: Optional[str] = None
    summary: Optional[str] = None
    tags: List[str] = []
    message_count: int = 0
    project_context: Optional[dict] = None
    is_saved: bool
    created_at: datetime
    updated_at: datetime
    rank: Optional[float] = None


class SearchRequest(BaseModel):
    """Request for conversation search."""
    query: str
    limit: int = 20
