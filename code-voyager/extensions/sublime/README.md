# Voyager for Sublime Text

Integrate the Voyager AI coding agent into Sublime Text with session management, brain state updates, and skill retrieval.

## Features

- 🧠 **Brain State Management**: Update and maintain context about your coding session
- 🔍 **Skill Search**: Search and retrieve relevant coding patterns from the knowledge base
- 📝 **Session Management**: Start, end, and monitor Voyager sessions
- ⚙️ **Configuration**: Easy configuration management from within Sublime Text
- 🤖 **Multiple AI Providers**: Support for Claude, OpenAI, Gemini, Cohere, Ollama, and more

## Installation

### Prerequisites

1. Install the Voyager CLI:

   ```bash
   pip install voyager-agent
   ```

2. Ensure `voyager` is in your PATH:
   ```bash
   which voyager  # Should show the path to the voyager executable
   ```

### Install Plugin

#### Via Package Control (Recommended - Coming Soon)

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Select "Package Control: Install Package"
3. Search for "Voyager"
4. Press Enter to install

#### Manual Installation

1. Clone or download this repository
2. Copy the `extensions/sublime` directory to your Sublime Text Packages folder:

   **Linux/macOS:**

   ```bash
   cp -r extensions/sublime ~/.config/sublime-text/Packages/Voyager
   ```

   **Windows:**

   ```powershell
   Copy-Item extensions/sublime "$env:APPDATA\Sublime Text\Packages\Voyager" -Recurse
   ```

3. Restart Sublime Text

## Usage

### Command Palette

Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) and type "Voyager" to see all available commands:

- **Voyager: Start Session** - Start a new Voyager session
- **Voyager: End Session** - End the current session
- **Voyager: Session Status** - View current session status
- **Voyager: Update Brain** - Update brain with current context
- **Voyager: Show Brain State** - View the current brain state
- **Voyager: Clear Brain** - Clear the brain state
- **Voyager: Search Skills** - Search for skills in the knowledge base
- **Voyager: List Skills** - List all available skills
- **Voyager: Add Skill** - Add a new skill from current file/selection
- **Voyager: Show Config** - View current configuration
- **Voyager: Edit Config** - Open configuration file for editing
- **Voyager: Select AI Provider** - Choose AI provider (Claude, OpenAI, Gemini, etc.)

### Keyboard Shortcuts

All commands use a two-key chord starting with `Ctrl+Alt+V`:

| Shortcut                 | Command               |
| ------------------------ | --------------------- |
| `Ctrl+Alt+V, Ctrl+Alt+S` | Start Session         |
| `Ctrl+Alt+V, Ctrl+Alt+E` | End Session           |
| `Ctrl+Alt+V, Ctrl+Alt+T` | Session Status        |
| `Ctrl+Alt+V, Ctrl+Alt+U` | Update Brain          |
| `Ctrl+Alt+V, Ctrl+Alt+B` | Show Brain State      |
| `Ctrl+Alt+V, Ctrl+Alt+C` | Clear Brain           |
| `Ctrl+Alt+V, Ctrl+Alt+F` | Search Skills (Find)  |
| `Ctrl+Alt+V, Ctrl+Alt+L` | List Skills           |
| `Ctrl+Alt+V, Ctrl+Alt+A` | Add Skill             |
| `Ctrl+Alt+V, Ctrl+Alt+O` | Show Config (Options) |
| `Ctrl+Alt+V, Ctrl+Alt+P` | Select Provider       |

**Note:** On macOS, use `Cmd` instead of `Ctrl`.

### Menu

Access Voyager commands from **Tools → Voyager** menu.

## Typical Workflow

1. **Start a Session**
   - Press `Ctrl+Alt+V, Ctrl+Alt+S` or use Command Palette
   - This initializes a new Voyager session

2. **Update Brain as You Code**
   - When you make significant changes, press `Ctrl+Alt+V, Ctrl+Alt+U`
   - Enter an observation/note about what you're doing
   - The current file content is sent to Voyager for context

