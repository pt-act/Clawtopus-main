"""Google Gemini AI provider.

Google's Gemini models offer multimodal capabilities and strong performance
on reasoning, code generation, and creative tasks.
"""

from __future__ import annotations

import os

from voyager.adapters.base.ai_provider import AIProvider, AIRequest, AIResponse
from voyager.config import get_config
from voyager.logging import get_logger

_logger = get_logger("provider.gemini")


class GeminiProvider(AIProvider):
    """AI provider for Google Gemini.

    Google Gemini offers state-of-the-art language models:
    - gemini-pro: Best for text-based tasks
    - gemini-1.5-pro: Latest model with 1M token context
    - gemini-1.5-flash: Faster, cost-effective alternative
    - gemini-ultra: Highest capability (limited availability)

    Features:
    - Large context windows (up to 1M tokens)
    - Strong reasoning capabilities
    - Code generation and understanding
    - Multimodal support (text, image, video)

    Configuration example:
        [ai.gemini]
        model = "gemini-1.5-pro"
        # API key from GOOGLE_API_KEY environment variable
    """

    def __init__(self, api_key: str | None = None):
        """Initialize the Gemini provider.

        Args:
            api_key: Google API key. If None, reads from GOOGLE_API_KEY.
        """
        self._api_key = api_key

    def call(self, request: AIRequest) -> AIResponse:
        """Make a call to Google Gemini.

        Args:
            request: The AI request.

        Returns:
            AIResponse with the result.
        """
        if not self.is_available():
            return AIResponse(
                success=False,
                error="Gemini provider not available. Install 'google-generativeai' package and set GOOGLE_API_KEY.",
                metadata={"provider": "gemini"},
            )

        try:
            import google.generativeai as genai

            config = get_config()
            ai_config = config.get_ai_config("gemini")

            # Get API key
            api_key = self._api_key or os.environ.get("GOOGLE_API_KEY")
            if not api_key:
                return AIResponse(
                    success=False,
                    error="GOOGLE_API_KEY environment variable not set",
                    metadata={"provider": "gemini"},
                )

            # Configure API
            genai.configure(api_key=api_key)

            # Get model
            model_name = request.model or ai_config.model
            model = genai.GenerativeModel(model_name)

            # Build prompt with system instruction if available
            if request.system_prompt:
                # For Gemini, prepend system prompt to user prompt
                full_prompt = f"{request.system_prompt}\n\n{request.prompt}"
            else:
                full_prompt = request.prompt

            # Configure generation
            generation_config = genai.GenerationConfig(
                temperature=request.temperature or ai_config.extra.get("temperature", 0.7),
                max_output_tokens=ai_config.extra.get("max_tokens"),
            )

            # Make the API call
            response = model.generate_content(
                full_prompt,
                generation_config=generation_config,
            )

            # Extract text from response
            if not response.parts:
                return AIResponse(
                    success=False,
                    error="No response parts returned from Gemini",
                    metadata={"provider": "gemini"},
                )

            output = response.text

            # Extract usage information
            metadata = {
                "provider": "gemini",
                "model": model_name,
            }

            # Gemini provides usage metadata
            if hasattr(response, 'usage_metadata') and response.usage_metadata:
                metadata["usage"] = {
                    "prompt_tokens": response.usage_metadata.prompt_token_count,
                    "completion_tokens": response.usage_metadata.candidates_token_count,
                    "total_tokens": response.usage_metadata.total_token_count,
                }

            return AIResponse(
                success=True,
                output=output,
                files=[],
                metadata=metadata,
            )

        except Exception as e:
            _logger.error("Gemini call failed: %s", e)
            return AIResponse(
                success=False,
                error=str(e),
                metadata={"provider": "gemini"},
            )

    def is_available(self) -> bool:
        """Check if Gemini provider is available.

        Returns:
            True if the google-generativeai package is installed and API key is set.
        """
        try:
            import google.generativeai  # noqa: F401

            api_key = self._api_key or os.environ.get("GOOGLE_API_KEY")
            return api_key is not None
        except ImportError:
            return False
