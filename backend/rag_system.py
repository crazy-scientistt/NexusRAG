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
Cloud-Only RAG System with HuggingFace Inference Providers.
Adds user/session-aware retrieval, confidence scoring, and strict/hybrid modes.
"""
import re
import time
from pathlib import Path
from typing import Dict, Optional

from config import get_config
from document_loader import DocumentLoader
from embeddings_provider import HuggingFaceEmbeddings
from llm_provider import HuggingFaceLLM
from vector_store import VectorStore


class CloudRAG:
    """RAG system using HuggingFace Inference Providers."""

    def __init__(self):
        print("\n" + "=" * 70)
        print("🌐 CLOUD RAG SYSTEM - HuggingFace Inference Providers")
        print("=" * 70 + "\n")

        self.config = get_config()

        if not self.config.HF_TOKEN:
            raise ValueError(
                "HuggingFace token is required! See config.py for setup instructions."
            )

        print("Initializing components...\n")

        self.llm = HuggingFaceLLM(
            model_name=self.config.LLM_MODEL,
            api_token=self.config.HF_TOKEN,
            max_tokens=self.config.MAX_TOKENS,
            temperature=self.config.TEMPERATURE,
        )

        self.embeddings = HuggingFaceEmbeddings(
            model_name=self.config.EMBEDDING_MODEL, api_token=self.config.HF_TOKEN
        )

        self.vector_store = VectorStore(
            collection_name=self.config.COLLECTION_NAME,
            persist_directory=self.config.VECTOR_DB_DIR,
            embedding_function=self.embeddings,
        )

        self.document_loader = DocumentLoader(
            chunk_size=self.config.CHUNK_SIZE, chunk_overlap=self.config.CHUNK_OVERLAP
        )

        print("\n" + "=" * 70)
        print("✅ System initialized successfully!")
        print(f"📦 LLM: {self.config.LLM_MODEL}")
        print(f"🧭 Embeddings: {self.config.EMBEDDING_MODEL}")
        print(f"💾 Documents: {self.vector_store.count()}")
        print("=" * 70 + "\n")

    def add_document(
        self,
        file_path: str,
        doc_id: str,
        user_id: str,
        session_id: Optional[str],
        doc_type: str = None,
    ):
        """
        Add a document to the knowledge base.

        Args:
            file_path: Path to the document
            doc_id: Stable document id for metadata linking
            user_id: Firebase user id
            session_id: Session scope
            doc_type: Optional explicit type override
        """
        print(f"\n📄 Loading document: {file_path}")

        chunks = self.document_loader.load_document(file_path, doc_type)
        print(f"🧩 Created {len(chunks)} chunks")

        texts = [chunk["content"] for chunk in chunks]
        metadatas = []
        for chunk in chunks:
            meta = dict(chunk["metadata"])
            meta.update({"doc_id": doc_id, "user_id": user_id, "session_id": session_id})
            metadatas.append(meta)

        self.vector_store.add_documents(texts, metadatas)
        print("✅ Document added successfully\n")

    @staticmethod
    def _confidence_from_distance(distance: Optional[float]) -> Dict:
        if distance is None:
            return {"score": 0.4, "label": "low"}
        score = max(0.0, 1.0 - min(distance, 1.0))
        if score > 0.75:
            label = "high"
        elif score > 0.45:
            label = "medium"
        else:
            label = "low"
        return {"score": round(score, 3), "label": label}

    @staticmethod
    def _strip_citations(text: str) -> str:
        """Remove source/chunk markers to prevent leaking internal metadata."""
        if not text:
            return text

        cleaned = text
        patterns = [
            r"\[?\s*source(?:\s+number)?\s*\d+\]?:?",
            r"\(source\s*\d+\)",
            r"\(chunk\s*\d+\)",
            r"\bchunk\s*\d+\b",
        ]
        for pattern in patterns:
            cleaned = re.sub(pattern, "", cleaned, flags=re.IGNORECASE)

        cleaned = re.sub(
            r"^\s*Sources?:.*$", "", cleaned, flags=re.IGNORECASE | re.MULTILINE
        )
        cleaned = re.sub(r"\s{2,}", " ", cleaned)
        return cleaned.strip()

    def query(
        self,
        question: str,
        user_id: str,
        session_id: Optional[str],
        mode: str = "hybrid",
        explain_simpler: bool = False,
    ) -> dict:
        """
        Query the RAG system.

        Args:
            question: User question
            user_id: Firebase uid
            session_id: Chat session scope
            mode: "strict" uses docs only; "hybrid" can fall back to model
            explain_simpler: If true, simplifies the language

        Returns:
            Dictionary with response, sources, confidence, and timing
        """
        print(f"\n❓ Question: {question}\n")

        where = {"user_id": user_id}
        if session_id:
            where["session_id"] = session_id

        retrieve_start = time.monotonic()
        print("🔍 Searching knowledge base...")
        relevant_docs = self.vector_store.search(
            query=question, top_k=self.config.TOP_K_RESULTS, where=where
        )
        retrieve_ms = int((time.monotonic() - retrieve_start) * 1000)

        if not relevant_docs and mode == "strict":
            print("⚠️ No docs found in strict mode")
            return {
                "question": question,
                "response": "I couldn't find support for that in your documents.",
                "sources": [],
                "num_sources": 0,
                "supported_by_documents": False,
                "confidence": {"score": 0.0, "label": "low"},
                "mode": mode,
                "retrieval_ms": retrieve_ms,
                "generation_ms": 0,
            }

        if not relevant_docs:
            print("⚠️ No relevant documents found, falling back to model (hybrid)")
            gen_start = time.monotonic()
            response = self.llm.generate(question)
            cleaned_response = self._strip_citations(response)
            gen_ms = int((time.monotonic() - gen_start) * 1000)
            return {
                "question": question,
                "response": cleaned_response,
                "sources": [],
                "num_sources": 0,
                "supported_by_documents": False,
                "confidence": {"score": 0.3, "label": "low"},
                "mode": mode,
                "retrieval_ms": retrieve_ms,
                "generation_ms": gen_ms,
            }

        print(f"📚 Found {len(relevant_docs)} relevant chunks\n")
        # Keep the retrieval context free of explicit source labels to avoid leaking
        # internal metadata or encouraging the model to cite chunk ids.
        context = "\n\n---\n\n".join([doc["content"] for doc in relevant_docs])

        extra_instruction = (
            "\nExplain the answer in clear, simple language a teenager can follow."
            if explain_simpler
            else ""
        )
        prompt = f"""You are a concise, professional assistant. Use the context to answer the question directly.
