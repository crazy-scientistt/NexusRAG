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
Unified LLM Provider: Supports OpenRouter (Primary) and HuggingFace Inference Providers.
"""
import os
import requests
from typing import Optional, Dict, Any
from openrouter_provider import OpenRouterLLM, CURATED_MODELS


class HuggingFaceLLM:
    """HuggingFace Inference Providers for language model inference."""

    def __init__(
        self,
        model_name: str,
        api_token: str,
        max_tokens: int = 1536,
        temperature: float = 0.7,
    ):
        self.model_name = model_name
        self.api_url = "https://router.huggingface.co/v1/chat/completions"
        self.api_token = api_token
        self.max_tokens = max_tokens
        self.temperature = temperature

        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }

        print(f"✅ HuggingFace LLM initialized: {model_name}")

    def generate(self, prompt: str, model_name: Optional[str] = None, **kwargs) -> str:
        active_model = model_name or self.model_name
        try:
            payload = {
                "model": active_model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": self.max_tokens,
                "temperature": self.temperature,
                "stream": False,
            }

            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=60,
            )

            if response.status_code == 200:
                result = response.json()
                if "choices" in result and len(result["choices"]) > 0:
                    content = result["choices"][0].get("message", {}).get("content", "")
                    return content.strip() if content else "❌ No content in response"
                return "❌ Unexpected response format"
            elif response.status_code == 401:
                return "❌ Authentication Error: Invalid HuggingFace token."
            elif response.status_code == 429:
                return "⏳ Rate Limit Exceeded on HuggingFace router."
            else:
                return f"❌ API Error ({response.status_code}): {response.text}"
        except Exception as e:
            return f"❌ Error: {str(e)}"

    def get_info(self) -> dict:
        return {
            "type": "HuggingFace",
            "model": self.model_name,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "available_models": [],
        }


class FallbackOfflineLLM:
    """Provides clear guidance when no API key is supplied."""

    def __init__(self, model_name: str = "offline-assistant"):
        self.model_name = model_name

    def generate(self, prompt: str, **kwargs) -> str:
        return (
            "⚙️ **NexusRAG Studio System Notice**:\n\n"
            "To enable live AI answers, please set your OpenRouter API key in the environment:\n"
            "```bash\n"
            "export OPENROUTER_API_KEY=\"sk-or-v1-...\"\n"
            "# Optional model selection:\n"
            "export OPENROUTER_MODEL=\"google/gemini-2.0-flash-001\"\n"
            "```\n\n"
            "Documents were successfully indexed and retrieved based on your query!"
        )

    def get_info(self) -> dict:
        return {
            "type": "OfflineFallback",
            "model": self.model_name,
            "available_models": CURATED_MODELS,
        }


def create_llm(
    openrouter_api_key: Optional[str] = None,
    hf_token: Optional[str] = None,
    model_name: Optional[str] = None,
    max_tokens: int = 2048,
    temperature: float = 0.4,
):
    """Factory to instantiate the appropriate LLM provider."""
    if openrouter_api_key:
        return OpenRouterLLM(
            api_key=openrouter_api_key,
            default_model=model_name or "google/gemini-2.0-flash-001",
            max_tokens=max_tokens,
            temperature=temperature,
        )
    elif hf_token:
        return HuggingFaceLLM(
            model_name=model_name or "Qwen/Qwen3-4B-Instruct-2507",
            api_token=hf_token,
            max_tokens=max_tokens,
            temperature=temperature,
        )
    else:
        return FallbackOfflineLLM(model_name=model_name or "NexusRAG-Offline")
