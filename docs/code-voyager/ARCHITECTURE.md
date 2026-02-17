# Universal Code Voyager Architecture

## Overview

This document outlines the architecture for adapting Code Voyager to work with any CLI and IDE, making it a universal AI assistant memory system.

## Current Coupling Points

### 1. IDE Integration

- **Hardcoded paths**: `.claude/` directory structure
- **Claude Code hooks**: SessionStart, SessionEnd, PreCompact, PostToolUse
- **Environment variables**: `CLAUDE_PROJECT_DIR`, `CLAUDE_PLUGIN_ROOT`

### 2. AI Provider

- **Claude Agent SDK**: Tightly coupled to Claude's API
- **Tool system**: Assumes Claude's tool format (Read, Write, Glob)

### 3. Configuration

- **Fixed storage**: All state goes to `.claude/voyager/`
- **Skill location**: `.claude/skills/` hierarchy

## Proposed Architecture

### Layer 1: Core Domain Logic (IDE/AI Agnostic)

```
src/voyager/
├── core/
│   ├── brain/         # Session brain logic (unchanged)
│   ├── curriculum/    # Curriculum planning (unchanged)
│   ├── factory/       # Skill factory (unchanged)
│   ├── refinement/    # Skill refinement (unchanged)
│   └── retrieval/     # Skill retrieval (unchanged)
```

**No changes needed** - these modules are already IDE-agnostic

### Layer 2: Abstraction Layer (New)

```
src/voyager/
├── adapters/
│   ├── __init__.py
│   ├── base/
│   │   ├── ide_adapter.py      # Abstract IDE adapter interface
│   │   ├── ai_provider.py      # Abstract AI provider interface
│   │   └── event_system.py     # Generic event/hook system
│   ├── ide/
│   │   ├── __init__.py
│   │   ├── claude_code.py      # Claude Code adapter (current implementation)
│   │   ├── vscode.py           # VS Code adapter (new)
│   │   ├── jetbrains.py        # JetBrains adapter (new)
│   │   ├── vim.py              # Vim/Neovim adapter (new)
│   │   ├── emacs.py            # Emacs adapter (new)
│   │   └── generic_lsp.py      # Generic LSP adapter (new)
│   └── ai/
│       ├── __init__.py
│       ├── claude.py           # Claude provider (current implementation)
│       ├── openai.py           # OpenAI provider (new)
│       ├── anthropic.py        # Direct Anthropic API (new)
│       ├── ollama.py           # Local Ollama models (new)
│       └── gemini.py           # Google Gemini (new)
```

### Layer 3: Configuration System (Enhanced)

```
src/voyager/
├── config/
│   ├── __init__.py
│   ├── settings.py         # Configuration loader
│   ├── paths.py            # Path resolution (enhanced)
│   └── defaults.toml       # Default configuration
```

**Configuration file** (`.voyager/config.toml` or `voyager.toml`):

```toml
[voyager]
# Storage location (default: .voyager)
state_dir = ".voyager"
skills_dir = ".voyager/skills"

# IDE adapter to use
ide_adapter = "vscode"  # or "claude_code", "jetbrains", "vim", etc.

# AI provider
ai_provider = "claude"  # or "openai", "ollama", "gemini", etc.

[ai.claude]
model = "claude-3-5-sonnet-20241022"
timeout_seconds = 60
max_turns = 10

[ai.openai]
model = "gpt-4"
api_key_env = "OPENAI_API_KEY"

[ai.ollama]
model = "llama3.1"
base_url = "http://localhost:11434"

[ide.vscode]
# VS Code specific settings
extension_id = "voyager.code-voyager"

[ide.jetbrains]
# JetBrains specific settings
plugin_id = "ai.zenbase.voyager"
```

## Adapter Interfaces

### IDE Adapter Interface

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Callable

@dataclass
class IDEEvent:
    """Generic IDE event."""
    event_type: str  # "session_start", "session_end", "pre_compact", "post_tool_use"
    session_id: str
    data: dict[str, Any]
    cwd: str | None = None

@dataclass
class IDEContext:
    """Context to inject into IDE session."""
    content: str
    metadata: dict[str, Any]

class IDEAdapter(ABC):
    """Abstract base class for IDE integrations."""

    @abstractmethod
    def get_project_dir(self) -> Path:
        """Get the current project directory."""
        pass

    @abstractmethod
    def get_state_dir(self) -> Path:
        """Get the state directory for Voyager."""
        pass

    @abstractmethod
    def on_session_start(self, event: IDEEvent) -> IDEContext | None:
        """Handle session start event."""
        pass

    @abstractmethod
    def on_session_end(self, event: IDEEvent) -> None:
        """Handle session end event."""
        pass

    @abstractmethod
    def on_context_compact(self, event: IDEEvent) -> None:
        """Handle context compaction event."""
        pass

    @abstractmethod
    def on_tool_use(self, event: IDEEvent) -> None:
        """Handle tool use event."""
        pass

    @abstractmethod
    def inject_context(self, context: IDEContext) -> bool:
        """Inject context into the IDE session."""
        pass
