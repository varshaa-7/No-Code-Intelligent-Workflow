from typing import List

class EmbeddingService:
    def __init__(self):
        self.model = None

    def _load_model(self):
        if self.model is None:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer('all-MiniLM-L6-v2')

    def generate_embeddings(self, texts: List[str], api_key: str = None) -> List[List[float]]:
        self._load_model()
        embeddings = self.model.encode(texts, convert_to_tensor=False)
        return embeddings.tolist()

    def generate_embedding(self, text: str, api_key: str = None) -> List[float]:
        self._load_model()
        embedding = self.model.encode([text], convert_to_tensor=False)
        return embedding[0].tolist()
