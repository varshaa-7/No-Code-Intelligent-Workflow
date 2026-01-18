import chromadb
from typing import List, Dict, Any
from chromadb.config import Settings


class VectorStore:
    def __init__(self):
        self.client = chromadb.Client(Settings(
            anonymized_telemetry=False,
            allow_reset=True
        ))
        self.collections: Dict[str, Any] = {}

    def _get_collection(self, document_id: str):
        collection_name = f"doc_{document_id.replace('-', '_')}"

        if collection_name not in self.collections:
            try:
                self.collections[collection_name] = self.client.get_collection(collection_name)
            except:
                self.collections[collection_name] = self.client.create_collection(collection_name)

        return self.collections[collection_name]

    def add_documents(
        self,
        document_id: str,
        chunks: List[str],
        embeddings: List[List[float]]
    ):
        collection = self._get_collection(document_id)

        ids = [f"{document_id}_{i}" for i in range(len(chunks))]

        collection.add(
            embeddings=embeddings,
            documents=chunks,
            ids=ids
        )

    def search(
        self,
        document_id: str,
        query_embedding: List[float],
        top_k: int = 3
    ) -> List[str]:
        try:
            collection = self._get_collection(document_id)

            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k
            )

            if results and results['documents']:
                return results['documents'][0]

            return []
        except Exception as e:
            print(f"Error searching vector store: {e}")
            return []

    def delete_document(self, document_id: str):
        collection_name = f"doc_{document_id.replace('-', '_')}"

        try:
            self.client.delete_collection(collection_name)
            if collection_name in self.collections:
                del self.collections[collection_name]
        except Exception as e:
            print(f"Error deleting collection: {e}")
