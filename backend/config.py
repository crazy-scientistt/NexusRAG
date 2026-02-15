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
from dataclasses import dataclass
from typing import List

@dataclass
class Config:
    """Cloud RAG system configuration."""
    
    # HuggingFace Token - REQUIRED
    HF_TOKEN: str = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_TOKEN") or ""
    
    # Model Selection
    LLM_MODEL: str = "Qwen/Qwen3-4B-Instruct-2507"
    EMBEDDING_MODEL: str = "Alibaba-NLP/Qwen3-Embedding-0.6B"
    
    # Generation Parameters
    MAX_TOKENS: int = 1536
    TEMPERATURE: float = 0.9
    
    # Vector Database
    VECTOR_DB_DIR: str = "./data/chroma"
    COLLECTION_NAME: str = "rag_knowledge"
    
    # Document Processing
    CHUNK_SIZE: int = 700 #1000 for bigger models
    CHUNK_OVERLAP: int = 150 # 200 

    # Frontend / Security
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "*")
    
    # File uploads
    MAX_FILE_MB: int = int(os.getenv("MAX_FILE_MB", "20"))
    TEMP_DOC_TTL_MIN: int = int(os.getenv("TEMP_DOC_TTL_MIN", "1440"))  # 24h
    
    # Persistence
    # Use SUPABASE_DB_URL for Supabase, DATABASE_URL for other PostgreSQL, or DB_PATH for SQLite
    DB_PATH: str = os.getenv("DB_PATH", "./data/rag.db")
    
    # RAG behavior
    DEFAULT_STRICT: bool = os.getenv("DEFAULT_STRICT", "false").lower() == "true"
    TOP_K_RESULTS: int = int(os.getenv("TOP_K_RESULTS", "4"))
    
    # Payments (disabled by default, kept for toggle)
    PAYMENT_ENABLED: bool = os.getenv("PAYMENT_ENABLED", "true").lower() == "true"
    
    # Firebase
    FIREBASE_CREDENTIALS: str = os.getenv("FIREBASE_CREDENTIALS", "")

def get_config() -> Config:
    """Get system configuration."""
    config = Config()
    
    if not config.HF_TOKEN:
        print("\n" + "="*70)
        print("⚠️  WARNING: No HuggingFace token found!")
        print("="*70)
        print("\n📋 To fix this:")
        print("1. Get token from: https://huggingface.co/settings/tokens")
        print("2. Create 'Fine-grained' token with 'Inference Providers' permission")
        print("3. Set environment variable:")
        print("   export HF_TOKEN='your_token_here'")
        print("="*70 + "\n")
    
    return config
