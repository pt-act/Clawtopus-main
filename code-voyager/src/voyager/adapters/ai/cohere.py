"""Cohere AI provider.

Cohere provides powerful language models with strong performance on
command-following, retrieval-augmented generation, and more.
"""

from __future__ import annotations

import os

from voyager.adapters.base.ai_provider import AIProvider, AIRequest, AIResponse
from voyager.config import get_config
from voyager.logging import get_logger

_logger = get_logger("provider.cohere")


class CohereProvider(AIProvider):
    """AI provider for Cohere.

    Cohere offers powerful language models with features like:
    - Command models (optimized for instructions)
    - Chat models (conversational AI)
    - Retrieval-augmented generation
    - Embedding models

    Popular models:
    - command-r-plus: Best quality, largest context (128K)
    - command-r: Balanced quality and speed
    - command: Fast and efficient
    - command-light: Lightweight for simple tasks

    Configuration example:
        [ai.cohere]
        model = "command-r-plus"
        # API key from COHERE_API_KEY environment variable
    """

    def __init__(self, api_key: str | None = None):
        """Initialize the Cohere provider.

        Args:
            api_key: Cohere API key. If None, reads from COHERE_API_KEY.
        """
        self._api_key = api_key

    def call(self, request: AIRequest) -> AIResponse:
        """Make a call to Cohere.

        Args:
            request: The AI request.

        Returns:
            AIResponse with the result.
        """
        if not self.is_available():
            return AIResponse(
                success=False,
                error="Cohere provider not available. Install 'cohere' package and set COHERE_API_KEY.",
                metadata={"provider": "cohere"},
            )

        try:
            import cohere

            config = get_config()
            ai_config = config.get_ai_config("cohere")

            # Get API key
            api_key = self._api_key or os.environ.get("COHERE_API_KEY")
            if not api_key:
                return AIResponse(
                    success=False,
                    error="COHERE_API_KEY environment variable not set",
                    metadata={"provider": "cohere"},
                )

            # Create client
            client = cohere.Client(api_key)

            # Get model
            model = request.model or ai_config.model

            # Build message
            message = request.prompt

            # Build chat history if system prompt exists
            chat_history = []
            if request.system_prompt:
                chat_history.append({
                    "role": "SYSTEM",
                    "message": request.system_prompt
                })

            # Make the API call
            response = client.chat(
                model=model,
                message=message,
                chat_history=chat_history,
                temperature=request.temperature or ai_config.extra.get("temperature", 0.7),
                max_tokens=ai_config.extra.get("max_tokens"),
            )

            output = response.text

            # Extract usage information
            metadata = {
                "provider": "cohere",
                "model": model,
            }

            # Cohere provides token usage in the response
            if hasattr(response, 'meta') and response.meta:
                if hasattr(response.meta, 'billed_units'):
                    metadata["usage"] = {
                        "input_tokens": response.meta.billed_units.input_tokens,
                        "output_tokens": response.meta.billed_units.output_tokens,
                    }

            return AIResponse(
                success=True,
                output=output,
                files=[],
                metadata=metadata,
            )

        except Exception as e:
            _logger.error("Cohere call failed: %s", e)
            return AIResponse(
                success=False,
                error=str(e),
                metadata={"provider": "cohere"},
            )

    def is_available(self) -> bool:
        """Check if Cohere provider is available.

        Returns:
            True if the cohere package is installed and API key is set.
        """
        try:
            import cohere  # noqa: F401

            api_key = self._api_key or os.environ.get("COHERE_API_KEY")
            return api_key is not None
        except ImportError:
            return False
