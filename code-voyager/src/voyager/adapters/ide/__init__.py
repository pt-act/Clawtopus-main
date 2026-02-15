"""IDE adapter implementations."""

from voyager.adapters.ide.claude_code import ClaudeCodeAdapter
from voyager.adapters.ide.generic_cli import GenericCLIAdapter

__all__ = ["ClaudeCodeAdapter", "GenericCLIAdapter"]
