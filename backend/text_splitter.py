# Copyright 2026 Abdulrehman Qureshi & NexusRAG Contributors
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
Self-contained recursive text splitter.

Replaces langchain-text-splitters, which pulls in langchain-core and langsmith
(orjson, zstandard, httpx) and pushed the Vercel serverless bundle past the
function size limit. Behaviour matches the langchain splitter closely enough
for retrieval: split on the largest natural boundary that fits, then pack the
pieces up to chunk_size with a trailing overlap carried into the next chunk.
"""
from typing import Callable, List, Optional


class RecursiveCharacterTextSplitter:
    """Split text on the largest natural boundary that still fits chunk_size."""

    DEFAULT_SEPARATORS = ["\n\n", "\n", ". ", " ", ""]

    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        length_function: Callable[[str], int] = len,
        separators: Optional[List[str]] = None,
    ):
        self.chunk_size = max(1, chunk_size)
        # An overlap >= chunk_size would never advance through the text.
        self.chunk_overlap = max(0, min(chunk_overlap, self.chunk_size - 1))
        self.length_function = length_function
        self.separators = separators or list(self.DEFAULT_SEPARATORS)

    def split_text(self, text: str) -> List[str]:
        if not text:
            return []
        pieces = [p for p in self._split(text, self.separators) if p.strip()]
        return self._merge(pieces)

    def _split(self, text: str, separators: List[str]) -> List[str]:
        """Recursively break text down until every piece fits chunk_size."""
        if self.length_function(text) <= self.chunk_size:
            return [text]

        for index, separator in enumerate(separators):
            if separator == "":
                # Last resort: a single unbroken token longer than the chunk.
                return [
                    text[i:i + self.chunk_size]
                    for i in range(0, len(text), self.chunk_size)
                ]
            if separator not in text:
                continue

            parts = text.split(separator)
            last = len(parts) - 1
            out: List[str] = []
            for position, part in enumerate(parts):
                # Re-attach the separator so no content is silently dropped.
                piece = part if position == last else part + separator
                if not piece:
                    continue
                if self.length_function(piece) <= self.chunk_size:
                    out.append(piece)
                else:
                    out.extend(self._split(piece, separators[index + 1:]))
            return out

        # No separator matched; fall back to a hard slice.
        return [
            text[i:i + self.chunk_size]
            for i in range(0, len(text), self.chunk_size)
        ]

    def _merge(self, pieces: List[str]) -> List[str]:
        """Pack pieces up to chunk_size, carrying chunk_overlap between chunks."""
        chunks: List[str] = []
        current = ""
        for piece in pieces:
            if current and self.length_function(current + piece) > self.chunk_size:
                chunks.append(current)
                carry = current[-self.chunk_overlap:] if self.chunk_overlap else ""
                current = carry + piece
            else:
                current += piece
        if current.strip():
            chunks.append(current)
        return chunks
