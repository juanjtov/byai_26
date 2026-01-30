"""
Embedding service for RAG (Retrieval-Augmented Generation).

Handles document chunking, embedding creation, and similarity search.
"""

import logging
from typing import List, Dict, Any, Optional
import httpx

from app.config import get_settings
from app.services.supabase import get_supabase_admin

logger = logging.getLogger("remodly.embedding")


class EmbeddingService:
    """Service for creating and searching document embeddings."""

    CHUNK_SIZE = 1000  # characters per chunk
    CHUNK_OVERLAP = 200  # overlap between chunks
    EMBEDDING_DIMENSION = 1536

    def __init__(self):
        self.admin = get_supabase_admin()
        settings = get_settings()
        self.openrouter_api_key = settings.openrouter_api_key
        self.embedding_model = settings.openrouter_embedding_model

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
                    "model": self.embedding_model,
                    "input": text,
                },
                timeout=30.0,
            )

            if response.status_code != 200:
                logger.error(f"OpenRouter embedding error: {response.status_code} - {response.text}")
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
            logger.warning(f"No chunks created for document {doc_id}")
            return 0

        logger.info(f"Creating {len(chunks)} embeddings for document {doc_id}")

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

        logger.info(f"Successfully created {len(chunks)} embeddings for document {doc_id}")
        return len(chunks)

    async def delete_document_embeddings(self, doc_id: str) -> None:
        """
        Delete all embeddings for a document.

        Args:
            doc_id: Document UUID
        """
        logger.info(f"Deleting embeddings for document {doc_id}")
        self.admin.table("document_embeddings").delete().eq(
            "document_id", doc_id
        ).execute()
        logger.debug(f"Deleted embeddings for document {doc_id}")

    async def search_similar(
        self,
        org_id: str,
        query: str,
        limit: int = 5,
        min_similarity: float = 0.3
    ) -> List[Dict[str, Any]]:
        """
        Find similar document chunks using vector search.

        Args:
            org_id: Organization UUID
            query: Search query text
            limit: Maximum results to return
            min_similarity: Minimum similarity threshold (default 0.3 for good recall)

        Returns:
            List of matching chunks with similarity scores
        """
        logger.debug(f"Searching similar documents for org {org_id}, query: {query[:100]}...")

        try:
            query_embedding = await self.create_embedding(query)
            logger.debug(f"Created query embedding, dimension: {len(query_embedding)}")
        except Exception as e:
            logger.error(f"Failed to create query embedding: {e}")
            return []

        try:
            result = self.admin.rpc(
                "match_document_embeddings",
                {
                    "query_embedding": query_embedding,
                    "match_org_id": org_id,
                    "match_count": limit,
                }
            ).execute()

            all_matches = result.data or []
            logger.debug(f"Found {len(all_matches)} raw matches from vector search")

            if all_matches:
                top_score = max(m.get("similarity", 0) for m in all_matches)
                logger.info(f"RAG search: {len(all_matches)} matches, top similarity: {top_score:.3f}")

            # Filter by minimum similarity
            matches = [
                m for m in all_matches
                if m.get("similarity", 0) >= min_similarity
            ]

            logger.info(f"Returning {len(matches)} matches above threshold {min_similarity}")
            return matches

        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return []

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
            logger.info(f"No document context found for org {org_id}, query: {query[:50]}...")
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

        logger.info(f"Built RAG context: {len(context_parts)} chunks, {total_chars} chars for org {org_id}")
        return "\n\n".join(context_parts)
