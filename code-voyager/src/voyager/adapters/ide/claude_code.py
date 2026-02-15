"""Claude Code IDE adapter.

This adapter wraps the existing Claude Code integration and maintains
backward compatibility with the current implementation.
"""

from __future__ import annotations

import os
from pathlib import Path

from voyager.adapters.base.ide_adapter import IDEAdapter, IDEContext, IDEEvent
from voyager.logging import get_logger
from voyager.scripts.brain.inject import inject_brain_context
from voyager.scripts.brain.update import main as brain_update_main

_logger = get_logger("adapter.claude_code")


class ClaudeCodeAdapter(IDEAdapter):
    """Adapter for Claude Code IDE.

    This adapter maintains backward compatibility with the existing
    Claude Code integration while implementing the generic IDEAdapter interface.
    """

    def get_project_dir(self) -> Path:
        """Get the Claude project directory.

        Uses CLAUDE_PROJECT_DIR if set, otherwise falls back to cwd.
        """
        env_dir = os.environ.get("CLAUDE_PROJECT_DIR")
        if env_dir:
            return Path(env_dir)
        return Path.cwd()

    def get_state_dir(self) -> Path:
        """Get the Voyager state directory.

        For Claude Code, this is .claude/voyager/ for backward compatibility.
        """
        return self.get_project_dir() / ".claude" / "voyager"

    def get_skills_dir(self) -> Path:
        """Get the skills directory.

        For Claude Code, this is .claude/skills/ for backward compatibility.
        """
        return self.get_project_dir() / ".claude" / "skills"

    def on_session_start(self, event: IDEEvent) -> IDEContext | None:
        """Handle session start - inject brain context.

        Args:
            event: The session start event.

        Returns:
            IDEContext with brain and repo snapshot, or None on error.
        """
        try:
            # Use existing brain inject logic
            context_content = inject_brain_context()
            if context_content:
                return IDEContext(
                    content=context_content,
                    metadata={"session_id": event.session_id},
                    suppress_output=True,
                )
        except Exception as e:
            _logger.warning("Failed to inject brain context: %s", e)

        return None

    def on_session_end(self, event: IDEEvent) -> None:
        """Handle session end - persist brain state.

        Args:
            event: The session end event.
        """
        self._update_brain(event)

    def on_context_compact(self, event: IDEEvent) -> None:
        """Handle context compaction - persist brain state.

        Args:
            event: The context compaction event.
        """
        self._update_brain(event)

    def on_tool_use(self, event: IDEEvent) -> None:
        """Handle tool use - collect feedback.

        Args:
            event: The tool use event.
        """
        # Tool use feedback is handled by the post-tool-use hook
        # which is called separately, so we don't need to do anything here
        pass

    def _update_brain(self, event: IDEEvent) -> None:
        """Update brain state from transcript.

        Args:
            event: The event containing transcript path.
        """
        transcript_path = event.transcript_path
        if not transcript_path:
            _logger.debug("No transcript path provided")
            return

        # Resolve transcript path
        transcript = Path(transcript_path)
        if not transcript.is_absolute():
            cwd = Path(event.cwd) if event.cwd else Path.cwd()
            transcript = cwd / transcript

        if not transcript.exists():
            _logger.warning("Transcript file not found: %s", transcript)
            return

        try:
            brain_update_main(
                transcript=transcript,
                session_id=event.session_id,
                snapshot_path=None,
                dry_run=False,
                skip_llm=False,
            )
        except Exception as e:
            _logger.warning("Failed to update brain: %s", e)
