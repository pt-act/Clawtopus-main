"""Ollama AI provider for local LLMs.

This provider integrates with Ollama for running local language models
(Llama, Mistral, Code Llama, etc.).
"""

from __future__ import annotations

import httpx

from voyager.adapters.base.ai_provider import AIProvider, AIRequest, AIResponse
from voyager.config import get_config
from voyager.logging import get_logger

_logger = get_logger("provider.ollama")


class OllamaProvider(AIProvider):
    """AI provider for Ollama (local LLMs).

    This provider uses Ollama to run local language models.
    Requires Ollama to be running locally (default: http://localhost:11434).
    """

    def __init__(self, base_url: str | None = None):
        """Initialize the Ollama provider.

        Args:
            base_url: Base URL for Ollama API. If None, uses config.
        """
        self._base_url = base_url

    def call(self, request: AIRequest) -> AIResponse:
        """Make a call to Ollama.

        Args:
            request: The AI request.

        Returns:
            AIResponse with the result.
        """
        if not self.is_available():
            return AIResponse(
                success=False,
                error="Ollama provider not available. Is Ollama running?",
                metadata={"provider": "ollama"},
            )

        try:
            config = get_config()
            ai_config = config.get_ai_config("ollama")

            base_url = self._base_url or ai_config.base_url or "http://localhost:11434"
            model = request.model or ai_config.model

            # Build messages
            messages = []
            if request.system_prompt:
                messages.append({"role": "system", "content": request.system_prompt})
            messages.append({"role": "user", "content": request.prompt})

            # Make the API call
            with httpx.Client(timeout=request.timeout_seconds) as client:
                response = client.post(
                    f"{base_url}/api/chat",
                    json={
                        "model": model,
                        "messages": messages,
                        "stream": False,
                    },
                )
                response.raise_for_status()
                data = response.json()

            output = data.get("message", {}).get("content", "")

            return AIResponse(
                success=True,
                output=output,
                files=[],
                metadata={
                    "provider": "ollama",
                    "model": model,
                    "base_url": base_url,
                },
            )

        except httpx.HTTPError as e:
            _logger.error("Ollama HTTP error: %s", e)
            return AIResponse(
                success=False,
                error=f"HTTP error: {e}",
                metadata={"provider": "ollama"},
            )
        except Exception as e:
            _logger.error("Ollama call failed: %s", e)
            return AIResponse(
                success=False,
                error=str(e),
                metadata={"provider": "ollama"},
            )

    def is_available(self) -> bool:
        """Check if Ollama provider is available.

        Returns:
            True if Ollama is running and responding.
        """
        try:
            config = get_config()
            ai_config = config.get_ai_config("ollama")
            base_url = self._base_url or ai_config.base_url or "http://localhost:11434"

            with httpx.Client(timeout=2.0) as client:
                response = client.get(f"{base_url}/api/tags")
                return response.status_code == 200
        except Exception:
            return False
