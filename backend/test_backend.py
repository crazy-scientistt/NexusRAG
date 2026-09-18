"""
Verification script for NexusRAG Backend.
Tests OpenRouter provider, resilient embeddings, RAG initialization, and API routes.
"""
import os
import sys

def test_config():
    print("Testing config...")
    from config import get_config
    cfg = get_config()
    assert hasattr(cfg, "OPENROUTER_API_KEY"), "Missing OPENROUTER_API_KEY in Config"
    assert hasattr(cfg, "OPENROUTER_MODEL"), "Missing OPENROUTER_MODEL in Config"
    assert hasattr(cfg, "DEV_MODE"), "Missing DEV_MODE in Config"
    print(f"[OK] Config OK. Default model: {cfg.OPENROUTER_MODEL}")

def test_openrouter_provider():
    print("Testing OpenRouter provider...")
    from openrouter_provider import OpenRouterLLM, CURATED_MODELS
    assert len(CURATED_MODELS) >= 5, "Expected at least 5 curated models"
    client = OpenRouterLLM(api_key="mock-key-for-test", default_model="google/gemini-2.0-flash-001")
    info = client.get_info()
    assert info["type"] == "OpenRouter"
    assert info["default_model"] == "google/gemini-2.0-flash-001"
    print("[OK] OpenRouter provider metadata OK")

def test_embeddings():
    print("Testing embeddings engine...")
    from embeddings_provider import create_embeddings
    embedder = create_embeddings(api_token="")
    q = "What is retrieval augmented generation?"
    vec = embedder.embed_query(q)
    assert len(vec) == 384, f"Expected 384 dimensions, got {len(vec)}"
    # Check normalization
    norm = sum(x*x for x in vec)
    assert abs(norm - 1.0) < 1e-3, f"Expected unit norm, got {norm}"
    print("[OK] Resilient embeddings OK (normalized 384d)")

def test_fastapi_routes():
    print("Testing FastAPI app routes...")
    from app import app
    routes = [r.path for r in app.routes]
    assert "/models" in routes, "Missing /models route"
    assert "/sessions" in routes, "Missing /sessions route"
    assert "/upload" in routes, "Missing /upload route"
    print(f"[OK] FastAPI routes verified ({len(routes)} total routes registered)")

if __name__ == "__main__":
    test_config()
    test_openrouter_provider()
    test_embeddings()
    test_fastapi_routes()
    print("\n[SUCCESS] ALL BACKEND CHECKS PASSED!")
