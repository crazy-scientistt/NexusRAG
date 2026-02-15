"""
HuggingFace Inference Providers - LLM Provider
Cloud-based language model inference
"""
import os
import requests
from typing import Optional

class HuggingFaceLLM:
    """HuggingFace Inference Providers for language model inference."""
    
    def __init__(
        self,
        model_name: str,
        api_token: str,
        max_tokens: int = 512,
        temperature: float = 0.7
    ):
        """
        Initialize HuggingFace Inference Providers LLM.
        
        Args:
            model_name: Model with optional provider suffix (e.g., "model:fastest")
            api_token: HuggingFace API token
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
        """
        self.model_name = model_name
        self.api_url = "https://router.huggingface.co/v1/chat/completions"
        self.api_token = api_token
        self.max_tokens = max_tokens
        self.temperature = temperature
        
        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        
        print(f"✅ LLM initialized: {model_name}")
        print(f"🌐 Using HuggingFace Inference Providers")
    
    def generate(self, prompt: str) -> str:
        """
        Generate response from prompt.
        
        Args:
            prompt: Input text prompt
            
        Returns:
            Generated text response
        """
        try:
            payload = {
                "model": self.model_name,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": self.max_tokens,
                "temperature": self.temperature,
                "stream": False
            }
            
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                
                if "choices" in result and len(result["choices"]) > 0:
                    content = result["choices"][0].get("message", {}).get("content", "")
                    if content:
                        return content.strip()
                    else:
                        return f"❌ No content in response"
                else:
                    return f"❌ Unexpected response format"
            
            elif response.status_code == 401:
                return (f"❌ Authentication Error: Invalid HuggingFace token.\n"
                       f"Get a token from: https://huggingface.co/settings/tokens\n"
                       f"Ensure it has 'Make calls to Inference Providers' permission.")
            
            elif response.status_code == 404:
                return (f"❌ Model Not Found: '{self.model_name}' not available.\n"
                       f"Check available models at:\n"
                       f"https://huggingface.co/models?inference_provider=all")
            
            elif response.status_code == 429:
                return (f"⏳ Rate Limit Exceeded. Wait a moment and try again.\n"
                       f"Consider upgrading to HuggingFace Pro for higher limits.")
            
            elif response.status_code == 503:
                return "⏳ Model is loading. Please try again in 20 seconds."
            
            else:
                try:
                    error_detail = response.json()
                    error_msg = error_detail.get("error", response.text)
                except Exception:  # pylint: disable=broad-except
                    error_msg = response.text
                
                return f"❌ API Error ({response.status_code}): {error_msg}"
        
        except requests.exceptions.Timeout:
            return "❌ Request timeout. Model took too long to respond."
        
        except requests.exceptions.ConnectionError:
            return "❌ Connection error. Check your internet connection."
        
        except Exception as e:
            return f"❌ Error: {str(e)}"
    
    def get_info(self) -> dict:
        """Get model information."""
        return {
            "type": "HuggingFace Inference Providers",
            "model": self.model_name,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "endpoint": "router.huggingface.co/v1"
        }
