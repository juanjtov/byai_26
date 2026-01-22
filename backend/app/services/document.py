from typing import Optional
import uuid

from app.services.supabase import get_supabase_admin


class DocumentService:
    """Service for document operations."""

    def __init__(self):
        self.admin = get_supabase_admin()

    async def get_upload_url(self, org_id: str, filename: str, content_type: str) -> dict:
        """Generate a signed upload URL for document upload."""
        # Generate unique file path
        file_id = str(uuid.uuid4())
        file_ext = filename.split(".")[-1] if "." in filename else "pdf"
        file_path = f"{org_id}/{file_id}.{file_ext}"

        # Create signed upload URL
        response = self.admin.storage.from_("documents").create_signed_upload_url(file_path)

        return {
            "upload_url": response.get("signedURL") or response.get("signed_url"),
            "file_path": file_path,
            "file_id": file_id,
        }

    async def create_document(self, org_id: str, data: dict) -> dict:
        """Create a document record after upload."""
        doc_data = {
            "organization_id": org_id,
            "name": data["name"],
            "type": data["type"],
            "file_path": data["file_path"],
            "file_size": data.get("file_size"),
            "mime_type": data.get("mime_type"),
            "status": "pending",
        }

        response = self.admin.table("documents").insert(doc_data).execute()

        if not response.data:
            raise ValueError("Failed to create document record")

        return response.data[0]

    async def get_documents(self, org_id: str) -> list[dict]:
        """Get all documents for organization."""
        response = self.admin.table("documents").select("*").eq("organization_id", org_id).order("created_at", desc=True).execute()
        return response.data or []

    async def get_document(self, doc_id: str) -> Optional[dict]:
        """Get a single document by ID."""
        response = self.admin.table("documents").select("*").eq("id", doc_id).execute()
        return response.data[0] if response.data else None

    async def update_document_status(self, doc_id: str, status: str, extracted_data: Optional[dict] = None) -> dict:
        """Update document status and extracted data."""
        update_data = {
            "status": status,
            "updated_at": "now()",
        }

        if extracted_data is not None:
            update_data["extracted_data"] = extracted_data

        response = self.admin.table("documents").update(update_data).eq("id", doc_id).execute()

        if not response.data:
            raise ValueError("Failed to update document")

        return response.data[0]

    async def delete_document(self, doc_id: str, file_path: str) -> bool:
        """Delete a document and its file."""
        # Delete from storage
        self.admin.storage.from_("documents").remove([file_path])

        # Delete from database
        self.admin.table("documents").delete().eq("id", doc_id).execute()

        return True

    async def get_download_url(self, file_path: str) -> str:
        """Get a signed download URL for a document."""
        response = self.admin.storage.from_("documents").create_signed_url(file_path, 3600)  # 1 hour expiry
        return response.get("signedURL") or response.get("signed_url")
