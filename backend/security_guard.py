# Copyright 2026 NexusRAG
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
Security Guard & Abuse Prevention for NexusRAG.
Provides sliding-window IP rate limiting, model whitelisting,
strict query length capping, upload validation, and anti-abuse safeguards.
"""
import time
from collections import defaultdict, deque
from typing import Dict, Deque, Optional
from fastapi import Request, HTTPException, UploadFile
from free_models import get_allowed_model_ids

# 1. Model whitelisting: only the free models currently offered by OpenRouter.
# Resolved per call rather than at import so a refreshed catalog takes effect
# without a redeploy.

# 2. Token & Input Size Constraints
MAX_QUESTION_LENGTH = 1500  # Max chars per query (prevents token stuffing)
MAX_SESSION_DOCUMENTS = 15  # Max uploaded docs per session (prevents storage bloat)
MAX_FILE_BYTES = 25 * 1024 * 1024  # 25MB

# Strict file type whitelist (explicitly excludes .html, .js, executables, scripts)
ALLOWED_UPLOAD_EXTENSIONS = {
    ".pdf",
    ".txt",
    ".docx",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".bmp",
    ".heic",
}

# 3. Rate Limit Configuration
CHAT_PER_MINUTE = 10
CHAT_PER_HOUR = 60
CHAT_MIN_INTERVAL_SECONDS = 1.5

UPLOAD_PER_MINUTE = 5
UPLOAD_PER_HOUR = 20


class RateLimiter:
    """In-memory sliding-window rate limiter per client IP."""

    def __init__(self):
        self.chat_timestamps: Dict[str, Deque[float]] = defaultdict(deque)
        self.last_chat_time: Dict[str, float] = {}
        self.upload_timestamps: Dict[str, Deque[float]] = defaultdict(deque)

    def _cleanup_old(self, timestamps: Deque[float], window_seconds: float, now: float):
        cutoff = now - window_seconds
        while timestamps and timestamps[0] < cutoff:
            timestamps.popleft()

    def check_chat(self, client_ip: str):
        now = time.monotonic()

        # Cooldown between queries (prevents automated burst flood)
        last_t = self.last_chat_time.get(client_ip, 0.0)
        if (now - last_t) < CHAT_MIN_INTERVAL_SECONDS:
            retry_in = round(CHAT_MIN_INTERVAL_SECONDS - (now - last_t), 1)
            raise HTTPException(
                status_code=429,
                detail=f"Too many rapid requests. Please pause {max(1, int(retry_in))}s before sending another query.",
                headers={"Retry-After": str(max(1, int(retry_in)))},
            )

        q = self.chat_timestamps[client_ip]
        self._cleanup_old(q, 3600, now)

        # Check minute window
        one_min_ago = now - 60
        recent_count = sum(1 for t in q if t >= one_min_ago)
        if recent_count >= CHAT_PER_MINUTE:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit reached ({CHAT_PER_MINUTE} queries/min). Please wait a moment before sending more queries.",
                headers={"Retry-After": "30"},
            )

        # Check hour window
        if len(q) >= CHAT_PER_HOUR:
            raise HTTPException(
                status_code=429,
                detail=f"Hourly quota reached ({CHAT_PER_HOUR} queries/hour). Please wait before submitting more queries.",
                headers={"Retry-After": "300"},
            )

        q.append(now)
        self.last_chat_time[client_ip] = now

    def check_upload(self, client_ip: str):
        now = time.monotonic()
        q = self.upload_timestamps[client_ip]
        self._cleanup_old(q, 3600, now)

        one_min_ago = now - 60
        recent_count = sum(1 for t in q if t >= one_min_ago)
        if recent_count >= UPLOAD_PER_MINUTE:
            raise HTTPException(
                status_code=429,
                detail=f"Upload rate limit reached ({UPLOAD_PER_MINUTE} uploads/min). Please wait before uploading more files.",
                headers={"Retry-After": "60"},
            )

        if len(q) >= UPLOAD_PER_HOUR:
            raise HTTPException(
                status_code=429,
                detail=f"Hourly upload limit reached ({UPLOAD_PER_HOUR} files/hour).",
                headers={"Retry-After": "300"},
            )

        q.append(now)


rate_limiter = RateLimiter()


def get_client_ip(request: Request) -> str:
    """Safely extract client IP from headers (behind Vercel / Cloudflare proxy) or connection."""
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    x_real_ip = request.headers.get("x-real-ip")
    if x_real_ip:
        return x_real_ip.strip()
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


def validate_question(question: str) -> str:
    """Validate, sanitize, and limit user query length to prevent token injection/abuse."""
    if not question or not question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    cleaned = question.strip()
    if len(cleaned) > MAX_QUESTION_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Query exceeds the maximum allowed limit of {MAX_QUESTION_LENGTH} characters (received {len(cleaned)}). Please shorten your question.",
        )
    return cleaned


def validate_model(model: Optional[str], default_model: str) -> str:
    """Enforce strict model whitelist to prevent unauthorized high-cost model execution."""
    if not model:
        return default_model

    allowed_ids = get_allowed_model_ids()
    if model not in allowed_ids:
        allowed = ", ".join(sorted(allowed_ids))
        raise HTTPException(
            status_code=400,
            detail=f"Model '{model}' is not permitted. Permitted models are: {allowed}.",
        )
    return model


def validate_upload_file(file: UploadFile):
    """Enforce strict file type and extension whitelist."""
    filename = file.filename or "upload"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_UPLOAD_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_UPLOAD_EXTENSIONS))
        raise HTTPException(
            status_code=400,
            detail=f"File extension '{ext}' is not permitted. Permitted formats: {allowed}.",
        )