- If the context doesn't fully support the answer, say so.
- Do not mention or invent source numbers, chunk ids, file names, or any metadata.
- Avoid brackets, citations, or labels in the final answer.
{extra_instruction}

Context:
{context}

Question: {question}

Answer:"""

        gen_start = time.monotonic()
        response = self.llm.generate(prompt)
        cleaned_response = self._strip_citations(response)
        gen_ms = int((time.monotonic() - gen_start) * 1000)

        sources = []
        best_distance = None
        for i, doc in enumerate(relevant_docs):
            if best_distance is None:
                best_distance = doc.get("distance")
            else:
                try:
                    best_distance = min(best_distance, doc.get("distance"))
                except Exception:
                    pass
            meta = doc.get("metadata", {})
            raw_source = meta.get("source") or "Document"
            source_name = Path(raw_source).name
            sources.append(
                {
                    "source": source_name,
                    "chunk": i,
                    "id": meta.get("doc_id"),
                }
            )

        confidence = self._confidence_from_distance(best_distance)
        supported = confidence["score"] >= 0.35

        return {
            "question": question,
            "response": cleaned_response,
            "sources": sources,
            "num_sources": len(sources),
            "supported_by_documents": supported,
            "confidence": confidence,
            "mode": mode,
            "retrieval_ms": retrieve_ms,
            "generation_ms": gen_ms,
        }

    def clear_user_data(self, user_id: str):
        """Delete all vectors for a user."""
        self.vector_store.delete_where({"user_id": user_id})

    def clear_session_data(self, user_id: str, session_id: str):
        """Delete all vectors tied to a session."""
        self.vector_store.delete_where({"user_id": user_id, "session_id": session_id})

    def get_stats(self) -> dict:
        """Get system statistics."""
        return {
            "model": self.config.LLM_MODEL,
            "embedding_model": self.config.EMBEDDING_MODEL,
            "documents": self.vector_store.count(),
            "chunk_size": self.config.CHUNK_SIZE,
            "top_k": self.config.TOP_K_RESULTS,
        }


def main():
    try:
        rag = CloudRAG()
        print("Ready to use! See example usage in the code.\n")
    except Exception as exc:  # pylint: disable=broad-except
        print(f"\n❌ Error: {exc}\n")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    main()
