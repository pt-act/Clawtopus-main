"""Claude AI provider using Claude Agent SDK.

This provider wraps the existing Claude Code integration and maintains
backward compatibility.
"""

from __future__ import annotations

import os

from voyager.adapters.base.ai_provider import AIProvider, AIRequest, AIResponse
from voyager.logging import get_logger

_logger = get_logger("provider.claude")


class ClaudeProvider(AIProvider):
    """AI provider for Claude using Claude Agent SDK.

    This provider uses the existing Claude Code integration via
    the Claude Agent SDK.
    """

    def call(self, request: AIRequest) -> AIResponse:
        """Make a call to Claude.

        Args:
            request: The AI request.

        Returns:
            AIResponse with the result.
        """
        from voyager.llm import call_claude as _call_claude

        try:
            result = _call_claude(
                prompt=request.prompt,
                cwd=request.cwd,
                system_prompt=request.system_prompt,
                timeout_seconds=request.timeout_seconds,
                allowed_tools=request.allowed_tools,
                max_turns=request.max_turns,
            )

            return AIResponse(
                success=result.success,
                output=result.output,
                files=result.files,
                error=result.error,
                metadata={"provider": "claude", "sdk": "claude_agent_sdk"},
            )

        except Exception as e:
            _logger.error("Claude call failed: %s", e)
            return AIResponse(
                success=False,
                error=str(e),
                metadata={"provider": "claude"},
            )

    def is_available(self) -> bool:
        """Check if Claude provider is available.

        Returns:
            True if the Claude Agent SDK is available.
        """
        try:
            import claude_agent_sdk  # noqa: F401
            return True
        except ImportError:
            return False
