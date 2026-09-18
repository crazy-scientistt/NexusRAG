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
Live discovery of the free chat models on OpenRouter.

The model catalog used to be a hardcoded list, which rotted: two of its six ids
had been retired upstream and returned "No endpoints found", and the rest were
paid, so they failed on an account without credits. This module asks OpenRouter
what is actually free right now, keeps the good ones, and caches the answer.

Everything here degrades to FALLBACK_MODELS rather than raising, because the
catalog feeds both the picker and the request allowlist -- if discovery fails
the app must still be usable.
"""
import time
from typing import Any, Dict, List, Optional

import requests

MODELS_URL = "https://openrouter.ai/api/v1/models"
CACHE_TTL_SECONDS = 1800
FETCH_TIMEOUT_SECONDS = 6
MAX_MODELS = 12

# Free, but not actually callable from an ordinary app. OpenRouter answers these
# with 403 "only available on agentic harnesses", so they must never reach the
# picker. Matched as a prefix against the model id.
GATED_PREFIXES = (
    "thinkingmachines/inkling",
)

# Not chat models, whatever their pricing says.
NON_CHAT_MARKERS = (
    "lyria", "whisper", "tts", "embed", "-image", "image-", "rerank",
    "moderation", "content-safety", "guard",
)

# Families worth showing first, best known quality per token on the free tier.
PREFERRED_VENDORS = (
    "deepseek", "qwen", "google", "meta-llama", "nvidia",
    "mistralai", "openai", "anthropic", "cohere", "microsoft",
)

# Used when OpenRouter cannot be reached. Ids verified free at time of writing;
# the live fetch is what keeps the catalog current.
FALLBACK_MODELS: List[Dict[str, Any]] = [
    {
        "id": "google/gemma-4-31b-it:free",
        "name": "Gemma 4 31B",
        "provider": "Google",
        "context_length": 262144,
        "description": "Google DeepMind multimodal instruct model. Free tier.",
        "badge": "Recommended / Always Free",
        "is_default": True,
    },
    {
        "id": "openrouter/free",
        "name": "Free Models Router",
        "provider": "OpenRouter",
        "context_length": 200000,
        "description": "Routes to whichever free model is available. Output varies.",
        "badge": "Free",
        "is_default": False,
    },
    {
        "id": "qwen/qwen3.8-27b:free",
        "name": "Qwen3.8 27B",
        "provider": "Qwen",
        "context_length": 262144,
        "description": "Strong general reasoning and long-context synthesis. Free tier.",
        "badge": "Free",
        "is_default": False,
    },
]

_cache: Dict[str, Any] = {"at": 0.0, "models": None}


def _is_free(model: Dict[str, Any]) -> bool:
    pricing = model.get("pricing") or {}
    try:
        return (
            float(pricing.get("prompt", 1) or 0) == 0.0
            and float(pricing.get("completion", 1) or 0) == 0.0
        )
    except (TypeError, ValueError):
        return False


def _is_usable_chat_model(model: Dict[str, Any]) -> bool:
    model_id = (model.get("id") or "").lower()
    if not model_id or model_id.startswith(GATED_PREFIXES):
        return False
    if any(marker in model_id for marker in NON_CHAT_MARKERS):
        return False

    architecture = model.get("architecture") or {}
    inputs = architecture.get("input_modalities") or []
    outputs = architecture.get("output_modalities") or []
    # Must take text in and give text back; anything else is not a chat model.
    if outputs and "text" not in outputs:
        return False
    if inputs and "text" not in inputs:
        return False
    return True


def _rank(model: Dict[str, Any]) -> tuple:
    """Preferred vendors first, then the widest context window."""
    model_id = (model.get("id") or "").lower()
    if model_id == "openrouter/free":
        # Keep the router available but never let it lead. It picks a free model
        # per request and can land on a classifier: asked for three benefits of
        # RAG it once answered "User Safety: safe", which is a content-safety
        # model's output format. A named model is predictable.
        vendor_rank = len(PREFERRED_VENDORS) + 1
    else:
        vendor = model_id.split("/")[0]
        vendor_rank = (
            PREFERRED_VENDORS.index(vendor)
            if vendor in PREFERRED_VENDORS
            else len(PREFERRED_VENDORS)
        )
    return (vendor_rank, -(model.get("context_length") or 0))


def _shape(model: Dict[str, Any], is_default: bool) -> Dict[str, Any]:
    """Convert an OpenRouter record into the shape the frontend already renders."""
    model_id = model["id"]
    raw_name = model.get("name") or model_id
    # "Google: Gemma 4 31B (free)" -> "Gemma 4 31B"
    name = raw_name.split(":", 1)[-1].replace("(free)", "").strip() or model_id
    vendor = model_id.split("/")[0]
    description = (model.get("description") or "").strip().replace("\n", " ")
    if len(description) > 140:
        description = description[:137].rstrip() + "..."
    return {
        "id": model_id,
        "name": name,
        "provider": vendor.replace("-", " ").title(),
        "context_length": model.get("context_length") or 0,
        "description": description or "Free model available through OpenRouter.",
        "badge": "Recommended / Always Free" if is_default else "Free",
        "is_default": is_default,
    }


def fetch_free_models(timeout: int = FETCH_TIMEOUT_SECONDS) -> Optional[List[Dict[str, Any]]]:
    """Ask OpenRouter for its catalog and return the usable free chat models."""
    try:
        response = requests.get(MODELS_URL, timeout=timeout)
        response.raise_for_status()
        catalog = response.json().get("data") or []
    except Exception as exc:
        print(f"[WARN] Could not fetch OpenRouter models: {exc}")
        return None

    free = [m for m in catalog if _is_free(m) and _is_usable_chat_model(m)]
    if not free:
        print("[WARN] OpenRouter returned no usable free models.")
        return None

    free.sort(key=_rank)
    return [_shape(m, is_default=(i == 0)) for i, m in enumerate(free[:MAX_MODELS])]


def get_models(force_refresh: bool = False) -> List[Dict[str, Any]]:
    """Free models, cached per process. Never raises; falls back to FALLBACK_MODELS."""
    now = time.time()
    if (
        not force_refresh
        and _cache["models"]
        and (now - _cache["at"]) < CACHE_TTL_SECONDS
    ):
        return _cache["models"]

    models = fetch_free_models()
    if models:
        _cache["models"] = models
        _cache["at"] = now
        return models

    # Keep serving a stale catalog over none at all.
    return _cache["models"] or FALLBACK_MODELS


def get_allowed_model_ids() -> set:
    """Ids a request is permitted to name."""
    return {m["id"] for m in get_models()}


def resolve_default_model(configured: Optional[str]) -> str:
    """Pick the model to use when a request does not name one.

    Honours OPENROUTER_MODEL when it is actually usable, and otherwise falls back
    to the best free model instead of failing every request. That matters because
    a configured id can be retired upstream or gated to agentic harnesses.
    """
    models = get_models()
    if configured and any(m["id"] == configured for m in models):
        return configured
    if configured:
        print(
            f"[WARN] OPENROUTER_MODEL '{configured}' is not an available free model; "
            f"using '{models[0]['id']}' instead."
        )
    return models[0]["id"]
