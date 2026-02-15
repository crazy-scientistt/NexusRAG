"""
HuggingFace Inference Providers - Embeddings Provider
Cloud-based text embeddings
"""
import requests
from typing import List


class HuggingFaceEmbeddings:
    """HuggingFace Inference Providers for text embeddings."""

    def __init__(self, model_name: str, api_token: str):
        self.model_name = model_name
        self.api_url = f"https://router.huggingface.co/models/{model_name}"
        self.api_token = api_token

        self.embedding_dim = self._get_embedding_dimension(model_name)

        self.headers = {"Authorization": f"Bearer {self.api_token}"}

        print(f"✅ Embeddings initialized: {model_name}")
        print(f"📐 Embedding dimension: {self.embedding_dim}")

    def _get_embedding_dimension(self, model_name: str) -> int:
        dimension_map = {
            "Alibaba-NLP/Qwen3-Embedding-0.6B": 512, 
            "sentence-transformers/all-MiniLM-L6-v2": 384,
            "BAAI/bge-small-en-v1.5": 384,
            "BAAI/bge-base-en-v1.5": 768,
            "BAAI/bge-large-en-v1.5": 1024,
            "sentence-transformers/all-mpnet-base-v2": 768,
        }
        return dimension_map.get(model_name, 768)

    def _zero_vector(self) -> List[float]:
        return [0.0] * self.embedding_dim

    def _normalize_vector(self, vec: List[float]) -> List[float]:
        if len(vec) < self.embedding_dim:
            vec = vec + [0.0] * (self.embedding_dim - len(vec))
        elif len(vec) > self.embedding_dim:
            vec = vec[: self.embedding_dim]
        return [float(x) for x in vec]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        embeddings = []
        for text in texts:
            embedding = self.embed_query(text)
            embeddings.append(embedding)
        return embeddings

    def embed_query(self, text: str) -> List[float]:
        try:
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json={"inputs": text},
                timeout=30,
            )

            if response.status_code == 200:
                result = response.json()

                if isinstance(result, list):
                    vector = result[0] if result and isinstance(result[0], list) else result
                    if isinstance(vector, list):
                        return self._normalize_vector(vector)

                return self._zero_vector()

            if response.status_code == 503:
                import time

                print("⏳ Model loading, waiting 20 seconds...")
                time.sleep(20)

                retry = requests.post(
                    self.api_url,
                    headers=self.headers,
                    json={"inputs": text},
                    timeout=30,
                )

                if retry.status_code == 200:
                    result = retry.json()
                    if isinstance(result, list):
                        vector = result[0] if result and isinstance(result[0], list) else result
                        if isinstance(vector, list):
                            return self._normalize_vector(vector)

                return self._zero_vector()

            raise Exception(f"API Error ({response.status_code}): {response.text}")

        except Exception as e:  # pylint: disable=broad-except
            print(f"❌ Embedding error: {str(e)}")
            return self._zero_vector()

    def __call__(self, text: str) -> List[float]:
        return self.embed_query(text)
