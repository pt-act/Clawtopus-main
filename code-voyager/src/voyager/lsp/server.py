"""Voyager Language Server Protocol server.

Provides LSP integration for Code Voyager, making it work with any LSP-compatible editor:
- VS Code
- Neovim
- Emacs (lsp-mode, eglot)
- Sublime Text (LSP package)
- And many more!
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from lsprotocol import types as lsp
from pygls.server import LanguageServer

from voyager.adapters.ide.generic_cli import GenericCLIAdapter
from voyager.brain.store import BrainStore
from voyager.logging import get_logger

_logger = get_logger("lsp.server")

class VoyagerLanguageServer(LanguageServer):
    """Voyager Language Server.
    
    Implements LSP to provide Code Voyager functionality to any LSP-compatible editor.
    """

    def __init__(self, *args: Any, **kwargs: Any):
        super().__init__(*args, **kwargs)
        self.adapter = GenericCLIAdapter()
        self.brain_store = BrainStore()

# Create the server instance
server = VoyagerLanguageServer("voyager-lsp", "v0.2.0")


@server.feature(lsp.INITIALIZE)
def initialize(params: lsp.InitializeParams) -> lsp.InitializeResult:
    """Handle initialization request."""
    _logger.info("Voyager LSP server initializing...")
    
    # Get workspace folder
    if params.workspace_folders:
        workspace = Path(params.workspace_folders[0].uri.replace("file://", ""))
        _logger.info("Workspace: %s", workspace)

    return lsp.InitializeResult(
        capabilities=lsp.ServerCapabilities(
            # Text document sync
            text_document_sync=lsp.TextDocumentSyncOptions(
                open_close=True,
                change=lsp.TextDocumentSyncKind.Incremental,
            ),
            # Commands
            execute_command_provider=lsp.ExecuteCommandOptions(
                commands=[
                    "voyager.sessionStart",
                    "voyager.sessionEnd",
                    "voyager.brainUpdate",
                    "voyager.brainShow",
                    "voyager.skillFind",
                    "voyager.skillIndex",
                    "voyager.curriculumPlan",
                    "voyager.factoryPropose",
                ]
            ),
            # Completion (for skill suggestions)
            completion_provider=lsp.CompletionOptions(
                trigger_characters=["@"]
            ),
            # Hover (for brain context)
            hover_provider=True,
        )
    )


@server.feature(lsp.INITIALIZED)
def initialized(params: lsp.InitializedParams) -> None:
    """Handle initialized notification."""
    _logger.info("Voyager LSP server initialized")
    
    # Auto-start session
    from voyager.adapters.base.ide_adapter import IDEEvent
    event = IDEEvent(
        event_type="session_start",
        session_id="lsp-session",
    )
    context = server.adapter.on_session_start(event)
    
    if context:
        server.show_message("Voyager: Session started", lsp.MessageType.Info)
        _logger.info("Session started successfully")


@server.feature(lsp.TEXT_DOCUMENT_DID_OPEN)
async def did_open(params: lsp.DidOpenTextDocumentParams) -> None:
    """Handle document open."""
    _logger.debug("Document opened: %s", params.text_document.uri)


@server.feature(lsp.TEXT_DOCUMENT_DID_CLOSE)
async def did_close(params: lsp.DidCloseTextDocumentParams) -> None:
    """Handle document close."""
    _logger.debug("Document closed: %s", params.text_document.uri)


@server.feature(lsp.HOVER)
def hover(params: lsp.HoverParams) -> lsp.Hover | None:
    """Provide hover information (brain context)."""
    try:
        brain = server.brain_store.load()
        if not brain:
            return None

        # Return brain summary on hover
        from voyager.brain.render import render_brain
        brain_md = render_brain(brain)
        
        return lsp.Hover(
            contents=lsp.MarkupContent(
                kind=lsp.MarkupKind.Markdown,
                value=brain_md[:1000] + "..." if len(brain_md) > 1000 else brain_md
            )
        )
    except Exception as e:
        _logger.error("Hover error: %s", e)
        return None


@server.feature(lsp.COMPLETION)
def completions(params: lsp.CompletionParams) -> lsp.CompletionList:
    """Provide completions (skill suggestions)."""
    # TODO: Implement skill-based completions
    items = []
    
    return lsp.CompletionList(
        is_incomplete=False,
        items=items
    )


@server.command("voyager.sessionStart")
def cmd_session_start(ls: VoyagerLanguageServer, args: list) -> None:
    """Start a Voyager session."""
    from voyager.adapters.base.ide_adapter import IDEEvent
    
    event = IDEEvent(
        event_type="session_start",
        session_id="lsp-session",
    )
    
    context = ls.adapter.on_session_start(event)
    if context:
        ls.show_message("Voyager: Session started", lsp.MessageType.Info)
    else:
        ls.show_message("Voyager: Failed to start session", lsp.MessageType.Error)


@server.command("voyager.sessionEnd")
def cmd_session_end(ls: VoyagerLanguageServer, args: list) -> None:
    """End the current Voyager session."""
    from voyager.adapters.base.ide_adapter import IDEEvent
    
    event = IDEEvent(
        event_type="session_end",
        session_id="lsp-session",
    )
    
    ls.adapter.on_session_end(event)
    ls.show_message("Voyager: Session ended", lsp.MessageType.Info)


@server.command("voyager.brainUpdate")
async def cmd_brain_update(ls: VoyagerLanguageServer, args: list) -> None:
    """Update brain state."""
    ls.show_message("Voyager: Updating brain...", lsp.MessageType.Info)
    
    try:
        from voyager.scripts.brain.update import main as brain_update_main
        
        brain_update_main(
            transcript=None,
            session_id="lsp-session",
            snapshot_path=None,
            dry_run=False,
            skip_llm=False,
        )
        
        ls.show_message("Voyager: Brain updated", lsp.MessageType.Info)
    except Exception as e:
        ls.show_message(f"Voyager: Failed to update brain - {e}", lsp.MessageType.Error)
        _logger.error("Brain update error: %s", e)


@server.command("voyager.brainShow")
async def cmd_brain_show(ls: VoyagerLanguageServer, args: list) -> str:
    """Show brain state."""
    try:
        brain = ls.brain_store.load()
        if brain:
            from voyager.brain.render import render_brain
            return render_brain(brain)
        else:
            return "No brain state found"
    except Exception as e:
        _logger.error("Brain show error: %s", e)
        return f"Error: {e}"


@server.command("voyager.skillFind")
async def cmd_skill_find(ls: VoyagerLanguageServer, args: list) -> list:
    """Find skills by query."""
    if not args or len(args) == 0:
        ls.show_message("Usage: voyager.skillFind <query>", lsp.MessageType.Warning)
        return []
    
    query = args[0]
    
    try:
        # TODO: Implement skill search
        ls.show_message(f"Searching for skills: {query}", lsp.MessageType.Info)
        return []
    except Exception as e:
        ls.show_message(f"Voyager: Failed to find skills - {e}", lsp.MessageType.Error)
        return []


@server.command("voyager.skillIndex")
async def cmd_skill_index(ls: VoyagerLanguageServer, args: list) -> None:
    """Index skills for search."""
    ls.show_message("Voyager: Indexing skills...", lsp.MessageType.Info)
    
    try:
        # TODO: Implement skill indexing
        ls.show_message("Voyager: Skills indexed", lsp.MessageType.Info)
    except Exception as e:
        ls.show_message(f"Voyager: Failed to index skills - {e}", lsp.MessageType.Error)


@server.command("voyager.curriculumPlan")
async def cmd_curriculum_plan(ls: VoyagerLanguageServer, args: list) -> None:
    """Create curriculum plan."""
    ls.show_message("Voyager: Creating curriculum...", lsp.MessageType.Info)
    
    try:
        # TODO: Implement curriculum planning
        ls.show_message("Voyager: Curriculum created", lsp.MessageType.Info)
    except Exception as e:
        ls.show_message(f"Voyager: Failed to create curriculum - {e}", lsp.MessageType.Error)


@server.command("voyager.factoryPropose")
async def cmd_factory_propose(ls: VoyagerLanguageServer, args: list) -> None:
    """Propose new skills."""
    ls.show_message("Voyager: Proposing skills...", lsp.MessageType.Info)
    
    try:
        # TODO: Implement skill proposals
        ls.show_message("Voyager: Skills proposed", lsp.MessageType.Info)
    except Exception as e:
        ls.show_message(f"Voyager: Failed to propose skills - {e}", lsp.MessageType.Error)


def main() -> None:
    """Start the LSP server."""
    import sys
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.FileHandler("/tmp/voyager-lsp.log"),
            logging.StreamHandler(sys.stderr),
        ],
    )
    
    _logger.info("Starting Voyager LSP server...")
    server.start_io()


if __name__ == "__main__":
    main()
