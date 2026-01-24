"""
Embedding service for RAG (Retrieval-Augmented Generation).

Handles document chunking, embedding creation, and similarity search.
"""

from typing import List, Dict, Any, Optional
import httpx

from app.config import get_settings
from app.services.supabase import get_supabase_admin


class EmbeddingService:
    """Service for creating and searching document embeddings."""

    CHUNK_SIZE = 1000  # characters per chunk
    CHUNK_OVERLAP = 200  # overlap between chunks
    EMBEDDING_MODEL = "openai/text-embedding-3-small"  # Via OpenRouter
    EMBEDDING_DIMENSION = 1536

    def __init__(self):
        self.admin = get_supabase_admin()
        settings = get_settings()
        self.openrouter_api_key = settings.openrouter_api_key

    def chunk_text(self, text: str) -> List[str]:
        """
        Split text into overlapping chunks for embedding.

        Args:
            text: Full document text

        Returns:
            List of text chunks
        """
        if not text or len(text) <= self.CHUNK_SIZE:
            return [text] if text else []

        chunks = []
        start = 0

        while start < len(text):
            end = start + self.CHUNK_SIZE

            # Try to break at sentence boundary
            if end < len(text):
                # Look for sentence ending punctuation
                for punct in ['. ', '.\n', '! ', '!\n', '? ', '?\n']:
                    last_punct = text[start:end].rfind(punct)
                    if last_punct > self.CHUNK_SIZE // 2:
                        end = start + last_punct + len(punct)
                        break

            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)

            # Move start position with overlap
            start = end - self.CHUNK_OVERLAP

        return chunks

    async def create_embedding(self, text: str) -> List[float]:
        """
        Create embedding for a text chunk using OpenRouter.

        Args:
            text: Text to embed

        Returns:
            List of floats (embedding vector)
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/embeddings",
                headers={
                    "Authorization": f"Bearer {self.openrouter_api_key}",
                    "HTTP-Referer": "https://remodly.com",
                    "X-Title": "REMODLY Embeddings",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.EMBEDDING_MODEL,
                    "input": text,
                },
                timeout=30.0,
            )

            if response.status_code != 200:
                raise Exception(f"OpenRouter embedding error: {response.status_code} - {response.text}")

            result = response.json()
            return result["data"][0]["embedding"]

    async def embed_document(
        self,
        doc_id: str,
        org_id: str,
        text: str,
        metadata: Optional[dict] = None
    ) -> int:
        """
        Create and store embeddings for a document.

        Args:
            doc_id: Document UUID
            org_id: Organization UUID
            text: Full document text
            metadata: Optional metadata to store with embeddings

        Returns:
            Number of chunks created
        """
        chunks = self.chunk_text(text)

        if not chunks:
            return 0

        for i, chunk in enumerate(chunks):
            embedding = await self.create_embedding(chunk)

            self.admin.table("document_embeddings").insert({
                "document_id": doc_id,
                "organization_id": org_id,
                "chunk_index": i,
                "chunk_text": chunk,
                "embedding": embedding,
                "metadata": metadata or {},
            }).execute()

        return len(chunks)

    async def delete_document_embeddings(self, doc_id: str) -> None:
        """
        Delete all embeddings for a document.

        Args:
            doc_id: Document UUID
        """
        self.admin.table("document_embeddings").delete().eq(
            "document_id", doc_id
        ).execute()

    async def search_similar(
        self,
        org_id: str,
        query: str,
        limit: int = 5,
        min_similarity: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        Find similar document chunks using vector search.

        Args:
            org_id: Organization UUID
            query: Search query text
            limit: Maximum results to return
            min_similarity: Minimum similarity threshold

        Returns:
            List of matching chunks with similarity scores
        """
        query_embedding = await self.create_embedding(query)

        result = self.admin.rpc(
            "match_document_embeddings",
            {
                "query_embedding": query_embedding,
                "match_org_id": org_id,
                "match_count": limit,
            }
        ).execute()

        # Filter by minimum similarity
        matches = [
            m for m in (result.data or [])
            if m.get("similarity", 0) >= min_similarity
        ]

        return matches

    async def get_org_context(
        self,
        org_id: str,
        query: str,
        max_chars: int = 4000
    ) -> str:
        """
        Build RAG context string from organization's documents.

        Args:
            org_id: Organization UUID
            query: Query to find relevant context for
            max_chars: Maximum total characters in context

        Returns:
            Formatted context string
        """
        similar_chunks = await self.search_similar(org_id, query, limit=5)

        if not similar_chunks:
            return ""

        context_parts = []
        total_chars = 0

        for chunk in similar_chunks:
            chunk_text = chunk.get("chunk_text", "")
            if total_chars + len(chunk_text) > max_chars:
                # Truncate last chunk if needed
                remaining = max_chars - total_chars
                if remaining > 100:
                    context_parts.append(f"[Document excerpt]: {chunk_text[:remaining]}...")
                break

            context_parts.append(f"[Document excerpt]: {chunk_text}")
            total_chars += len(chunk_text)

        return "\n\n".join(context_parts)
