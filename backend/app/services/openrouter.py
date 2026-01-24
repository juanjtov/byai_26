"""
OpenRouter service for multi-model LLM access.

Provides chat completion streaming through OpenRouter's API.
"""

import json
import httpx
from typing import AsyncGenerator, List, Dict, Optional

from app.config import get_settings


class OpenRouterService:
    """Service for interacting with OpenRouter API."""

    BASE_URL = "https://openrouter.ai/api/v1"

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.openrouter_api_key
        self.default_model = settings.openrouter_default_model

    async def chat_completion_stream(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> AsyncGenerator[str, None]:
        """
        Stream chat completion from OpenRouter.

        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model to use (defaults to configured model)
            system_prompt: Optional system prompt to prepend
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response

        Yields:
            Content chunks as they arrive
        """
        model = model or self.default_model

        # Prepend system prompt if provided
        if system_prompt:
            messages = [{"role": "system", "content": system_prompt}] + messages

        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                f"{self.BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "HTTP-Referer": "https://remodly.com",
                    "X-Title": "REMODLY AI Estimator",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "stream": True,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
                timeout=120.0,
            ) as response:
                if response.status_code != 200:
                    error_body = await response.aread()
                    raise Exception(f"OpenRouter error: {response.status_code} - {error_body}")

                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data)
                            content = chunk.get("choices", [{}])[0].get("delta", {}).get("content")
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str:
        """
        Non-streaming chat completion.

        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model to use (defaults to configured model)
            system_prompt: Optional system prompt to prepend
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response

        Returns:
            Complete response content
        """
        model = model or self.default_model

        if system_prompt:
            messages = [{"role": "system", "content": system_prompt}] + messages

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "HTTP-Referer": "https://remodly.com",
                    "X-Title": "REMODLY AI Estimator",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "stream": False,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
                timeout=120.0,
            )

            if response.status_code != 200:
                raise Exception(f"OpenRouter error: {response.status_code} - {response.text}")

            result = response.json()
            return result["choices"][0]["message"]["content"]