```

### AI Provider Interface

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path

@dataclass
class AIRequest:
    """AI provider request."""
    prompt: str
    system_prompt: str | None = None
    cwd: Path | None = None
    allowed_tools: list[str] | None = None
    max_turns: int = 10
    timeout_seconds: int = 60

@dataclass
class AIResponse:
    """AI provider response."""
    success: bool
    output: str = ""
    files: list[str] = None
    error: str = ""

class AIProvider(ABC):
    """Abstract base class for AI providers."""

    @abstractmethod
    def call(self, request: AIRequest) -> AIResponse:
        """Make an AI call."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if the provider is available."""
        pass
```

## IDE-Specific Implementations

### 1. Claude Code Adapter (Current)

- Uses existing hook system
- Reads from stdin, writes to stdout
- Storage: `.claude/voyager/`

### 2. VS Code Adapter

- **Implementation**: VS Code extension
- **Communication**: Language Server Protocol (LSP) or extension API
- **Events**:
  - `workspace.onDidOpenTextDocument` → session_start
  - `workspace.onDidCloseTextDocument` → session_end
  - Custom commands for brain updates
- **Storage**: `.vscode/voyager/` or `.voyager/`

### 3. JetBrains Adapter

- **Implementation**: IntelliJ IDEA plugin
- **Communication**: Plugin API
- **Events**:
  - `ProjectManagerListener.projectOpened` → session_start
  - `ProjectManagerListener.projectClosed` → session_end
- **Storage**: `.idea/voyager/` or `.voyager/`

### 4. Vim/Neovim Adapter

- **Implementation**: Vim plugin (Lua for Neovim)
- **Communication**: RPC or command-line calls
- **Events**:
  - `VimEnter` → session_start
  - `VimLeavePre` → session_end
- **Storage**: `.vim/voyager/` or `.voyager/`

### 5. Generic CLI Adapter

- **Implementation**: Shell hooks
- **Communication**: Explicit CLI commands
- **Events**: User-triggered via commands
- **Storage**: `.voyager/`

Example usage:

```bash
# Start session
voyager session start

# Work on code...

# Update brain manually
voyager brain update

# End session
voyager session end
```

### 6. Generic LSP Adapter

- **Implementation**: Language Server Protocol server
- **Communication**: LSP standard
- **Events**: Custom LSP notifications
- **Storage**: `.voyager/`
- **Benefit**: Works with any LSP-compatible editor

## Migration Strategy

### Phase 1: Add Abstraction Layer (Backward Compatible)

1. Create adapter interfaces
2. Wrap existing code in Claude Code adapter
3. Create generic configuration system
4. **Result**: Existing users see no change

### Phase 2: Implement New Adapters

1. VS Code extension
2. Generic CLI adapter
3. Generic LSP server
4. **Result**: Works with multiple IDEs

### Phase 3: AI Provider Abstraction

1. Abstract AI calls
2. Implement OpenAI provider
3. Implement Ollama provider
4. **Result**: Works with multiple AI models

## Example: VS Code Integration

### Extension Structure

```
extensions/vscode/
├── package.json
├── src/
│   ├── extension.ts       # Entry point
│   ├── voyagerClient.ts   # Communicates with Voyager CLI
│   └── commands.ts        # VS Code commands
└── README.md
```

### User Flow

1. User opens VS Code project
2. Extension detects `.voyager/config.toml` or creates it
3. On workspace open → calls `voyager hook session-start`
4. Extension injects brain context into AI assistant (Copilot/Cody/Continue.dev)
5. On workspace close → calls `voyager hook session-end`
6. Brain state persists in `.voyager/brain.json`

## Example: Generic CLI Usage

```bash
# Initialize Voyager in a project
voyager init
# Creates .voyager/config.toml with defaults

# Configure IDE adapter
voyager config set ide_adapter generic_cli

# Configure AI provider
voyager config set ai_provider openai

# Start session manually
voyager session start

# Ask questions (uses configured AI)
voyager ask "What were we working on?"

# Create skills from workflows
voyager factory propose

# End session
voyager session end
```

## Benefits

1. **Universal**: Works with any IDE/editor
2. **Flexible**: Choose your AI provider
3. **Portable**: Skills and memory travel with your code
4. **Open**: Not locked into Claude Code
5. **Extensible**: Easy to add new IDE/AI adapters
6. **Backward Compatible**: Existing users unaffected

## Implementation Priority

1. **High Priority**
   - Generic configuration system
   - Adapter base classes
   - Generic CLI adapter
   - OpenAI provider adapter

2. **Medium Priority**
   - VS Code extension
   - Generic LSP server
   - Ollama provider

3. **Low Priority**
   - JetBrains plugin
   - Vim plugin
   - Emacs package

## File Structure After Refactor

```
code-voyager/
├── src/voyager/
│   ├── core/              # Core domain logic (unchanged)
│   ├── adapters/          # NEW: Adapter implementations
│   ├── config/            # NEW: Configuration system
│   ├── cli/               # CLI commands (enhanced)
│   └── ...
├── extensions/            # NEW: IDE extensions
│   ├── vscode/
│   ├── jetbrains/
│   └── vim/
├── examples/              # NEW: Example configurations
│   ├── generic-cli/
│   ├── vscode/
│   └── with-openai/
└── docs/                  # NEW: Adapter documentation
    ├── ide-adapters.md
    ├── ai-providers.md
    └── configuration.md
```
