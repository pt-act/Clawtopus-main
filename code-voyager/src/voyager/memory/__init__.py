"""
Unified Memory System - __init__.py

Exports the main components for easy integration
"""

from .unified_memory import (
    UnifiedMemory,
    MemoryType,
    create_unified_memory,
    quick_store,
    quick_recall
)

from .cli_integration import add_unified_memory_commands, demo_unified_memory

__all__ = [
    "UnifiedMemory",
    "MemoryType", 
    "create_unified_memory",
    "quick_store",
    "quick_recall",
    "add_unified_memory_commands",
    "demo_unified_memory"
]
