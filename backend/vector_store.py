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
ChromaDB Vector Store
Stores and retrieves document embeddings
"""
import sys
try:
    __import__('pysqlite3')
    sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')
except ImportError:
    pass

from typing import List, Dict, Any, Optional
import math


def _l2_norm(vec) -> float:
    """Euclidean norm, pure-python (keeps numpy out of the serverless bundle)."""
    return math.sqrt(sum(float(x) * float(x) for x in vec))


def _cosine_similarity(a, b) -> float:
    """Cosine similarity between two equal-length vectors."""
    norm_a = _l2_norm(a)
    norm_b = _l2_norm(b)
    if norm_a <= 0 or norm_b <= 0:
        return 0.0
    dot = sum(float(x) * float(y) for x, y in zip(a, b))
    return dot / (norm_a * norm_b)

try:
    import chromadb
    from chromadb.config import Settings
    HAS_CHROMADB = True
except Exception as _chroma_err:
    print(f"[WARN] ChromaDB import error: {_chroma_err}")
    HAS_CHROMADB = False


class VectorStore:
    """ChromaDB vector store with in-memory fallback for serverless environments."""

    def __init__(
        self,
        collection_name: str,
        persist_directory: str,
        embedding_function,
    ):
        self.collection_name = collection_name
        self.embedding_function = embedding_function
        self.client = None
        self.collection = None
        self.is_fallback = False
        self._memory_docs: List[Dict[str, Any]] = []

        if HAS_CHROMADB:
            # Tier 1: PersistentClient
            try:
                self.client = chromadb.PersistentClient(
                    path=persist_directory, settings=Settings(anonymized_telemetry=False)
                )
                self.collection = self.client.get_or_create_collection(
                    name=collection_name, metadata={"hnsw:space": "cosine"}
                )
                print(f"[OK] ChromaDB PersistentClient ready: {collection_name}")
            except Exception as p_err:
                print(f"[WARN] Chroma PersistentClient failed ({p_err}). Trying EphemeralClient...")
                # Tier 2: EphemeralClient (in-memory Chroma)
                try:
                    self.client = chromadb.EphemeralClient(settings=Settings(anonymized_telemetry=False))
                    self.collection = self.client.get_or_create_collection(
                        name=collection_name, metadata={"hnsw:space": "cosine"}
                    )
                    print(f"[OK] ChromaDB EphemeralClient ready: {collection_name}")
                except Exception as e_err:
                    print(f"[WARN] Chroma EphemeralClient failed ({e_err}). Using In-Memory fallback.")
                    self.is_fallback = True
        else:
            self.is_fallback = True

        if self.is_fallback:
            print(f"[OK] Pure In-Memory Vector Store ready: {collection_name}")
        elif self.collection:
            print(f"[OK] Vector store initialized: {collection_name} (Documents: {self.collection.count()})")

    def add_documents(self, texts: List[str], metadatas: List[Dict[str, Any]]):
        if not texts:
            return

        embeddings = self.embedding_function.embed_documents(texts)
        if not embeddings:
            return

        filtered = [
            (text, meta, emb)
            for text, meta, emb in zip(texts, metadatas, embeddings)
            if emb
        ]
        if not filtered:
            return

        texts, metadatas, embeddings = zip(*filtered)

        if self.is_fallback or not self.collection:
            for text, meta, emb in zip(texts, metadatas, embeddings):
                self._memory_docs.append({
                    "id": (meta.get("doc_id") or "doc") + f"_{meta.get('chunk_index', len(self._memory_docs))}",
                    "content": text,
                    "metadata": meta,
                    "embedding": emb,
                })
            print(f"[OK] Added/Updated {len(texts)} documents in in-memory vector store")
            return

        current_count = self.collection.count()
        ids = [
            (meta.get("doc_id") or "doc") + f"_{meta.get('chunk_index', current_count + i)}"
            for i, meta in enumerate(metadatas)
        ]

        self.collection.upsert(
            embeddings=list(embeddings), documents=list(texts), metadatas=list(metadatas), ids=ids
        )

        print(f"[OK] Added/Updated {len(texts)} documents in vector store")

    @staticmethod
    def _normalize_where(where: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Chroma 0.4.22+ requires the `where` clause to contain exactly one
        operator (e.g. $and / $or). We want to allow simple dictionaries like
        {"user_id": "...", "session_id": "..."}; this helper rewrites them into
        a compliant structure.
        """
        if not where:
            return None

        # If caller already provided an operator-driven filter, keep it as-is.
        if any(key.startswith("$") for key in where):
            return where

        items = list(where.items())
        if len(items) == 1:
            key, value = items[0]
            # Preserve richer filters if caller already passed a dict
            return {key: value} if isinstance(value, dict) else {key: {"$eq": value}}

        return {
            "$and": [
                {key: val} if isinstance(val, dict) else {key: {"$eq": val}}
                for key, val in items
            ]
        }

    def search(
        self, query: str, top_k: int = 4, where: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        query_embedding = self.embedding_function.embed_query(query)
        if not query_embedding:
            return []

        if self.is_fallback or not self.collection:
            if not self._memory_docs:
                return []
            q_emb = [float(x) for x in query_embedding]
            scored = []
            for item in self._memory_docs:
                meta = item["metadata"]
                if where:
                    match = True
                    conds = where.get("$and", [where]) if "$and" in where else [where]
                    for c in conds:
                        for k, v in c.items():
                            target = v.get("$eq", v) if isinstance(v, dict) else v
                            if meta.get(k) != target:
                                match = False
                                break
                        if not match:
                            break
                    if not match:
                        continue
                sim = _cosine_similarity(q_emb, item["embedding"])
                scored.append((max(0.0, 1.0 - sim), item))
            scored.sort(key=lambda x: x[0])
            return [
                {"content": item["content"], "metadata": item["metadata"], "distance": dist}
                for dist, item in scored[:top_k]
            ]

        normalized_where = self._normalize_where(where)
        results = self.collection.query(
            query_embeddings=[query_embedding], n_results=top_k, where=normalized_where
        )

        documents = []
        if results["documents"] and len(results["documents"]) > 0:
            for i, doc in enumerate(results["documents"][0]):
                documents.append(
                    {
                        "content": doc,
                        "metadata": results["metadatas"][0][i]
                        if results["metadatas"]
                        else {},
                        "distance": results["distances"][0][i]
                        if results["distances"]
                        else 0.0,
                    }
                )

        return documents

    def clear(self):
        if self.is_fallback or not self.client:
            self._memory_docs = []
            print("[OK] In-memory vector store cleared")
            return
        self.client.delete_collection(self.collection.name)
        self.collection = self.client.get_or_create_collection(
            name=self.collection.name, metadata={"hnsw:space": "cosine"}
        )
        print("[OK] Vector store cleared")

    def delete_by_doc_id(self, doc_id: str):
        if self.is_fallback or not self.collection:
            self._memory_docs = [d for d in self._memory_docs if d["metadata"].get("doc_id") != doc_id]
            print(f"[OK] Removed in-memory vectors for doc_id={doc_id}")
            return
        self.collection.delete(where=self._normalize_where({"doc_id": doc_id}))
        print(f"[OK] Removed vectors for doc_id={doc_id}")

    def delete_where(self, where: Dict[str, Any]):
        if self.is_fallback or not self.collection:
            rem = []
            for d in self._memory_docs:
                meta = d["metadata"]
                match = all(meta.get(k) == v for k, v in where.items())
                if not match:
                    rem.append(d)
            self._memory_docs = rem
            print(f"[OK] Removed in-memory vectors matching {where}")
            return
        self.collection.delete(where=self._normalize_where(where))
        print(f"[OK] Removed vectors matching {where}")

    def count(self) -> int:
        if self.is_fallback or not self.collection:
            return len(self._memory_docs)
        return self.collection.count()
