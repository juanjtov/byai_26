from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class UploadUrlRequest(BaseModel):
    filename: str
    content_type: str = "application/pdf"


class UploadUrlResponse(BaseModel):
    upload_url: str
    file_path: str
    file_id: str


class DocumentCreate(BaseModel):
    name: str
    type: str  # 'contract', 'cost_sheet', 'addendum', 'other'
    file_path: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None


class DocumentResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    type: str
    file_path: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    status: str  # 'pending', 'processing', 'processed', 'error'
    extracted_data: Optional[Any] = None
    created_at: datetime
    updated_at: datetime
