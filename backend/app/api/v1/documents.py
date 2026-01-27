from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List

from app.dependencies import get_current_org_id
from app.services.document import DocumentService
from app.services.document_processor import DocumentProcessorService
from app.schemas.document import (
    UploadUrlRequest,
    UploadUrlResponse,
    DocumentCreate,
    DocumentResponse,
)

router = APIRouter()
doc_service = DocumentService()
doc_processor = DocumentProcessorService()


@router.post("/{org_id}/documents/upload-url", response_model=UploadUrlResponse)
async def get_upload_url(
    org_id: str,
    request: UploadUrlRequest,
    current_org_id: str = Depends(get_current_org_id),
):
    """Get a signed upload URL for document upload."""
    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        result = await doc_service.get_upload_url(org_id, request.filename, request.content_type)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate upload URL: {str(e)}")


@router.post("/{org_id}/documents", response_model=DocumentResponse)
async def create_document(
    org_id: str,
    data: DocumentCreate,
    background_tasks: BackgroundTasks,
    current_org_id: str = Depends(get_current_org_id),
):
    """Register a document after upload and trigger processing."""
    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        document = await doc_service.create_document(org_id, data.model_dump())

        # Process document and create embeddings in background
        background_tasks.add_task(
            doc_processor.process_and_embed_document,
            document["id"],
            org_id
        )

        return document
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{org_id}/documents", response_model=List[DocumentResponse])
async def list_documents(org_id: str, current_org_id: str = Depends(get_current_org_id)):
    """Get all documents for an organization."""
    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    documents = await doc_service.get_documents(org_id)
    return documents


@router.get("/{org_id}/documents/{doc_id}", response_model=DocumentResponse)
async def get_document(
    org_id: str,
    doc_id: str,
    current_org_id: str = Depends(get_current_org_id),
):
    """Get a specific document."""
    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    document = await doc_service.get_document(doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if document["organization_id"] != org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return document


@router.get("/{org_id}/documents/{doc_id}/download-url")
async def get_download_url(
    org_id: str,
    doc_id: str,
    current_org_id: str = Depends(get_current_org_id),
):
    """Get a signed download URL for a document."""
    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    document = await doc_service.get_document(doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if document["organization_id"] != org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        download_url = await doc_service.get_download_url(document["file_path"])
        return {"download_url": download_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate download URL: {str(e)}")


@router.delete("/{org_id}/documents/{doc_id}")
async def delete_document(
    org_id: str,
    doc_id: str,
    current_org_id: str = Depends(get_current_org_id),
):
    """Delete a document."""
    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    document = await doc_service.get_document(doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if document["organization_id"] != org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    await doc_service.delete_document(doc_id, document["file_path"])
    return {"message": "Document deleted"}


@router.post("/{org_id}/documents/{doc_id}/reprocess")
async def reprocess_document(
    org_id: str,
    doc_id: str,
    background_tasks: BackgroundTasks,
    current_org_id: str = Depends(get_current_org_id),
):
    """Trigger reprocessing of a document."""
    if org_id != current_org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Verify document exists and belongs to org
    document = await doc_service.get_document(doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if document["organization_id"] != org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Trigger reprocessing in background
    background_tasks.add_task(
        doc_processor.reprocess_document,
        doc_id,
        org_id
    )

    return {"message": "Document reprocessing started", "status": "processing"}
