#!/usr/bin/env python3
"""
Diagnostic script for RAG document processing pipeline.

Run from backend directory:
    python scripts/diagnose_rag.py

Or with a specific org_id:
    python scripts/diagnose_rag.py --org-id <your-org-id>
"""

import asyncio
import argparse
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.supabase import get_supabase_admin
from app.services.embedding import EmbeddingService
from app.config import get_settings


def print_section(title: str):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)


async def diagnose_documents(org_id: str = None):
    """Run diagnostic checks on document processing pipeline."""
    admin = get_supabase_admin()
    settings = get_settings()

    print_section("RAG Pipeline Diagnostics")

    # Check configuration
    print_section("1. Configuration Check")
    print(f"OpenRouter API Key: {'SET' if settings.openrouter_api_key else 'NOT SET'}")
    print(f"Embedding Model: {settings.openrouter_embedding_model}")
    print(f"Default Chat Model: {settings.openrouter_default_model}")

    if not settings.openrouter_api_key:
        print("\n[ERROR] OpenRouter API key is not set!")
        print("       Documents cannot be embedded without this key.")
        print("       Set OPENROUTER_API_KEY in your .env file.")

    # Get all organizations if no org_id specified
    if not org_id:
        orgs = admin.table("organizations").select("id, name").limit(5).execute()
        if not orgs.data:
            print("\n[ERROR] No organizations found in database.")
            return

        print_section("Available Organizations")
        for org in orgs.data:
            print(f"  - {org['name']} (id: {org['id']})")

        if len(orgs.data) == 1:
            org_id = orgs.data[0]['id']
            print(f"\nUsing organization: {orgs.data[0]['name']}")
        else:
            print("\nRun with --org-id <id> to check a specific organization.")
            return

    # Check documents by status
    print_section("2. Document Status Check")
    status_query = admin.table("documents").select("status").eq("organization_id", org_id).execute()

    if not status_query.data:
        print(f"[WARNING] No documents found for org {org_id}")
        print("          Upload some documents first!")
        return

    status_counts = {}
    for doc in status_query.data:
        status = doc['status']
        status_counts[status] = status_counts.get(status, 0) + 1

    total = sum(status_counts.values())
    print(f"Total documents: {total}")
    for status, count in sorted(status_counts.items()):
        print(f"  - {status}: {count}")

    # Check for errors
    if status_counts.get('error', 0) > 0:
        print("\n[WARNING] Some documents have errors!")
        error_docs = admin.table("documents").select("id, name, extracted_data").eq(
            "organization_id", org_id
        ).eq("status", "error").execute()

        for doc in error_docs.data[:5]:
            print(f"  - {doc['name']}: {doc.get('extracted_data', {}).get('error', 'Unknown error')}")

    # Check for pending documents
    if status_counts.get('pending', 0) > 0:
        print("\n[WARNING] Some documents are still pending!")
        print("          Background processing may not be running correctly.")

    # Check embeddings
    print_section("3. Embedding Check")

    # Get documents with embedding counts
    docs_query = admin.table("documents").select("id, name, status, extracted_data").eq(
        "organization_id", org_id
    ).execute()

    docs_without_embeddings = []
    docs_with_embeddings = []

    for doc in docs_query.data:
        embedding_count = admin.table("document_embeddings").select(
            "id", count="exact"
        ).eq("document_id", doc['id']).execute()

        count = embedding_count.count or 0
        doc_info = {
            'name': doc['name'],
            'status': doc['status'],
            'embeddings': count,
            'text_length': doc.get('extracted_data', {}).get('text_length', 0)
        }

        if count == 0:
            docs_without_embeddings.append(doc_info)
        else:
            docs_with_embeddings.append(doc_info)

    print(f"Documents WITH embeddings: {len(docs_with_embeddings)}")
    for doc in docs_with_embeddings[:5]:
        print(f"  - {doc['name']}: {doc['embeddings']} chunks, {doc['text_length']} chars extracted")

    if len(docs_with_embeddings) > 5:
        print(f"  ... and {len(docs_with_embeddings) - 5} more")

    print(f"\nDocuments WITHOUT embeddings: {len(docs_without_embeddings)}")
    for doc in docs_without_embeddings[:5]:
        status = doc['status']
        reason = ""
        if status == 'error':
            reason = " (processing error)"
        elif status == 'pending':
            reason = " (not processed yet)"
        elif status == 'processed' and doc['text_length'] == 0:
            reason = " (no text extracted)"
        print(f"  - {doc['name']}{reason}")

    if len(docs_without_embeddings) > 5:
        print(f"  ... and {len(docs_without_embeddings) - 5} more")

    # Test embedding creation
    print_section("4. Embedding API Test")

    if not settings.openrouter_api_key:
        print("[SKIP] Cannot test - OpenRouter API key not set")
    else:
        try:
            embedding_service = EmbeddingService()
            test_text = "kitchen remodel addition cost estimate"
            print(f"Testing embedding for: '{test_text}'")

            embedding = await embedding_service.create_embedding(test_text)
            print(f"[OK] Successfully created embedding (dimension: {len(embedding)})")

            # Test similarity search
            if docs_with_embeddings:
                print("\nTesting similarity search...")
                # First test the RPC directly
                print("\n  Testing RPC directly...")
                rpc_result = admin.rpc(
                    "match_document_embeddings",
                    {
                        "query_embedding": embedding,
                        "match_org_id": org_id,
                        "match_count": 5,
                    }
                ).execute()
                print(f"  RPC returned {len(rpc_result.data) if rpc_result.data else 0} results")
                if rpc_result.data:
                    for r in rpc_result.data[:2]:
                        print(f"    - Score: {r.get('similarity', 0):.3f}")

                # Now test through the service method
                results = await embedding_service.search_similar(
                    org_id,
                    test_text,
                    limit=5,
                    min_similarity=0.0  # Get all results regardless of score
                )

                if results:
                    print(f"[OK] Found {len(results)} matches:")
                    for r in results[:3]:
                        score = r.get('similarity', 0)
                        text_preview = r.get('chunk_text', '')[:80]
                        print(f"  - Score: {score:.3f} | {text_preview}...")

                    # Check if any would pass the default threshold
                    above_threshold = [r for r in results if r.get('similarity', 0) >= 0.5]
                    print(f"\nResults above 0.5 threshold: {len(above_threshold)}")
                    if len(above_threshold) == 0 and len(results) > 0:
                        print("[WARNING] No results pass the 0.5 similarity threshold!")
                        print("          This is why the AI isn't seeing your documents.")
                        print("          Recommendation: Lower threshold to 0.3")
                else:
                    print("[WARNING] No matches found in similarity search")
            else:
                print("[SKIP] No embeddings to search")

        except Exception as e:
            print(f"[ERROR] Embedding test failed: {e}")

    # Summary
    print_section("5. Summary & Recommendations")

    issues = []

    if not settings.openrouter_api_key:
        issues.append("- Set OPENROUTER_API_KEY in .env file")

    if status_counts.get('error', 0) > 0:
        issues.append("- Check and fix document processing errors")

    if status_counts.get('pending', 0) > 0:
        issues.append("- Verify background task processing is working")

    if len(docs_without_embeddings) > 0 and len(docs_with_embeddings) == 0:
        issues.append("- No documents have embeddings - RAG cannot work")

    if len(docs_with_embeddings) > 0:
        print("[OK] Documents have been embedded and should be searchable")
        print("     If AI still isn't using them, the similarity threshold may be too high.")

    if issues:
        print("\nIssues found:")
        for issue in issues:
            print(issue)
    else:
        print("\nNo major issues found. If RAG still isn't working:")
        print("  1. Check server logs for retrieval errors")
        print("  2. Try lowering similarity threshold from 0.5 to 0.3")
        print("  3. Verify your query text matches document content")


def main():
    parser = argparse.ArgumentParser(description='Diagnose RAG document processing pipeline')
    parser.add_argument('--org-id', type=str, help='Organization ID to check')
    args = parser.parse_args()

    asyncio.run(diagnose_documents(args.org_id))


if __name__ == "__main__":
    main()
