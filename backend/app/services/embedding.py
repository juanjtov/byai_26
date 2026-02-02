"""
Embedding service for RAG (Retrieval-Augmented Generation).

Handles document chunking, embedding creation, and similarity search.
Supports section-aware chunking for targeted queries (e.g., "bathroom only").
"""

import logging
import re
from typing import List, Dict, Any, Optional, TypedDict
import httpx

from app.config import get_settings
from app.services.supabase import get_supabase_admin

logger = logging.getLogger("remodly.embedding")


class SectionChunk(TypedDict):
    """A chunk with section metadata."""
    text: str
    section: Optional[str]
    section_index: int


class EmbeddingService:
    """Service for creating and searching document embeddings."""

    CHUNK_SIZE = 1000  # characters per chunk
    CHUNK_OVERLAP = 200  # overlap between chunks
    EMBEDDING_DIMENSION = 1536

    # Patterns for detecting section headers in contractor documents
    SECTION_PATTERNS = [
        # Room types (most common in estimates)
        r'^(?:#{1,3}\s*)?(bathroom|master bath|guest bath|half bath|powder room)\b',
        r'^(?:#{1,3}\s*)?(kitchen|kitchenette)\b',
        r'^(?:#{1,3}\s*)?(bedroom|master bedroom|guest room)\b',
        r'^(?:#{1,3}\s*)?(living room|family room|great room|den)\b',
        r'^(?:#{1,3}\s*)?(dining room|breakfast nook)\b',
        r'^(?:#{1,3}\s*)?(basement|cellar|lower level)\b',
        r'^(?:#{1,3}\s*)?(garage|carport)\b',
        r'^(?:#{1,3}\s*)?(attic|loft)\b',
        r'^(?:#{1,3}\s*)?(laundry|utility room|mudroom)\b',
        r'^(?:#{1,3}\s*)?(exterior|outdoor|patio|deck|porch)\b',
        # Trade categories
        r'^(?:#{1,3}\s*)?(electrical|electric|wiring)\b',
        r'^(?:#{1,3}\s*)?(plumbing|pipes?|water)\b',
        r'^(?:#{1,3}\s*)?(hvac|heating|cooling|air conditioning)\b',
        r'^(?:#{1,3}\s*)?(roofing|roof)\b',
        r'^(?:#{1,3}\s*)?(flooring|floors?|tile|hardwood|carpet)\b',
        r'^(?:#{1,3}\s*)?(painting|paint)\b',
        r'^(?:#{1,3}\s*)?(drywall|sheetrock|walls?)\b',
        r'^(?:#{1,3}\s*)?(framing|structural)\b',
        r'^(?:#{1,3}\s*)?(insulation)\b',
        r'^(?:#{1,3}\s*)?(windows?|doors?)\b',
        r'^(?:#{1,3}\s*)?(siding|exterior finish)\b',
        # Document sections
        r'^(?:#{1,3}\s*)?(scope of work|project scope)\b',
        r'^(?:#{1,3}\s*)?(materials?|supplies)\b',
        r'^(?:#{1,3}\s*)?(labor|installation)\b',
        r'^(?:#{1,3}\s*)?(demolition|demo)\b',
        r'^(?:#{1,3}\s*)?(permit|permits)\b',
        r'^(?:#{1,3}\s*)?(total|summary|grand total)\b',
        r'^(?:#{1,3}\s*)?(terms|payment|conditions)\b',
        r'^(?:#{1,3}\s*)?(exclusions?|not included)\b',
        r'^(?:#{1,3}\s*)?(assumptions?|allowances?)\b',
        # Numbered sections (e.g., "1. Bathroom", "Section 2: Kitchen")
        r'^(?:section\s*)?\d+[.:]\s*([a-zA-Z][a-zA-Z\s]+)',
        # All-caps headers (common in formal estimates)
        r'^([A-Z][A-Z\s]{3,30}):?\s*$',
    ]

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

    def _detect_section(self, line: str) -> Optional[str]:
        """
        Detect if a line is a section header.

        Args:
            line: Line of text to check

        Returns:
            Normalized section name or None
        """
        line = line.strip()
        if not line or len(line) > 80:  # Headers are typically short
            return None

        for pattern in self.SECTION_PATTERNS:
            match = re.match(pattern, line, re.IGNORECASE)
            if match:
                # Return the captured group if exists, otherwise the full match
                section = match.group(1) if match.lastindex else match.group(0)
                # Normalize: lowercase, strip, remove special chars
                section = re.sub(r'[:#\d\.\s]+$', '', section).strip().lower()
                return section if section else None

        return None

    def chunk_text_by_sections(self, text: str) -> List[SectionChunk]:
        """
        Split text by section headers for targeted queries.

        Detects section headers (Bathroom, Kitchen, Electrical, etc.) and
        creates chunks that preserve section context. Falls back to standard
        chunking if no sections are detected.

        Args:
            text: Full document text

        Returns:
            List of SectionChunk with text, section name, and section index
        """
        if not text:
            return []

        lines = text.split('\n')
        sections: List[Dict[str, Any]] = []
        current_section: Optional[str] = None
        current_content: List[str] = []
        section_index = 0

        for line in lines:
            detected = self._detect_section(line)

            if detected:
                # Save previous section if exists
                if current_content:
                    content = '\n'.join(current_content).strip()
                    if content:
                        sections.append({
                            'section': current_section,
                            'content': content,
                            'section_index': section_index
                        })
                        section_index += 1

                current_section = detected
                current_content = [line]  # Include header in content
            else:
                current_content.append(line)

        # Add final section
        if current_content:
            content = '\n'.join(current_content).strip()
            if content:
                sections.append({
                    'section': current_section,
                    'content': content,
                    'section_index': section_index
                })

        # If no sections detected, fall back to standard chunking
        if len(sections) <= 1 and not sections[0].get('section') if sections else True:
            logger.debug("No sections detected, falling back to standard chunking")
            simple_chunks = self.chunk_text(text)
            return [
                SectionChunk(text=chunk, section=None, section_index=i)
                for i, chunk in enumerate(simple_chunks)
            ]

        # Now chunk each section while preserving section metadata
        result: List[SectionChunk] = []
        for sec in sections:
            section_content = sec['content']
            section_name = sec['section']
            base_index = sec['section_index']

            # If section is small enough, keep it whole
            if len(section_content) <= self.CHUNK_SIZE:
                result.append(SectionChunk(
                    text=section_content,
                    section=section_name,
                    section_index=base_index
                ))
            else:
                # Chunk the section content
                section_chunks = self.chunk_text(section_content)
                for i, chunk in enumerate(section_chunks):
                    result.append(SectionChunk(
                        text=chunk,
                        section=section_name,
                        section_index=base_index
                    ))

        logger.info(f"Created {len(result)} section-aware chunks from {len(sections)} sections")
        return result

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
        metadata: Optional[dict] = None,
        use_section_chunking: bool = True
    ) -> int:
        """
        Create and store embeddings for a document.

        Uses section-aware chunking by default to enable targeted queries
        like "show me bathroom pricing" or "electrical work only".

        Args:
            doc_id: Document UUID
            org_id: Organization UUID
            text: Full document text
            metadata: Optional metadata to store with embeddings
            use_section_chunking: Whether to use section-aware chunking (default True)

        Returns:
            Number of chunks created
        """
        base_metadata = metadata or {}

        if use_section_chunking:
            section_chunks = self.chunk_text_by_sections(text)

            if not section_chunks:
                logger.warning(f"No chunks created for document {doc_id}")
                return 0

            logger.info(f"Creating {len(section_chunks)} section-aware embeddings for document {doc_id}")

            for i, chunk in enumerate(section_chunks):
                embedding = await self.create_embedding(chunk['text'])

                # Merge section metadata with base metadata
                chunk_metadata = {
                    **base_metadata,
                    "section": chunk['section'],
                    "section_index": chunk['section_index'],
                }

                self.admin.table("document_embeddings").insert({
                    "document_id": doc_id,
                    "organization_id": org_id,
                    "chunk_index": i,
                    "chunk_text": chunk['text'],
                    "embedding": embedding,
                    "metadata": chunk_metadata,
                }).execute()

            sections_found = set(c['section'] for c in section_chunks if c['section'])
            logger.info(
                f"Successfully created {len(section_chunks)} embeddings for document {doc_id}, "
                f"sections: {sections_found or 'none detected'}"
            )
            return len(section_chunks)

        else:
            # Original chunking logic
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
                    "metadata": base_metadata,
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

    async def search_similar_by_section(
        self,
        org_id: str,
        query: str,
        section: Optional[str] = None,
        limit: int = 5,
        min_similarity: float = 0.3
    ) -> List[Dict[str, Any]]:
        """
        Find similar document chunks, optionally filtered by section.

        Enables targeted queries like "bathroom pricing" or "electrical work only".

        Args:
            org_id: Organization UUID
            query: Search query text
            section: Optional section name to filter by (e.g., "bathroom", "electrical")
            limit: Maximum results to return
            min_similarity: Minimum similarity threshold

        Returns:
            List of matching chunks with section metadata and similarity scores
        """
        search_desc = f"org {org_id}, query: {query[:50]}..."
        if section:
            search_desc += f", section: {section}"
        logger.debug(f"Section-filtered search for {search_desc}")

        try:
            query_embedding = await self.create_embedding(query)
        except Exception as e:
            logger.error(f"Failed to create query embedding: {e}")
            return []

        try:
            result = self.admin.rpc(
                "match_document_embeddings_by_section",
                {
                    "query_embedding": query_embedding,
                    "match_org_id": org_id,
                    "match_section": section,
                    "match_count": limit,
                }
            ).execute()

            all_matches = result.data or []

            if all_matches:
                top_score = max(m.get("similarity", 0) for m in all_matches)
                sections_found = set(m.get("section") for m in all_matches if m.get("section"))
                logger.info(
                    f"Section search: {len(all_matches)} matches, "
                    f"top similarity: {top_score:.3f}, sections: {sections_found}"
                )

            # Filter by minimum similarity
            matches = [
                m for m in all_matches
                if m.get("similarity", 0) >= min_similarity
            ]

            return matches

        except Exception as e:
            logger.error(f"Section-filtered vector search failed: {e}")
            # Fall back to standard search
            logger.info("Falling back to standard search")
            return await self.search_similar(org_id, query, limit, min_similarity)

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
