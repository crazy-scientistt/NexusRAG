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
Sentence-level evidence checking for a generated answer.

Chat assistants cite a whole answer, or footnote a passage, and leave the reader
to work out which specific claims those sources actually back. This module scores
every sentence of an answer separately against the retrieved chunks, so an answer
can be read as a set of individually-checked claims: which sentence rests on your
documents, which is the model talking, and which snippet supports it.

The score is lexical overlap, not semantic similarity: how much of a sentence's
content vocabulary appears in the chunk that best matches it. That is deliberate
and it is what the labels mean. It is cheap, needs no embedding API, and cannot
itself hallucinate -- but it does under-credit a correct sentence that paraphrases
the source, so `supported` is evidence of grounding while `unverified` is a prompt
to look, not proof of invention.
"""
import re
from typing import Any, Dict, List

# Words too common to count as evidence of anything.
STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "been", "but", "by", "can", "could",
    "did", "do", "does", "for", "from", "had", "has", "have", "he", "her", "his",
    "how", "i", "if", "in", "into", "is", "it", "its", "may", "might", "more",
    "most", "must", "no", "not", "of", "on", "or", "our", "out", "over", "own",
    "said", "she", "should", "so", "some", "such", "than", "that", "the", "their",
    "them", "then", "there", "these", "they", "this", "those", "to", "up", "was",
    "we", "were", "what", "when", "where", "which", "while", "who", "will", "with",
    "would", "you", "your", "it's", "also", "any", "each", "both", "about",
}

SUPPORTED_AT = 0.60
PARTIAL_AT = 0.30
MIN_CONTENT_WORDS = 3
SNIPPET_CHARS = 220

_SENTENCE_END = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9*#\-\"'(])")
_MARKDOWN_NOISE = re.compile(r"[*_`#>\[\]()]|^\s*[-+]\s+|^\s*\d+[.)]\s+")
_WORD = re.compile(r"[a-z0-9][a-z0-9'%$.,-]*")


def _content_words(text: str) -> set:
    """Lowercased meaningful words, with markdown and stopwords stripped."""
    cleaned = _MARKDOWN_NOISE.sub(" ", text.lower())
    words = set()
    for raw in _WORD.findall(cleaned):
        word = raw.strip(".,'-")
        if len(word) > 1 and word not in STOPWORDS:
            words.add(word)
    return words


def split_sentences(answer: str) -> List[str]:
    """Split an answer into renderable units, keeping markdown lines intact.

    Headers and list items are kept whole rather than glued to the next sentence,
    because they are what the reader sees as one claim.
    """
    units: List[str] = []
    for line in answer.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        # A header or bullet is a unit in its own right.
        if stripped.startswith("#") or re.match(r"^\s*([-+*]|\d+[.)])\s+", line):
            units.append(stripped)
            continue
        units.extend(part.strip() for part in _SENTENCE_END.split(stripped) if part.strip())
    return units


def _best_match(sentence_words: set, chunks: List[Dict[str, Any]]) -> tuple:
    """Return (score, chunk_index) for the chunk that covers the sentence best."""
    best_score = 0.0
    best_index = -1
    for index, chunk in enumerate(chunks):
        chunk_words = chunk.get("_words")
        if chunk_words is None:
            chunk_words = _content_words(chunk.get("content", ""))
            chunk["_words"] = chunk_words
        if not chunk_words:
            continue
        covered = len(sentence_words & chunk_words) / len(sentence_words)
        if covered > best_score:
            best_score = covered
            best_index = index
    return best_score, best_index


def _snippet_for(sentence_words: set, content: str) -> str:
    """The part of the chunk that overlaps the sentence most, for the reader to check."""
    candidates = [s for s in split_sentences(content) if s]
    if not candidates:
        return content[:SNIPPET_CHARS]
    best, best_score = candidates[0], -1.0
    for candidate in candidates:
        words = _content_words(candidate)
        if not words:
            continue
        score = len(sentence_words & words) / len(sentence_words) if sentence_words else 0.0
        if score > best_score:
            best, best_score = candidate, score
    return best[:SNIPPET_CHARS]


def verify_answer(answer: str, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Score each sentence of `answer` against the retrieved `chunks`.

    Returns the per-sentence verdicts plus a summary, shaped for direct rendering.
    """
    sentences = split_sentences(answer or "")
    if not sentences:
        return {"sentences": [], "summary": {"supported": 0, "partial": 0,
                                             "unverified": 0, "skipped": 0,
                                             "grounded_ratio": 0.0}}

    working = [dict(c) for c in (chunks or [])]
    results: List[Dict[str, Any]] = []
    counts = {"supported": 0, "partial": 0, "unverified": 0, "skipped": 0}

    for sentence in sentences:
        words = _content_words(sentence)
        # Too short to judge: headers, "In summary:", list scaffolding.
        if len(words) < MIN_CONTENT_WORDS or not working:
            counts["skipped"] += 1
            results.append({
                "text": sentence,
                "verdict": "skipped",
                "score": None,
                "source_index": None,
                "source_name": None,
                "snippet": None,
            })
            continue

        score, index = _best_match(words, working)
        if score >= SUPPORTED_AT:
            verdict = "supported"
        elif score >= PARTIAL_AT:
            verdict = "partial"
        else:
            verdict = "unverified"
        counts[verdict] += 1

        chunk = working[index] if index >= 0 else None
        results.append({
            "text": sentence,
            "verdict": verdict,
            "score": round(score, 3),
            "source_index": index if index >= 0 else None,
            "source_name": (chunk.get("metadata", {}) or {}).get("source") if chunk else None,
            "snippet": _snippet_for(words, chunk.get("content", "")) if chunk else None,
        })

    judged = counts["supported"] + counts["partial"] + counts["unverified"]
    grounded = (counts["supported"] + 0.5 * counts["partial"]) / judged if judged else 0.0
    return {
        "sentences": results,
        "summary": {**counts, "grounded_ratio": round(grounded, 3)},
    }
