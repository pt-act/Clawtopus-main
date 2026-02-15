# Code Voyager VS Code Extension

AI assistant memory that remembers across sessions - now integrated directly into VS Code!

## Features

### 🧠 Session Brain Sidebar

- **Real-time brain state visualization** in the sidebar
- **Interactive stats** showing goals, decisions, and next steps
- **One-click updates** to save your progress
- **Automatic session management** on workspace open/close

### ⚡ Skills Management

- **Browse your skill library** directly in VS Code
- **Semantic skill search** to find the right skill quickly
- **Propose new skills** from your workflows
- **Visual skill cards** with descriptions and metadata

### 🎯 Quick Commands

- `Voyager: Start Session` - Begin tracking your session
- `Voyager: End Session` - Save and close your session
- `Voyager: Update Brain` - Manually save your progress
- `Voyager: Show Brain State` - View brain in a document
- `Voyager: Find Skill` - Search for skills semantically
- `Voyager: Index Skills` - Build the skill search index
- `Voyager: Create Curriculum` - Generate a learning plan
- `Voyager: Propose Skills` - AI-suggested skill improvements

## Installation

### Prerequisites

1. **Install Code Voyager CLI**:

   ```bash
   uv tool install "git+https://github.com/infinity-vs/code-voyager.git"
   ```

2. **Configure your AI provider** (choose one):

   ```bash
   # Claude (recommended)
   export ANTHROPIC_API_KEY="sk-ant-..."

   # OpenAI
   export OPENAI_API_KEY="sk-..."

   # OpenRouter (access to many models)
   export OPENROUTER_API_KEY="sk-or-..."

   # Ollama (local, free)
   ollama pull codellama:34b
   ollama serve
   ```

### Install Extension

1. **From VSIX** (when published):
   - Download the `.vsix` file
   - Run: `code --install-extension code-voyager-0.2.0.vsix`

2. **From Source**:
   ```bash
   cd extensions/vscode
   npm install
   npm run compile
   # Press F5 in VS Code to launch Extension Development Host
   ```

## Configuration

Open VS Code Settings (Cmd/Ctrl + ,) and search for "Voyager":

```json
{
  "voyager.enabled": true,
  "voyager.autoStart": true,
  "voyager.aiProvider": "claude",
  "voyager.stateDir": ".voyager",
  "voyager.skillsDir": ".voyager/skills",
  "voyager.cliPath": "voyager"
}
```

### AI Provider Options

| Setting Value       | Description                       | Requirements         |
| ------------------- | --------------------------------- | -------------------- |
| `claude`            | Claude AI (best quality)          | `ANTHROPIC_API_KEY`  |
| `openai`            | OpenAI (GPT-4, GPT-3.5)           | `OPENAI_API_KEY`     |
| `openrouter`        | Multiple providers via OpenRouter | `OPENROUTER_API_KEY` |
| `ollama`            | Local models (free, private)      | Ollama running       |
| `openai_compatible` | Any OpenAI-compatible API         | Varies               |

## Usage

### Automatic Mode (Recommended)

With `autoStart` enabled, the extension automatically:

1. ✅ Starts a session when you open a workspace
2. ✅ Loads your brain state in the sidebar
3. ✅ Updates brain when you close the workspace
4. ✅ No manual intervention needed!

### Manual Mode

Disable `autoStart` and use commands:

1. Open Command Palette (Cmd/Ctrl + Shift + P)
2. Type "Voyager: Start Session"
3. Work on your code
4. Type "Voyager: Update Brain" to save progress
5. Type "Voyager: End Session" when done

### Sidebar Views

#### Brain View

- **Real-time stats**: Goals, decisions, next steps counters
- **Full brain state**: Markdown-rendered brain content
- **Quick actions**: Refresh and Update buttons
- **Empty state**: Helpful prompts when no brain exists

#### Skills View

- **Skill cards**: Visual cards for each skill
- **Skill types**: Color-coded badges (custom, generated, etc.)
- **Quick actions**: Refresh and Propose buttons
- **Skill count**: Total skills in your library

## Examples

### Example 1: Feature Development

1. Open your project in VS Code
2. Extension auto-starts, shows previous brain state
3. Work on new feature
4. Click "Update" in Brain View to save progress
5. Close VS Code - brain auto-saves

### Example 2: Skill Search

1. Click "Find Skill" in Skills View
2. Type: "deployment workflow"
3. Select matching skill
4. Apply skill to your project

### Example 3: Curriculum Planning

1. Open Command Palette
2. Run "Voyager: Create Curriculum"
3. View generated curriculum in `.voyager/curriculum.md`
4. Follow the learning path

## Keyboard Shortcuts

You can add custom shortcuts in VS Code:

```json
{
  "key": "ctrl+shift+v s",
  "command": "voyager.sessionStart"
},
{
  "key": "ctrl+shift+v u",
  "command": "voyager.brainUpdate"
},
{
  "key": "ctrl+shift+v f",
  "command": "voyager.skillFind"
}
```

## Troubleshooting

### "Voyager CLI not found"

**Solution**: Make sure `voyager` is in your PATH or set `voyager.cliPath`:

```json
{
  "voyager.cliPath": "/full/path/to/voyager"
}
```

### "No brain state found"

**Solution**: Start a session first:

1. Open Command Palette
2. Run "Voyager: Start Session"

### Extension not activating

**Solution**: Check VS Code Output panel:

1. View > Output
2. Select "Code Voyager" from dropdown
3. Check for error messages

### Sidebar not showing

**Solution**:

1. View > Open View...
2. Type "Voyager"
3. Select "Session Brain" or "Skills"

## Features Comparison

| Feature                      | VS Code Extension | CLI Only |
| ---------------------------- | ----------------- | -------- |
| Automatic session management | ✅                | ❌       |
| Visual brain state           | ✅                | ❌       |
| Sidebar integration          | ✅                | ❌       |
| Real-time updates            | ✅                | ❌       |
| Skill search UI              | ✅                | ❌       |
| Works in any editor          | ❌                | ✅       |
| Scriptable                   | ❌                | ✅       |

## Roadmap

- [ ] **Skill editor** - Edit skills directly in VS Code
- [ ] **Curriculum tracker** - Check off completed tasks
- [ ] **Brain history** - View past brain states
- [ ] **Skill templates** - Quick skill creation
- [ ] **Multi-workspace** - Support multiple projects
- [ ] **Cloud sync** - Sync brain across devices

## Contributing

Contributions welcome! See the [main repository](https://github.com/infinity-vs/code-voyager) for guidelines.

## License

MIT License - see [LICENSE](../../LICENSE) for details.

## Links

- **GitHub**: https://github.com/infinity-vs/code-voyager
- **Documentation**: See `docs/` in main repository
- **Issues**: https://github.com/infinity-vs/code-voyager/issues
