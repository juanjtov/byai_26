"""
Document processor service for text extraction and embedding.

Extracts text from uploaded documents and creates embeddings for RAG.
"""

import io
import httpx
from pypdf import PdfReader
from typing import Optional

from app.services.supabase import get_supabase_admin
from app.services.embedding import EmbeddingService
from app.services.document import DocumentService
from app.services.format_extractor import FormatExtractorService


class DocumentProcessorService:
    """Service for processing documents and creating embeddings."""

    # Document types that should have format patterns extracted
    FORMAT_EXTRACTABLE_TYPES = ["contract", "estimate", "proposal", "invoice", "quote"]

    def __init__(self):
        self.admin = get_supabase_admin()
        self.embedding_service = EmbeddingService()
        self.doc_service = DocumentService()
        self.format_extractor = FormatExtractorService()

    async def process_and_embed_document(self, doc_id: str, org_id: str) -> None:
        """
        Extract text from document and create embeddings.

        This is designed to run as a background task after document upload.

        Args:
            doc_id: Document UUID
            org_id: Organization UUID
        """
        try:
            # Update status to processing
            await self.doc_service.update_document_status(doc_id, "processing")

            # Get document record
            doc = await self.doc_service.get_document(doc_id)
            if not doc:
                return

            # Download file from storage
            download_url = await self.doc_service.get_download_url(doc["file_path"])
            if not download_url:
                await self.doc_service.update_document_status(
                    doc_id, "error", {"error": "Could not get download URL"}
                )
                return

            # Extract text based on mime type
            mime_type = doc.get("mime_type", "")
            text = await self.extract_text(download_url, mime_type)

            if text:
                # Create embeddings
                chunks_created = await self.embedding_service.embed_document(
                    doc_id,
                    org_id,
                    text,
                    {
                        "name": doc.get("name", ""),
                        "type": doc.get("type", ""),
                    }
                )

                # Extract format patterns for relevant document types
                doc_type = doc.get("type", "").lower()
                format_extracted = False
                if doc_type in self.FORMAT_EXTRACTABLE_TYPES:
                    patterns = await self.format_extractor.extract_format_from_document(
                        doc_id, org_id, text,
                        {"name": doc.get("name", ""), "type": doc_type}
                    )
                    format_extracted = patterns is not None

                # Update with extracted data
                await self.doc_service.update_document_status(
                    doc_id,
                    "processed",
                    {
                        "text_length": len(text),
                        "chunks_created": chunks_created,
                        "format_extracted": format_extracted,
                    }
                )
            else:
                # No text extracted, still mark as processed
                await self.doc_service.update_document_status(
                    doc_id,
                    "processed",
                    {"text_length": 0, "note": "No text extracted"}
                )

        except Exception as e:
            await self.doc_service.update_document_status(
                doc_id, "error", {"error": str(e)}
            )

    async def extract_text(self, file_url: str, mime_type: str) -> Optional[str]:
        """
        Extract text from various document types.

        Args:
            file_url: Signed download URL
            mime_type: Document MIME type

        Returns:
            Extracted text or None
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(file_url, timeout=60.0)
                if response.status_code != 200:
                    return None
                content = response.content

            # PDF extraction
            if "pdf" in mime_type.lower():
                return self._extract_pdf_text(content)

            # Plain text
            if "text" in mime_type.lower():
                return content.decode("utf-8", errors="ignore")

            # Word documents (.docx)
            if "wordprocessingml" in mime_type.lower() or "docx" in mime_type.lower():
                return self._extract_docx_text(content)

            # Excel spreadsheets (.xlsx)
            if "spreadsheetml" in mime_type.lower() or "xlsx" in mime_type.lower():
                return self._extract_xlsx_text(content)

            return None

        except Exception:
            return None

    def _extract_pdf_text(self, content: bytes) -> str:
        """
        Extract text from PDF content.

        Args:
            content: PDF file bytes

        Returns:
            Extracted text
        """
        try:
            reader = PdfReader(io.BytesIO(content))
            text_parts = []

            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)

            return "\n\n".join(text_parts)

        except Exception:
            return ""

    def _extract_docx_text(self, content: bytes) -> str:
        """
        Extract text from Word document.

        Args:
            content: DOCX file bytes

        Returns:
            Extracted text
        """
        try:
            from docx import Document

            doc = Document(io.BytesIO(content))
            text_parts = []

            # Extract paragraphs
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text_parts.append(paragraph.text)

            # Extract tables
            for table in doc.tables:
                for row in table.rows:
                    cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if cells:
                        text_parts.append(" | ".join(cells))

            return "\n".join(text_parts)

        except Exception:
            return ""

    def _extract_xlsx_text(self, content: bytes) -> str:
        """
        Extract text from Excel spreadsheet.

        Args:
            content: XLSX file bytes

        Returns:
            Extracted text
        """
        try:
            from openpyxl import load_workbook

            wb = load_workbook(io.BytesIO(content), data_only=True)
            text_parts = []

            for sheet in wb.worksheets:
                text_parts.append(f"## Sheet: {sheet.title}")

                for row in sheet.iter_rows(values_only=True):
                    cells = [str(c) for c in row if c is not None]
                    if cells:
                        text_parts.append(" | ".join(cells))

            return "\n".join(text_parts)

        except Exception:
            return ""

    async def reprocess_document(self, doc_id: str, org_id: str) -> None:
        """
        Reprocess a document, deleting existing embeddings and format patterns first.

        Args:
            doc_id: Document UUID
            org_id: Organization UUID
        """
        # Delete existing embeddings and format patterns
        await self.embedding_service.delete_document_embeddings(doc_id)
        await self.format_extractor.delete_document_patterns(doc_id)

        # Process again
        await self.process_and_embed_document(doc_id, org_id)
