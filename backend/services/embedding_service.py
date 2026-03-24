from typing import List
import os

class EmbeddingService:
    def __init__(self):
        self.model = None
        # Check if we're in a memory-constrained environment
        self.use_local_model = not os.getenv("DISABLE_LOCAL_EMBEDDINGS")

    def _load_model(self):
        if self.model is None and self.use_local_model:
            try:
                from sentence_transformers import SentenceTransformer
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
            except Exception as e:
                print(f"Warning: Could not load local embedding model: {e}")
                self.use_local_model = False

    def generate_embeddings(self, texts: List[str], api_key: str = None) -> List[List[float]]:
        if not self.use_local_model or self.model is None:
            raise ValueError("Local embedding model not available. Please check server configuration.")

        embeddings = self.model.encode(texts, convert_to_tensor=False)
        return embeddings.tolist()

    def generate_embedding(self, text: str, api_key: str = None) -> List[float]:
        if not self.use_local_model or self.model is None:
            raise ValueError("Local embedding model not available. Please check server configuration.")

        embedding = self.model.encode([text], convert_to_tensor=False)
        return embedding[0].tolist()
