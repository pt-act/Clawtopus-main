"""Adapter system for IDE and AI provider integrations.

This module provides abstractions for integrating Voyager with different
IDEs and AI providers, making it IDE and AI-agnostic.
"""

from voyager.adapters.base.ai_provider import AIProvider, AIRequest, AIResponse
from voyager.adapters.base.ide_adapter import IDEAdapter, IDEContext, IDEEvent

__all__ = [
    "AIProvider",
    "AIRequest",
    "AIResponse",
    "IDEAdapter",
    "IDEContext",
    "IDEEvent",
]
