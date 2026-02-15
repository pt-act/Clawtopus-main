"""Generic CLI adapter for manual session management.

This adapter is designed for use with any CLI or terminal environment
where IDE-specific hooks are not available. Users manually manage sessions.
"""

from __future__ import annotations

import os
from pathlib import Path

from voyager.adapters.base.ide_adapter import IDEAdapter, IDEContext, IDEEvent
from voyager.config import get_config
from voyager.logging import get_logger

_logger = get_logger("adapter.generic_cli")


class GenericCLIAdapter(IDEAdapter):
    """Generic CLI adapter for manual session management.

    This adapter is designed for environments without IDE-specific hooks.
    Users manually trigger session start/end and brain updates via CLI commands.

    Example usage:
        # Start a session
        voyager session start

        # Work on code...

        # Update brain manually
        voyager brain update

        # End session
        voyager session end
    """

    def __init__(self, project_dir: Path | None = None):
        """Initialize the generic CLI adapter.

        Args:
            project_dir: Project root directory. If None, uses cwd.
        """
        self._project_dir = project_dir

    def get_project_dir(self) -> Path:
        """Get the project directory.

        Uses VOYAGER_PROJECT_DIR env var if set, otherwise the directory
        provided at initialization, or cwd.
        """
        env_dir = os.environ.get("VOYAGER_PROJECT_DIR")
        if env_dir:
            return Path(env_dir)
        if self._project_dir:
            return self._project_dir
        return Path.cwd()

    def get_state_dir(self) -> Path:
        """Get the Voyager state directory.

        Uses the configuration to determine the state directory.
        Default is .voyager/ in the project root.
        """
        config = get_config()
        return self.get_project_dir() / config.state_dir

    def get_skills_dir(self) -> Path:
        """Get the skills directory.

        Uses the configuration to determine the skills directory.
        Default is .voyager/skills/ in the project root.
        """
        config = get_config()
        return self.get_project_dir() / config.skills_dir

    def on_session_start(self, event: IDEEvent) -> IDEContext | None:
        """Handle session start.

        For generic CLI, this loads the brain state and prints it to stdout
        for the user to read.

        Args:
            event: The session start event.

        Returns:
            IDEContext with brain content, or None if no brain exists.
        """
        from voyager.brain.store import BrainStore
        from voyager.brain.render import render_brain

        try:
            store = BrainStore()
            brain = store.load()

            if brain:
                # Render brain as markdown
                brain_md = render_brain(brain)
                _logger.info("Session started. Brain state loaded.")
                return IDEContext(
                    content=brain_md,
                    metadata={"session_id": event.session_id},
                    suppress_output=False,  # Show to user in CLI
                )
            else:
                _logger.info("Session started. No previous brain state found.")
                return None

        except Exception as e:
            _logger.warning("Failed to load brain state: %s", e)
            return None

    def on_session_end(self, event: IDEEvent) -> None:
        """Handle session end.

        For generic CLI, this is typically called manually by the user.

        Args:
            event: The session end event.
        """
        _logger.info("Session ended: %s", event.session_id)
        # Brain update is handled separately via `voyager brain update`

    def on_context_compact(self, event: IDEEvent) -> None:
        """Handle context compaction.

        For generic CLI, this is not applicable as there's no automatic
        context window management.

        Args:
            event: The context compaction event.
        """
        pass

    def on_tool_use(self, event: IDEEvent) -> None:
        """Handle tool use.

        For generic CLI, tool use feedback is collected manually.

        Args:
            event: The tool use event.
        """
        pass

    def inject_context(self, context: IDEContext) -> bool:
        """Inject context into the session.

        For generic CLI, this prints the context to stdout.

        Args:
            context: The context to inject.

        Returns:
            Always True (context is printed).
        """
        if not context.suppress_output:
            print("\n" + "=" * 80)
            print("VOYAGER CONTEXT")
            print("=" * 80)
            print(context.content)
            print("=" * 80 + "\n")
        return True
