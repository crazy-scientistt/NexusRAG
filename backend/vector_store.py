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
from typing import List, Dict, Any, Optional

import chromadb
from chromadb.config import Settings


class VectorStore:
    """ChromaDB vector store for document retrieval."""

    def __init__(
        self,
        collection_name: str,
        persist_directory: str,
        embedding_function,
    ):
        self.client = chromadb.PersistentClient(
            path=persist_directory, settings=Settings(anonymized_telemetry=False)
        )

        self.collection = self.client.get_or_create_collection(
            name=collection_name, metadata={"hnsw:space": "cosine"}
        )

        self.embedding_function = embedding_function

        print(f"✅ Vector store initialized: {collection_name}")
        print(f"   Documents: {self.collection.count()}")

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

        current_count = self.collection.count()
        ids = [
            (meta.get("doc_id") or "doc") + f"_{meta.get('chunk_index', current_count + i)}"
            for i, meta in enumerate(metadatas)
        ]

        self.collection.add(
            embeddings=list(embeddings), documents=list(texts), metadatas=list(metadatas), ids=ids
        )

        print(f"✅ Added {len(texts)} documents to vector store")

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
        self.client.delete_collection(self.collection.name)
        self.collection = self.client.get_or_create_collection(
            name=self.collection.name, metadata={"hnsw:space": "cosine"}
        )
        print("✅ Vector store cleared")

    def delete_by_doc_id(self, doc_id: str):
        self.collection.delete(where=self._normalize_where({"doc_id": doc_id}))
        print(f"✅ Removed vectors for doc_id={doc_id}")

    def delete_where(self, where: Dict[str, Any]):
        self.collection.delete(where=self._normalize_where(where))
        print(f"✅ Removed vectors matching {where}")

    def count(self) -> int:
        return self.collection.count()
