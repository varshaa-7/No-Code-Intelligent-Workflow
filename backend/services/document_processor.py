import fitz
from typing import List
import io


class DocumentProcessor:
    def extract_text(self, content: bytes, filename: str) -> str:
        if filename.endswith('.pdf'):
            return self._extract_pdf_text(content)
        elif filename.endswith('.txt'):
            return content.decode('utf-8')
        else:
            try:
                return content.decode('utf-8')
            except UnicodeDecodeError:
                raise ValueError(f"Unsupported file format: {filename}")

    def _extract_pdf_text(self, content: bytes) -> str:
        pdf_stream = io.BytesIO(content)
        doc = fitz.open(stream=pdf_stream, filetype="pdf")

        text = ""
        for page in doc:
            text += page.get_text()

        doc.close()
        return text

    def chunk_text(
        self,
        text: str,
        chunk_size: int = 500,
        chunk_overlap: int = 50
    ) -> List[str]:
        chunks = []
        start = 0

        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]

            if chunk.strip():
                chunks.append(chunk)

            start = end - chunk_overlap

        return chunks
