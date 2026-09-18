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
OpenRouter LLM Provider for NexusRAG.
Provides unified access to Google Gemini, Anthropic Claude, Meta Llama, DeepSeek, and OpenAI models.
"""
import os
import time
import requests
from typing import Optional, Dict, List, Any

from free_models import get_models

# Curated list of high-efficiency models available on OpenRouter
CURATED_MODELS = [
    {
        "id": "google/gemini-2.0-flash-001",
        "name": "Gemini 2.0 Flash",
        "provider": "Google",
        "context_length": 1048576,
        "description": "Next-gen multimodal speed & reasoning champion. Highly cost-effective.",
        "badge": "Recommended / Ultra Fast",
        "is_default": True,
    },
    {
        "id": "anthropic/claude-3.5-sonnet",
        "name": "Claude 3.5 Sonnet",
        "provider": "Anthropic",
        "context_length": 200000,
        "description": "SOTA reasoning, deep analysis, and nuanced document synthesis.",
        "badge": "Highest Quality",
        "is_default": False,
    },
    {
        "id": "meta-llama/llama-3.3-70b-instruct",
        "name": "Llama 3.3 70B Instruct",
        "provider": "Meta",
        "context_length": 131072,
        "description": "Leading open-weight powerhouse with industry-grade instruction following.",
        "badge": "Open Weights",
        "is_default": False,
    },
    {
        "id": "deepseek/deepseek-chat",
        "name": "DeepSeek V3",
        "provider": "DeepSeek",
        "context_length": 64000,
        "description": "Exceptional logic, coding, and document analysis at competitive efficiency.",
        "badge": "High Efficiency",
        "is_default": False,
    },
    {
        "id": "openai/gpt-4o-mini",
        "name": "GPT-4o Mini",
        "provider": "OpenAI",
        "context_length": 128000,
        "description": "Balanced, fast, and reliable reasoning for enterprise workflows.",
        "badge": "Fast Enterprise",
        "is_default": False,
    },
    {
        "id": "mistralai/mistral-small-24b-instruct-2501",
        "name": "Mistral Small 24B",
        "provider": "Mistral",
        "context_length": 32768,
        "description": "Punchy, concise, and multilingual European foundation model.",
        "badge": "Multilingual",
        "is_default": False,
    },
]


class OpenRouterLLM:
    """OpenRouter API client for flexible, unified LLM inference."""

    def __init__(
        self,
        api_key: str,
        default_model: str = "google/gemini-2.0-flash-001",
        max_tokens: int = 2048,
        temperature: float = 0.4,
        site_url: str = "https://nexusrag.ai",
        site_name: str = "NexusRAG Studio",
    ):
        self.api_key = api_key
        self.default_model = default_model
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"

        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": site_url,
            "X-Title": site_name,
            "Content-Type": "application/json",
        }

        print(f"[OK] OpenRouter LLM initialized. Default Model: {self.default_model}")

    def generate(
        self,
        prompt: str,
        model_name: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        system_prompt: Optional[str] = None,
    ) -> str:
        """
        Generate response from prompt using OpenRouter.
        
        Args:
            prompt: User or synthesized RAG prompt
            model_name: Optional override for model
            temperature: Optional override for temperature
            max_tokens: Optional override for max tokens
            system_prompt: Optional system instruction
        """
        active_model = model_name or self.default_model
        active_temp = temperature if temperature is not None else self.temperature
        # Hard token ceiling to prevent token exhaustion / wallet draining attacks
        HARD_TOKEN_CAP = 1500
        active_max = min(max_tokens if max_tokens is not None else self.max_tokens, HARD_TOKEN_CAP)

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": active_model,
            "messages": messages,
            "temperature": active_temp,
            "max_tokens": active_max,
        }

        try:
            start_t = time.monotonic()
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=60,
            )
            elapsed_ms = int((time.monotonic() - start_t) * 1000)

            if response.status_code == 200:
                result = response.json()
                choices = result.get("choices", [])
                if choices:
                    content = choices[0].get("message", {}).get("content", "")
                    return content.strip() if content else "⚠️ Empty response returned by model."
                return "⚠️ Unexpected response format from OpenRouter."

            elif response.status_code == 401:
                return (
                    "❌ OpenRouter Authentication Error: Invalid API key.\n"
                    "Please check your OPENROUTER_API_KEY environment variable."
                )

            elif response.status_code == 402:
                return (
                    "❌ OpenRouter Insufficient Credits: Your OpenRouter account requires credits.\n"
                    "Please visit https://openrouter.ai/credits to top up."
                )

            elif response.status_code == 429:
                return (
                    "⏳ OpenRouter Rate Limit: Too many requests. Please wait a few seconds and retry."
                )

            elif response.status_code == 503:
                return f"⏳ Model '{active_model}' is currently overloaded. Please try again or switch models."

            else:
                try:
                    err_json = response.json()
                    err_msg = err_json.get("error", {}).get("message", response.text)
                except Exception:
                    err_msg = response.text
                if self.api_key and self.api_key in err_msg:
                    err_msg = err_msg.replace(self.api_key, "[REDACTED]")
                return f"❌ OpenRouter API Error ({response.status_code}): {err_msg}"

        except requests.exceptions.Timeout:
            return f"❌ OpenRouter request timed out for model '{active_model}'."
        except requests.exceptions.ConnectionError:
            return "❌ OpenRouter connection error. Check your internet connection."
        except Exception as exc:
            msg = str(exc)
            if self.api_key and self.api_key in msg:
                msg = msg.replace(self.api_key, "[REDACTED]")
            return f"❌ Error invoking OpenRouter: {msg}"

    def get_info(self) -> Dict[str, Any]:
        """Return provider metadata."""
        return {
            "type": "OpenRouter",
            "default_model": self.default_model,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "endpoint": "https://openrouter.ai/api/v1",
            "available_models": get_models(),
        }
