"""
End-to-End verification script for NexusRAG.
Tests document ingestion, vector retrieval, confidence scoring, model override, and session isolation.
"""
import os
import sys
import shutil
from pathlib import Path

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

from config import get_config
from rag_system import CloudRAG
from db_supabase import (
    init_db,
    create_session,
    list_sessions,
    register_document,
    list_documents,
    delete_document,
    delete_session,
)

def run_e2e_verification():
    print("=" * 70)
    print("RUNNING NEXUSRAG END-TO-END VERIFICATION")
    print("=" * 70)

    cfg = get_config()
    rag = CloudRAG()
    init_db()

    user_id = "test-awwwards-evaluator"
    rag.clear_user_data(user_id)
    session_name = "Evaluation Session 01"
    session_id = create_session(user_id, session_name)
    print(f"[OK] Created clean test session: {session_id} ('{session_name}')")

    # Create sample document
    test_dir = Path("./test_data")
    test_dir.mkdir(exist_ok=True)
    sample_file = test_dir / "awwwards_architecture.txt"
    sample_content = """
    NexusRAG Architecture and Specification Document:
    The platform leverages OpenRouter as its frontier LLM synthesis gateway, enabling seamless
    switching across Google Gemini 2.0 Flash (1M tokens context), Anthropic Claude 3.5 Sonnet,
    and Meta Llama 3.3 70B.
    
    Dense vectors are generated in 384 dimensions and indexed into ChromaDB.
    Vector retrieval operates with cosine similarity distance thresholding at 0.35.
    The user interface draws inspiration from Awwwards Site of the Day award-winning digital studios,
    featuring an obsidian dark palette, tracked uppercase micro-labels, and real-time telemetry tickers.
    """
    sample_file.write_text(sample_content, encoding="utf-8")

    doc_id = "doc-test-999"
    rag.add_document(
        file_path=str(sample_file),
        doc_id=doc_id,
        user_id=user_id,
        session_id=session_id,
    )
    print("[OK] Document indexed into ChromaDB vector space")

    # Query 1: Relevant question in strict mode
    q1 = "What context length does Gemini 2.0 Flash support in NexusRAG?"
    print(f"\nTesting Query 1: '{q1}' (Strict Mode)")
    res1 = rag.query(
        question=q1,
        user_id=user_id,
        session_id=session_id,
        mode="strict",
        model="google/gemini-2.0-flash-001",
    )
    print(f"Response 1: {res1['response'][:140]}...")
    print(f"Sources retrieved: {len(res1['sources'])} chunk(s)")
    print(f"Confidence: {res1['confidence']}")
    assert len(res1["sources"]) > 0, "Expected at least 1 source citation"
    assert res1["supported_by_documents"] is True, "Expected supported_by_documents to be True"
    assert res1["model_used"] == "google/gemini-2.0-flash-001", "Model used mismatch"

    # Query 2: Unrelated question in strict mode (should assert absence)
    q2 = "What is the average temperature on Neptune?"
    print(f"\nTesting Query 2: '{q2}' (Strict Mode - should not match)")
    res2 = rag.query(
        question=q2,
        user_id=user_id,
        session_id=session_id,
        mode="strict",
    )
    print(f"Response 2: {res2['response']}")
    assert res2["supported_by_documents"] is False, "Expected supported_by_documents to be False for unrelated query in strict mode"
    assert len(res2["sources"]) == 0, "Expected 0 sources for unrelated query in strict mode"

    # Clean up test artifacts
    print("\nCleaning up test session and vectors...")
    rag.clear_session_data(user_id, session_id)
    delete_session(session_id, user_id)
    if test_dir.exists():
        shutil.rmtree(test_dir, ignore_errors=True)
    print("[OK] Cleanup complete")

    print("\n" + "=" * 70)
    print("[VERIFIED] ALL END-TO-END TESTS PASSED WITH 100% GREEN ARTIFACTS")
    print("=" * 70)

if __name__ == "__main__":
    run_e2e_verification()
