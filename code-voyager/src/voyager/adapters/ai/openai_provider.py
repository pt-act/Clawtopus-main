"""OpenAI AI provider.

This provider integrates with OpenAI's API (GPT-4, GPT-3.5, etc.)
as an alternative to Claude.
"""

from __future__ import annotations

import os
from pathlib import Path

from voyager.adapters.base.ai_provider import AIProvider, AIRequest, AIResponse
from voyager.config import get_config
from voyager.logging import get_logger

_logger = get_logger("provider.openai")


class OpenAIProvider(AIProvider):
    """AI provider for OpenAI (GPT-4, etc.).

    This provider uses the OpenAI API to make AI calls.
    Requires OPENAI_API_KEY environment variable to be set.
    """

    def __init__(self):
        """Initialize the OpenAI provider."""
        self._api_key = os.environ.get("OPENAI_API_KEY")

    def call(self, request: AIRequest) -> AIResponse:
        """Make a call to OpenAI.

        Args:
            request: The AI request.

        Returns:
            AIResponse with the result.
        """
        if not self.is_available():
            return AIResponse(
                success=False,
                error="OpenAI provider not available. Install 'openai' package and set OPENAI_API_KEY.",
                metadata={"provider": "openai"},
            )

        try:
            from openai import OpenAI

            client = OpenAI(api_key=self._api_key)
            config = get_config()
            ai_config = config.get_ai_config("openai")

            # Build messages
            messages = []
            if request.system_prompt:
                messages.append({"role": "system", "content": request.system_prompt})
            messages.append({"role": "user", "content": request.prompt})

            # Make the API call
            model = request.model or ai_config.model
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=request.temperature or 0.7,
            )

            output = response.choices[0].message.content or ""

            return AIResponse(
                success=True,
                output=output,
                files=[],  # OpenAI doesn't directly write files
                metadata={
                    "provider": "openai",
                    "model": model,
                    "usage": {
                        "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                        "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                        "total_tokens": response.usage.total_tokens if response.usage else 0,
                    },
                },
            )

        except Exception as e:
            _logger.error("OpenAI call failed: %s", e)
            return AIResponse(
                success=False,
                error=str(e),
                metadata={"provider": "openai"},
            )

    def is_available(self) -> bool:
        """Check if OpenAI provider is available.

        Returns:
            True if the openai package is installed and API key is set.
        """
        try:
            import openai  # noqa: F401

            return self._api_key is not None
        except ImportError:
            return False
