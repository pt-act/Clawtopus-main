"""OpenRouter AI provider.

OpenRouter provides unified access to multiple AI providers (OpenAI, Anthropic, Google, Meta, etc.)
through a single API. Great for accessing the latest models without managing multiple API keys.
"""

from __future__ import annotations

import os

from voyager.adapters.base.ai_provider import AIProvider, AIRequest, AIResponse
from voyager.config import get_config
from voyager.logging import get_logger

_logger = get_logger("provider.openrouter")


class OpenRouterProvider(AIProvider):
    """AI provider for OpenRouter (https://openrouter.ai/).

    OpenRouter provides access to multiple AI providers through a single API:
    - OpenAI (GPT-4, GPT-3.5)
    - Anthropic (Claude)
    - Google (PaLM, Gemini)
    - Meta (Llama)
    - Mistral AI
    - And many more...

    Benefits:
    - Single API key for all providers
    - Automatic fallbacks
    - Cost tracking
    - Rate limit management

    Configuration example:
        [ai.openrouter]
        model = "anthropic/claude-3.5-sonnet"
        # or "openai/gpt-4"
        # or "google/gemini-pro"
        # or "meta-llama/llama-3.1-70b-instruct"
    """

    def __init__(self, api_key: str | None = None, site_url: str | None = None, app_name: str | None = None):
        """Initialize the OpenRouter provider.

        Args:
            api_key: OpenRouter API key. If None, reads from OPENROUTER_API_KEY.
            site_url: Your site URL (optional, for rankings).
            app_name: Your app name (optional, for rankings).
        """
        self._api_key = api_key
        self._site_url = site_url
        self._app_name = app_name

    def call(self, request: AIRequest) -> AIResponse:
        """Make a call to OpenRouter.

        Args:
            request: The AI request.

        Returns:
            AIResponse with the result.
        """
        if not self.is_available():
            return AIResponse(
                success=False,
                error="OpenRouter provider not available. Install 'httpx' package and set OPENROUTER_API_KEY.",
                metadata={"provider": "openrouter"},
            )

        try:
            import httpx

            config = get_config()
            ai_config = config.get_ai_config("openrouter")

            # Get API key
            api_key = self._api_key or os.environ.get("OPENROUTER_API_KEY")
            if not api_key:
                return AIResponse(
                    success=False,
                    error="OPENROUTER_API_KEY environment variable not set",
                    metadata={"provider": "openrouter"},
                )

            # Build headers
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }

            # Optional: Add site URL and app name for OpenRouter rankings
            site_url = self._site_url or ai_config.extra.get("site_url")
            app_name = self._app_name or ai_config.extra.get("app_name", "code-voyager")
            if site_url:
                headers["HTTP-Referer"] = site_url
            if app_name:
                headers["X-Title"] = app_name

            # Build messages
            messages = []
            if request.system_prompt:
                messages.append({"role": "system", "content": request.system_prompt})
            messages.append({"role": "user", "content": request.prompt})

            # Prepare request body
            model = request.model or ai_config.model
            body = {
                "model": model,
                "messages": messages,
            }

            # Optional parameters
            if request.temperature is not None:
                body["temperature"] = request.temperature
            elif "temperature" in ai_config.extra:
                body["temperature"] = ai_config.extra["temperature"]

            if "max_tokens" in ai_config.extra:
                body["max_tokens"] = ai_config.extra["max_tokens"]

            # Make the API call
            with httpx.Client(timeout=request.timeout_seconds) as client:
                response = client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json=body,
                )
                response.raise_for_status()
                data = response.json()

            # Extract response
            if "error" in data:
                return AIResponse(
                    success=False,
                    error=data["error"].get("message", str(data["error"])),
                    metadata={"provider": "openrouter"},
                )

            output = data["choices"][0]["message"]["content"]

            # Extract usage and cost information
            usage = data.get("usage", {})
            metadata = {
                "provider": "openrouter",
                "model": model,
                "usage": {
                    "prompt_tokens": usage.get("prompt_tokens", 0),
                    "completion_tokens": usage.get("completion_tokens", 0),
                    "total_tokens": usage.get("total_tokens", 0),
                },
            }

            # OpenRouter provides cost information
            if "total_cost" in usage:
                metadata["cost_usd"] = usage["total_cost"]

            return AIResponse(
                success=True,
                output=output,
                files=[],
                metadata=metadata,
            )

        except httpx.HTTPError as e:
            _logger.error("OpenRouter HTTP error: %s", e)
            return AIResponse(
                success=False,
                error=f"HTTP error: {e}",
                metadata={"provider": "openrouter"},
            )
        except Exception as e:
            _logger.error("OpenRouter call failed: %s", e)
            return AIResponse(
                success=False,
                error=str(e),
                metadata={"provider": "openrouter"},
            )

    def is_available(self) -> bool:
        """Check if OpenRouter provider is available.

        Returns:
            True if httpx is installed and API key is set.
        """
        try:
            import httpx  # noqa: F401

            api_key = self._api_key or os.environ.get("OPENROUTER_API_KEY")
            return api_key is not None
        except ImportError:
            return False
