"""Abstract AI provider interface.

This module defines the interface that all AI providers must implement,
allowing Voyager to work with different AI models (Claude, OpenAI, Ollama, etc.).
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class AIRequest:
    """Request to an AI provider.

    Attributes:
        prompt: The main prompt/instruction for the AI.
        system_prompt: Optional system prompt for context.
        cwd: Working directory for file operations.
        allowed_tools: List of tools the AI can use (e.g., ["Read", "Write", "Glob"]).
        max_turns: Maximum number of conversation turns.
        timeout_seconds: Timeout for the request.
        model: Optional model override.
        temperature: Optional temperature for generation.
    """

    prompt: str
    system_prompt: str | None = None
    cwd: Path | None = None
    allowed_tools: list[str] | None = None
    max_turns: int = 10
    timeout_seconds: int = 60
    model: str | None = None
    temperature: float | None = None


@dataclass
class AIResponse:
    """Response from an AI provider.

    Attributes:
        success: Whether the request succeeded.
        output: The AI's text output/response.
        files: List of file paths that were written (if applicable).
        error: Error message if the request failed.
        metadata: Additional provider-specific metadata.
    """

    success: bool
    output: str = ""
    files: list[str] = field(default_factory=list)
    error: str = ""
    metadata: dict[str, str] = field(default_factory=dict)


class AIProvider(ABC):
    """Abstract base class for AI providers.

    All AI providers must implement this interface to work with Voyager.
    This allows switching between different AI models (Claude, GPT-4, Llama, etc.)
    without changing the core Voyager logic.

    Example:
        class MyAIProvider(AIProvider):
            def call(self, request: AIRequest) -> AIResponse:
                # Implementation here
                pass

            def is_available(self) -> bool:
                return True  # Check if API key exists, etc.
    """

    @abstractmethod
    def call(self, request: AIRequest) -> AIResponse:
        """Make a call to the AI provider.

        Args:
            request: The AI request containing prompt and configuration.

        Returns:
            AIResponse with the result of the call.
        """
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if the AI provider is available.

        This should verify:
        - API keys are configured
        - Network connectivity (if required)
        - Required dependencies are installed

        Returns:
            True if the provider can be used, False otherwise.
        """
        pass

    def get_name(self) -> str:
        """Get the name of this AI provider.

        Returns:
            A human-readable name for this provider.
        """
        return self.__class__.__name__
