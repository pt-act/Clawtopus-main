# IDE Adapters

Code Voyager uses an adapter system to work with different IDEs and editors.
This allows you to use the same memory and skill system across different development environments.

## Available Adapters

### Claude Code (`claude_code`)

**Default adapter** for Claude Code IDE (claude.ai/code).

**Features:**

- Automatic session management via hooks
- Context injection on session start
- Brain updates on session end and context compaction
- Tool use feedback collection

**Configuration:**

```toml
[voyager]
ide_adapter = "claude_code"
state_dir = ".claude/voyager"
skills_dir = ".claude/skills"
```

**Setup:**

1. Install Voyager CLI
2. Add hooks to `.claude/settings.json`
3. Skills are automatically loaded

**Pros:**

- ✅ Fully automatic
- ✅ No manual intervention needed
- ✅ Rich context injection

**Cons:**

- ❌ Only works with Claude Code
- ❌ Requires hook configuration

### Generic CLI (`generic_cli`)

**Manual adapter** for any CLI or terminal environment.

**Features:**

- Manual session management
- Explicit brain updates
- Works in any terminal
- No IDE-specific hooks required

**Configuration:**

```toml
[voyager]
ide_adapter = "generic_cli"
state_dir = ".voyager"
skills_dir = ".voyager/skills"

[ide.generic_cli]
auto_save_brain = true
verbose = true
```

**Setup:**

1. Install Voyager CLI
2. Copy config to `.voyager/config.toml`
3. Use CLI commands manually

**Usage:**

```bash
# Start session
voyager session start

# Work on code...

# Update brain
voyager brain update

# End session
voyager session end
```

**Pros:**

- ✅ Works with any editor
- ✅ No IDE integration needed
- ✅ Full control over when updates happen
- ✅ Scriptable

**Cons:**

- ❌ Manual intervention required
- ❌ No automatic context injection

### VS Code (Coming Soon)

**VS Code extension** for automatic integration.

**Planned Features:**

- Automatic session management
- Integration with GitHub Copilot
- Sidebar panel for brain state
- Skill palette

**Configuration:**

```toml
[voyager]
ide_adapter = "vscode"

[ide.vscode]
extension_id = "voyager.code-voyager"
```

### JetBrains (Coming Soon)

**IntelliJ IDEA plugin** for JetBrains IDEs.

**Planned Features:**

- Works with IntelliJ, PyCharm, WebStorm, etc.
- Tool window for Voyager state
- Integration with AI Assistant

**Configuration:**

```toml
[voyager]
ide_adapter = "jetbrains"

[ide.jetbrains]
plugin_id = "ai.zenbase.voyager"
```

### Vim/Neovim (Coming Soon)

**Vim plugin** for Vim and Neovim.

**Planned Features:**

- Commands and keybindings
- Lua API for custom integrations
- Buffer-based brain display

**Configuration:**

```toml
[voyager]
ide_adapter = "vim"

[ide.vim]
plugin_name = "voyager.nvim"
```

### Generic LSP (Coming Soon)

**Language Server Protocol** server for any LSP-compatible editor.

**Planned Features:**

- Works with any LSP client
- Custom LSP commands
- Notifications for brain updates

**Configuration:**

```toml
[voyager]
ide_adapter = "generic_lsp"

[ide.generic_lsp]
port = 7878
```

## Creating a Custom Adapter

You can create your own IDE adapter by implementing the `IDEAdapter` interface:

```python
from pathlib import Path
from voyager.adapters.base.ide_adapter import IDEAdapter, IDEEvent, IDEContext

class MyIDEAdapter(IDEAdapter):
    def get_project_dir(self) -> Path:
        return Path.cwd()

    def get_state_dir(self) -> Path:
        return self.get_project_dir() / ".voyager"

    def on_session_start(self, event: IDEEvent) -> IDEContext | None:
        # Load brain and return context to inject
        from voyager.brain.store import BrainStore
        from voyager.brain.render import render_brain

        brain = BrainStore().load()
        if brain:
            return IDEContext(
                content=render_brain(brain),
                metadata={"session_id": event.session_id},
            )
        return None

    def on_session_end(self, event: IDEEvent) -> None:
        # Save brain state
        pass

    def on_context_compact(self, event: IDEEvent) -> None:
        # Save state before compaction
        pass

    def on_tool_use(self, event: IDEEvent) -> None:
        # Collect feedback
        pass
```

Then register it:

```python
from voyager.adapters import registry

registry.register_ide_adapter("my_ide", MyIDEAdapter)
```

## Adapter Comparison

| Feature           | Claude Code | Generic CLI | VS Code | JetBrains | Vim    | LSP    |
| ----------------- | ----------- | ----------- | ------- | --------- | ------ | ------ |
| Auto session mgmt | ✅          | ❌          | 🚧      | 🚧        | 🚧     | 🚧     |
| Context injection | ✅          | ❌          | 🚧      | 🚧        | 🚧     | 🚧     |
| Brain updates     | ✅          | Manual      | 🚧      | 🚧        | 🚧     | 🚧     |
| Skill retrieval   | ✅          | Manual      | 🚧      | 🚧        | 🚧     | 🚧     |
| Tool feedback     | ✅          | ❌          | 🚧      | 🚧        | 🚧     | 🚧     |
| Setup complexity  | Medium      | Low         | Medium  | Medium    | Low    | Medium |
| Portability       | Low         | High        | Low     | Low       | Medium | High   |

## Choosing an Adapter

**Use Claude Code if:**

- You're already using Claude Code
- You want full automation
- You don't mind IDE lock-in

**Use Generic CLI if:**

- You want maximum portability
- You use multiple editors
- You prefer manual control
- You're using an unsupported IDE

**Wait for VS Code if:**

- You use VS Code exclusively
- You want IDE integration
- You can wait for the extension

**Wait for LSP if:**

- You use an LSP-compatible editor
- You want broad compatibility
- You need IDE features without lock-in
