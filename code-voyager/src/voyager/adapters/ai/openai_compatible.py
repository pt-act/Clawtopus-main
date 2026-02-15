"""OpenAI-compatible AI provider.

This provider works with any API that implements the OpenAI chat completions format.
Supports: Azure OpenAI, LocalAI, Together AI, Anyscale, Fireworks AI, and more.
"""

from __future__ import annotations

import os

from voyager.adapters.base.ai_provider import AIProvider, AIRequest, AIResponse
from voyager.config import get_config
from voyager.logging import get_logger

_logger = get_logger("provider.openai_compatible")


class OpenAICompatibleProvider(AIProvider):
    """AI provider for OpenAI-compatible APIs.

    Works with any service that implements the OpenAI Chat Completions API:
    - Azure OpenAI
    - LocalAI
    - Together AI
    - Anyscale Endpoints
    - Fireworks AI
    - Perplexity AI
    - And many more...

    Configuration example:
        [ai.openai_compatible]
        base_url = "https://api.together.xyz/v1"
        model = "mistralai/Mixtral-8x7B-Instruct-v0.1"
        api_key_env = "TOGETHER_API_KEY"
    """

    def __init__(self, base_url: str | None = None, api_key: str | None = None):
        """Initialize the OpenAI-compatible provider.

        Args:
            base_url: Base URL for the API. If None, uses config.
            api_key: API key. If None, reads from environment.
        """
        self._base_url = base_url
        self._api_key = api_key

    def call(self, request: AIRequest) -> AIResponse:
        """Make a call to the OpenAI-compatible API.

        Args:
            request: The AI request.

        Returns:
            AIResponse with the result.
        """
        if not self.is_available():
            return AIResponse(
                success=False,
                error="OpenAI-compatible provider not available. Install 'openai' package and configure base_url.",
                metadata={"provider": "openai_compatible"},
            )

        try:
            from openai import OpenAI

            config = get_config()
            ai_config = config.get_ai_config("openai_compatible")

            # Get base URL
            base_url = self._base_url or ai_config.base_url
            if not base_url:
                return AIResponse(
                    success=False,
                    error="base_url not configured for openai_compatible provider",
                    metadata={"provider": "openai_compatible"},
                )

            # Get API key
            api_key = self._api_key
            if not api_key:
                api_key_env = ai_config.api_key_env or "OPENAI_API_KEY"
                api_key = os.environ.get(api_key_env)

            # Create client
            client = OpenAI(
                base_url=base_url,
                api_key=api_key or "not-needed",  # Some providers don't need keys
            )

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
                temperature=request.temperature or ai_config.extra.get("temperature", 0.7),
                max_tokens=ai_config.extra.get("max_tokens"),
            )

            output = response.choices[0].message.content or ""

            return AIResponse(
                success=True,
                output=output,
                files=[],
                metadata={
                    "provider": "openai_compatible",
                    "base_url": base_url,
                    "model": model,
                    "usage": {
                        "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                        "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                        "total_tokens": response.usage.total_tokens if response.usage else 0,
                    },
                },
            )

        except Exception as e:
            _logger.error("OpenAI-compatible API call failed: %s", e)
            return AIResponse(
                success=False,
                error=str(e),
                metadata={"provider": "openai_compatible"},
            )

    def is_available(self) -> bool:
        """Check if OpenAI-compatible provider is available.

        Returns:
            True if the openai package is installed.
        """
        try:
            import openai  # noqa: F401

            return True
        except ImportError:
            return False
