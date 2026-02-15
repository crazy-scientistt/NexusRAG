"""
Lightweight Document Loader for Cloud RAG
Supports: PDF (text extraction only), DOCX, HTML, TXT
Note: Image files and OCR have been removed for better reliability
"""
from typing import List, Dict, Any
from pathlib import Path
from langchain_text_splitters import RecursiveCharacterTextSplitter
import logging

logging.basicConfig(level=logging.INFO)


class DocumentLoader:
    """Load and chunk documents - text extraction only."""

    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
        )

    def load_text(self, file_path: str) -> List[Dict[str, Any]]:
        """Load plain text files"""
        with open(file_path, "r", encoding="utf-8", errors='ignore') as f:
            text = f.read()

        chunks = self.text_splitter.split_text(text)

        return [
            {
                "content": chunk,
                "metadata": {
                    "source": Path(file_path).name,
                    "chunk_index": i,
                    "type": "text",
                },
            }
            for i, chunk in enumerate(chunks)
        ]

    def load_pdf(self, file_path: str) -> List[Dict[str, Any]]:
        """Load PDF with text extraction only (no OCR fallback)"""
        try:
            import pypdf

            text = ""
            
            # Extract text from PDF
            with open(file_path, "rb") as f:
                pdf_reader = pypdf.PdfReader(f)
                for page_num, page in enumerate(pdf_reader.pages):
                    page_text = page.extract_text() or ""
                    if page_text.strip():
                        text += f"\n--- Page {page_num + 1} ---\n{page_text}"

            # If no text was extracted, return error
            if not text.strip():
                logging.warning(f"No extractable text found in PDF: {file_path}")
                return [
                    {
                        "content": "This PDF appears to be a scanned image or has no selectable text. Please upload a PDF with extractable text.",
                        "metadata": {
                            "source": Path(file_path).name,
                            "chunk_index": 0,
                            "type": "pdf",
                            "error": "no_text_content"
                        },
                    }
                ]

            chunks = self.text_splitter.split_text(text)

            return [
                {
                    "content": chunk,
                    "metadata": {
                        "source": Path(file_path).name,
                        "chunk_index": i,
                        "type": "pdf",
                    },
                }
                for i, chunk in enumerate(chunks)
            ]
        except ImportError:
            raise ImportError("pypdf not installed. Install with: pip install pypdf")

    def load_docx(self, file_path: str) -> List[Dict[str, Any]]:
        """Load Word documents"""
        try:
            from docx import Document

            doc = Document(file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])

            chunks = self.text_splitter.split_text(text)

            return [
                {
                    "content": chunk,
                    "metadata": {
                        "source": Path(file_path).name,
                        "chunk_index": i,
                        "type": "docx",
                    },
                }
                for i, chunk in enumerate(chunks)
            ]
        except ImportError:
            raise ImportError("python-docx not installed. Install with: pip install python-docx")

    def load_html(self, file_path: str) -> List[Dict[str, Any]]:
        """Load HTML files"""
        try:
            from bs4 import BeautifulSoup

            with open(file_path, "r", encoding="utf-8", errors='ignore') as f:
                html_content = f.read()

            soup = BeautifulSoup(html_content, "html.parser")
            text = soup.get_text(separator="\n", strip=True)

            chunks = self.text_splitter.split_text(text)

            return [
                {
                    "content": chunk,
                    "metadata": {
                        "source": Path(file_path).name,
                        "chunk_index": i,
                        "type": "html",
                    },
                }
                for i, chunk in enumerate(chunks)
            ]
        except ImportError:
            raise ImportError("beautifulsoup4 not installed. Install with: pip install beautifulsoup4")

    def load_document(self, file_path: str, doc_type: str = None) -> List[Dict[str, Any]]:
        """Universal document loader with auto-detection"""
        if doc_type is None:
            file_lower = file_path.lower()
            if file_lower.endswith(".pdf"):
                doc_type = "pdf"
            elif file_lower.endswith(".docx"):
                doc_type = "docx"
            elif file_lower.endswith(".html") or file_lower.endswith(".htm"):
                doc_type = "html"
            else:
                doc_type = "text"

        if doc_type == "pdf":
            return self.load_pdf(file_path)
        if doc_type == "docx":
            return self.load_docx(file_path)
        if doc_type == "html":
            return self.load_html(file_path)
        return self.load_text(file_path)


# Backward compatibility
AdvancedDocumentLoader = DocumentLoader