3. **Search for Relevant Skills**
   - Press `Ctrl+Alt+V, Ctrl+Alt+F` to search skills
   - Enter a query like "error handling" or "API client"
   - View relevant code patterns in the output panel

4. **Add New Skills**
   - Select code you want to save as a skill (or use entire file)
   - Press `Ctrl+Alt+V, Ctrl+Alt+A`
   - Enter a name and description for the skill

5. **View Brain State**
   - Press `Ctrl+Alt+V, Ctrl+Alt+B` to see current context
   - Review what Voyager knows about your session

6. **End Session**
   - Press `Ctrl+Alt+V, Ctrl+Alt+E` when done
   - Session state is preserved for next time

## Configuration

### Plugin Settings

Access settings via **Preferences → Package Settings → Voyager → Settings** or use the menu.

Available settings:

```json
{
  // Enable auto-updating brain state on file save
  "auto_update_brain_on_save": false,

  // Maximum number of context lines to send when updating brain
  "context_lines": 100,

  // Command timeout in seconds
  "command_timeout": 30,

  // Brain update timeout in seconds (longer for AI processing)
  "brain_update_timeout": 60,

  // Path to voyager CLI (leave empty to use PATH)
  "voyager_cli_path": "",

  // Default AI provider
  "default_provider": "claude"
}
```

### Voyager Configuration

Configure Voyager itself:

1. Use **Voyager: Edit Config** command to open `~/.config/voyager/config.toml`
2. Or run `voyager config init` to create default configuration
3. Set your API keys and preferences

Example configuration:

```toml
[ai]
provider = "claude"

[ai.claude]
model = "claude-3-5-sonnet-20241022"
api_key = "your-api-key"

[ai.gemini]
model = "gemini-1.5-pro"
api_key = "your-google-api-key"

[ai.cohere]
model = "command-r-plus"
api_key = "your-cohere-api-key"
```

## Supported AI Providers

- **Claude** (Anthropic)
- **OpenAI** (GPT-4, GPT-3.5)
- **Google Gemini** (gemini-1.5-pro, gemini-pro)
- **Cohere** (command-r-plus, command-r)
- **Ollama** (local models)
- **OpenRouter** (50+ models)
- **Azure OpenAI**
- **Together AI**
- **Fireworks AI**

Switch providers using **Voyager: Select AI Provider** command.

## Troubleshooting

### "Voyager CLI not found"

Ensure Voyager is installed and in your PATH:

```bash
pip install voyager-agent
which voyager  # Should show path to executable
```

If using a custom Python environment, set `voyager_cli_path` in settings:

```json
{
  "voyager_cli_path": "/path/to/your/env/bin/voyager"
}
```

### Commands Timeout

If operations are timing out, increase timeout values in settings:

```json
{
  "command_timeout": 60,
  "brain_update_timeout": 120
}
```

### Brain Updates Failing

1. Check your API key is configured: `voyager config show`
2. Verify your AI provider is set correctly
3. Check console output: **View → Show Console** for error messages

## Advanced Usage

### Custom Key Bindings

Create custom key bindings via **Preferences → Package Settings → Voyager → Key Bindings**:

```json
[
  {
    "keys": ["ctrl+shift+v"],
    "command": "voyager_brain_update"
  }
]
```

### Auto-Update on Save

Enable automatic brain updates when saving files:

```json
{
  "auto_update_brain_on_save": true
}
```

**Warning:** This will make an API call on every save, which may incur costs.

## Contributing

Contributions are welcome! Please submit issues and pull requests to the main repository.

## License

MIT License - see LICENSE file for details.

## Links

- [Voyager GitHub Repository](https://github.com/infinity-vs/code-voyager)
- [Documentation](https://github.com/infinity-vs/code-voyager/blob/main/README.md)
- [Issue Tracker](https://github.com/infinity-vs/code-voyager/issues)

## Changelog

### Version 1.0.0 (2025-12-30)

- Initial release
- Full session management support
- Brain state updates and visualization
- Skill search and management
- Configuration management
- Support for 9+ AI providers
- Comprehensive keyboard shortcuts
- Command palette integration
- Menu integration
