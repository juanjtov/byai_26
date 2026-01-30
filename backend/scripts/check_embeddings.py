#!/usr/bin/env python3
"""
Check embeddings stored in database to verify they're valid.
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.supabase import get_supabase_admin


async def check_embeddings():
    admin = get_supabase_admin()

    print("Checking stored embeddings...\n")

    # Get a sample embedding from the database
    sample = admin.table("document_embeddings").select(
        "id, document_id, chunk_index, embedding, chunk_text"
    ).limit(1).execute()

    if not sample.data:
        print("[ERROR] No embeddings found in database!")
        return

    embedding_data = sample.data[0]
    embedding = embedding_data.get('embedding')
    chunk_text = embedding_data.get('chunk_text', '')[:100]

    print(f"Sample embedding:")
    print(f"  - Document ID: {embedding_data['document_id']}")
    print(f"  - Chunk index: {embedding_data['chunk_index']}")
    print(f"  - Chunk text preview: {chunk_text}...")

    if embedding is None:
        print(f"\n[ERROR] Embedding is NULL in database!")
        return

    # Check embedding type and dimension
    print(f"\n  - Embedding type: {type(embedding)}")

    if isinstance(embedding, list):
        print(f"  - Embedding dimension: {len(embedding)}")
        if len(embedding) > 0:
            print(f"  - First 5 values: {embedding[:5]}")
            print(f"  - Value types: {type(embedding[0])}")
    elif isinstance(embedding, str):
        print(f"  - Embedding is stored as STRING, length: {len(embedding)}")
        print(f"  - First 100 chars: {embedding[:100]}")
        # Try to parse if it looks like array
        if embedding.startswith('['):
            try:
                import json
                parsed = json.loads(embedding)
                print(f"  - Parsed dimension: {len(parsed)}")
            except:
                print("  - Could not parse as JSON")
    else:
        print(f"  - Unexpected type: {embedding}")

    # Try the RPC function directly
    print("\n\nTesting RPC function directly...")

    # Create a test embedding
    from app.services.embedding import EmbeddingService
    embedding_service = EmbeddingService()

    test_embedding = await embedding_service.create_embedding("bathroom remodel")
    print(f"Test embedding dimension: {len(test_embedding)}")
    print(f"Test embedding type: {type(test_embedding)}")

    # Get org_id from the sample
    doc = admin.table("documents").select("organization_id").eq(
        "id", embedding_data['document_id']
    ).execute()

    if doc.data:
        org_id = doc.data[0]['organization_id']
        print(f"\nCalling RPC with org_id: {org_id}")

        try:
            result = admin.rpc(
                "match_document_embeddings",
                {
                    "query_embedding": test_embedding,
                    "match_org_id": org_id,
                    "match_count": 5,
                }
            ).execute()

            print(f"RPC result count: {len(result.data) if result.data else 0}")
            if result.data:
                for r in result.data[:3]:
                    print(f"  - Similarity: {r.get('similarity', 'N/A')}")
                    print(f"    Text: {r.get('chunk_text', '')[:80]}...")
            else:
                print("[WARNING] RPC returned no results")

                # Let's check if embeddings column has the right type
                print("\n\nChecking embeddings column type...")
                check_query = """
                SELECT column_name, data_type, udt_name
                FROM information_schema.columns
                WHERE table_name = 'document_embeddings'
                AND column_name = 'embedding';
                """
                # Can't run raw SQL easily, but let's check if embeddings are retrievable

        except Exception as e:
            print(f"[ERROR] RPC failed: {e}")


if __name__ == "__main__":
    asyncio.run(check_embeddings())
