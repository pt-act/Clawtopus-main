"""Abstract IDE adapter interface.

This module defines the interface that all IDE adapters must implement,
allowing Voyager to work with different IDEs (VS Code, JetBrains, Vim, etc.).
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class IDEEvent:
    """Generic IDE event.

    Represents events from the IDE (session start/end, tool use, etc.)
    in an IDE-agnostic format.

    Attributes:
        event_type: Type of event ("session_start", "session_end", etc.)
        session_id: Unique session identifier.
        data: Event-specific data.
        cwd: Current working directory.
        transcript_path: Path to session transcript (if applicable).
    """

    event_type: str
    session_id: str
    data: dict[str, Any] = field(default_factory=dict)
    cwd: str | None = None
    transcript_path: str | None = None


@dataclass
class IDEContext:
    """Context to inject into the IDE session.

    Represents information that should be made available to the AI
    assistant in the IDE (brain state, curriculum, etc.).

    Attributes:
        content: The main content to inject (markdown text).
        metadata: Additional metadata about the context.
        suppress_output: Whether to suppress user-visible output.
    """

    content: str
    metadata: dict[str, Any] = field(default_factory=dict)
    suppress_output: bool = True


class IDEAdapter(ABC):
    """Abstract base class for IDE integrations.

    All IDE adapters must implement this interface to work with Voyager.
    This allows Voyager to work with different IDEs without changing the core logic.

    The adapter is responsible for:
    - Mapping IDE-specific events to generic IDEEvent objects
    - Providing paths for project and state directories
    - Handling event callbacks (session start/end, tool use)
    - Injecting context into the IDE session

    Example:
        class VSCodeAdapter(IDEAdapter):
            def get_project_dir(self) -> Path:
                return Path.cwd()

            def on_session_start(self, event: IDEEvent) -> IDEContext | None:
                # Load brain state and return context
                pass
    """

    @abstractmethod
    def get_project_dir(self) -> Path:
        """Get the current project directory.

        This should return the root directory of the project/workspace.

        Returns:
            Path to the project directory.
        """
        pass

    @abstractmethod
    def get_state_dir(self) -> Path:
        """Get the state directory for Voyager.

        This is where Voyager stores its state (brain, curriculum, etc.).
        Default is usually <project_dir>/.voyager/

        Returns:
            Path to the Voyager state directory.
        """
        pass

    def get_skills_dir(self) -> Path:
        """Get the skills directory.

        Default implementation returns <state_dir>/skills/

        Returns:
            Path to the skills directory.
        """
        return self.get_state_dir() / "skills"

    @abstractmethod
    def on_session_start(self, event: IDEEvent) -> IDEContext | None:
        """Handle session start event.

        Called when a new coding session starts. Should load the brain state
        and return context to inject into the session.

        Args:
            event: The session start event.

        Returns:
            IDEContext to inject, or None if no injection needed.
        """
        pass

    @abstractmethod
    def on_session_end(self, event: IDEEvent) -> None:
        """Handle session end event.

        Called when a coding session ends. Should persist the brain state
        from the session transcript.

        Args:
            event: The session end event.
        """
        pass

    @abstractmethod
    def on_context_compact(self, event: IDEEvent) -> None:
        """Handle context compaction event.

        Called before the IDE compacts the context window. Should save
        the current state to avoid losing information.

        Args:
            event: The context compaction event.
        """
        pass

    @abstractmethod
    def on_tool_use(self, event: IDEEvent) -> None:
        """Handle tool use event.

        Called when the AI uses a tool. Useful for collecting feedback
        for skill refinement.

        Args:
            event: The tool use event.
        """
        pass

    def inject_context(self, context: IDEContext) -> bool:
        """Inject context into the IDE session.

        Default implementation does nothing. IDE-specific adapters should
        override this to actually inject the context into the IDE.

        Args:
            context: The context to inject.

        Returns:
            True if injection succeeded, False otherwise.
        """
        return False

    def get_name(self) -> str:
        """Get the name of this IDE adapter.

        Returns:
            A human-readable name for this adapter.
        """
        return self.__class__.__name__
