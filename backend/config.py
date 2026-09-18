# Copyright 2026 Abdulrehman Qureshi
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
Configuration for HuggingFace Inference Providers RAG System
"""
import os
from pathlib import Path
from dataclasses import dataclass
from typing import List

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / ".env")
    load_dotenv(Path(__file__).parent.parent / ".env")
except Exception:
    pass

@dataclass
class Config:
    """NexusRAG Cloud & Studio RAG system configuration."""
    
    # OpenRouter Configuration (Primary)
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")
    
    # HuggingFace Token (Optional / Fallback)
    HF_TOKEN: str = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_TOKEN") or ""
    
    # Model Selection & Fallback
    LLM_MODEL: str = os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "Alibaba-NLP/Qwen3-Embedding-0.6B")
    
    # Generation Parameters
    MAX_TOKENS: int = int(os.getenv("MAX_TOKENS", "2048"))
    TEMPERATURE: float = float(os.getenv("TEMPERATURE", "0.4"))
    
    # Vector Database
    is_serverless = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))
    VECTOR_DB_DIR: str = os.getenv("VECTOR_DB_DIR", "/tmp/chroma" if is_serverless else "./data/chroma")
    COLLECTION_NAME: str = os.getenv("COLLECTION_NAME", "rag_knowledge")
    
    # Document Processing
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "750"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "150"))

    # Frontend / Security
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "*")
    
    # File uploads
    MAX_FILE_MB: int = int(os.getenv("MAX_FILE_MB", "25"))
    TEMP_DOC_TTL_MIN: int = int(os.getenv("TEMP_DOC_TTL_MIN", "1440"))  # 24h
    
    # Persistence & Supabase
    DB_PATH: str = os.getenv("DB_PATH", "/tmp/rag.db" if is_serverless else "./data/rag.db")
    NEXT_PUBLIC_SUPABASE_URL: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL", "")
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: str = (
        os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
        or os.getenv("SUPABASE_KEY", "")
    )
    SUPABASE_DB_URL: str = os.getenv("SUPABASE_DB_URL", "")
    SUPABASE_PASSWORD: str = os.getenv("SUPABASE_PASSWORD", "")
    
    # RAG behavior
    DEFAULT_STRICT: bool = os.getenv("DEFAULT_STRICT", "false").lower() == "true"
    TOP_K_RESULTS: int = int(os.getenv("TOP_K_RESULTS", "4"))
    
    # Payments
    PAYMENT_ENABLED: bool = os.getenv("PAYMENT_ENABLED", "false").lower() == "true"
    
    # Access mode. NexusRAG has no login: every caller is the Studio Guest.
    DEV_MODE: bool = os.getenv("DEV_MODE", "true").lower() == "true"

def get_config() -> Config:
    """Get system configuration."""
    config = Config()
    
    if not config.OPENROUTER_API_KEY and not config.HF_TOKEN:
        print("\n" + "="*70)
        print("[INFO] NOTE: Neither OPENROUTER_API_KEY nor HF_TOKEN is set!")
        print("="*70)
        print("To enable AI responses:")
        print("1. Set OPENROUTER_API_KEY='your_openrouter_key'")
        print("2. Optionally choose model: OPENROUTER_MODEL='google/gemini-2.0-flash-001'")
        print("="*70 + "\n")
    elif config.OPENROUTER_API_KEY:
        print(f"[OK] OpenRouter active with model: {config.OPENROUTER_MODEL}")
    
    return config
