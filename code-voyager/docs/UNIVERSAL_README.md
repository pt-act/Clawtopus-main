# Universal Code Voyager

**AI assistant memory that works with any CLI and IDE.**

Code Voyager adds persistent memory and skill management to AI coding assistants.
Originally designed for Claude Code, it now works with **any editor** and **any AI provider**.

> **🎉 Latest Updates (Dec 2024):**
>
> - ✨ **New Providers**: Gemini (2M context) and Cohere (RAG-optimized)
> - ✨ **New Editors**: Emacs package and Sublime Text plugin
> - 📚 **9 AI Providers** and **5+ Editor Integrations** now supported!
>
> See [CHANGELOG_NEW_FEATURES.md](CHANGELOG_NEW_FEATURES.md) for details.

## What's New: Universal Adapters

Code Voyager now features:

- 🔌 **IDE Adapters**: Works with any editor (Claude Code, VS Code, Vim, or just CLI)
- 🤖 **AI Provider Adapters**: Choose your AI (Claude, GPT-4, local models via Ollama)
- 📁 **Flexible Storage**: Configure where your memory lives
- 🔧 **Full Backward Compatibility**: Existing Claude Code users unaffected

## Quick Start

### 1. Choose Your Setup

#### Generic CLI (Works Anywhere)

```bash
# Install
uv tool install "git+(https://github.com/pt-act/code-voyager).git"

# Initialize in your project
cd my-project
mkdir -p .voyager
cat > .voyager/config.toml << EOF
[voyager]
ide_adapter = "generic_cli"
ai_provider = "claude"
EOF

# Use
voyager session start
voyager brain update
voyager session end
```

#### Claude Code (Original)

```bash
# Install CLI
uv tool install "git+https://github.com/zenbase-ai/code-voyager.git"

# Install skills
mkdir -p .claude/skills && \
  curl -sL https://github.com/pt-act/code-voyager/archive/main.tar.gz | \
  tar -xz -C .claude/skills --strip-components=3 code-voyager-main/.claude/skills/

# Add hooks to .claude/settings.json
# (See original README for hook configuration)
```

### 2. Choose Your AI Provider

#### Claude (Recommended)

```toml
[voyager]
ai_provider = "claude"

[ai.claude]
model = "claude-3-5-sonnet-20241022"
```

Set API key: `export ANTHROPIC_API_KEY="sk-ant-..."`

#### OpenAI

```bash
pip install openai
```

```toml
[voyager]
ai_provider = "openai"

[ai.openai]
model = "gpt-4"
```

Set API key: `export OPENAI_API_KEY="sk-..."`

#### Ollama (Local, Private)

```bash
# Install Ollama from https://ollama.ai/
ollama pull codellama:34b
ollama serve
```

```toml
[voyager]
ai_provider = "ollama"

[ai.ollama]
model = "codellama:34b"
base_url = "http://localhost:11434"
```

No API key needed!

## Core Features

All these work regardless of your IDE or AI provider:

### 1. Session Brain

Persistent memory of what you're working on.

```bash
# Start session (loads brain state)
voyager session start

# Your AI now remembers context from previous sessions

# Update brain with progress
voyager brain update

# End session (saves state)
voyager session end
```

**Storage:** `.voyager/brain.json` and `.voyager/brain.md`

### 2. Curriculum Planner

Generates prioritized task sequences.

```bash
# Generate a curriculum
voyager curriculum plan

# Output saved to .voyager/curriculum.md
```

### 3. Skill Factory

Proposes and scaffolds reusable skills.

```bash
# Propose new skills
voyager factory propose

# List proposals
voyager factory list

# Scaffold a skill
voyager factory scaffold --name deploy-workflow
```

**Storage:** `.voyager/skills/generated/`

### 4. Skill Retrieval

Semantic search over your skill library.

```bash
# Index skills
voyager skill index

# Search for skills
voyager skill find "deployment process"
```

### 5. Skill Refinement

Feedback-driven skill improvement.

```bash
# View skill insights
voyager feedback insights

# Shows which skills need improvement based on usage
```

## IDE Adapters

### Claude Code (`claude_code`)

**Full automation** with hooks.

- ✅ Automatic session management
- ✅ Context injection
- ✅ Brain updates on session end
- ✅ Tool use feedback

**Setup:** See original README for hook configuration.

### Generic CLI (`generic_cli`)

**Manual control** for any environment.

- ✅ Works with any editor
- ✅ No IDE integration needed
- ✅ Scriptable
- ✅ Full control

**Usage:**

```bash
voyager session start
# Work on code...
voyager brain update
voyager session end
```

### Available Now

- **VS Code**: ✅ Extension with sidebar and automatic integration
- **Emacs**: ✅ Package with minor mode and LSP support
- **Sublime Text**: ✅ Plugin with command palette and menu integration
- **Generic LSP**: ✅ Works with any LSP-compatible editor (Neovim, Helix, Vim, etc.)

### Coming Soon

- **JetBrains**: Plugin for IntelliJ, PyCharm, WebStorm, etc.
- **Zed**: Native extension

## AI Providers

Voyager now supports **9 AI providers** - choose based on your needs:

| Provider         | Best For                   | Cost   | Privacy | Setup  |
| ---------------- | -------------------------- | ------ | ------- | ------ |
| **Claude**       | Code quality, instructions | $$$    | Low     | Easy   |
| **OpenAI**       | General purpose            | $-$$$  | Low     | Easy   |
| **Gemini**       | Large context (2M tokens)  | $      | Low     | Easy   |
| **Cohere**       | RAG, skill retrieval       | $$     | Low     | Easy   |
| **Ollama**       | Privacy, offline           | Free\* | High    | Medium |
| **OpenRouter**   | 50+ models, one API        | Varies | Low     | Easy   |
| **Azure OpenAI** | Enterprise, compliance     | $$$    | Medium  | Medium |
| **Together AI**  | Open models, fast          | $$     | Low     | Easy   |
| **Fireworks AI** | Fast inference             | $$     | Low     | Easy   |

\*Requires local hardware

See [PROVIDERS.md](PROVIDERS.md) for detailed comparison and setup guides.

## Configuration

Configuration lives in `.voyager/config.toml` or `voyager.toml`:

```toml
[voyager]
state_dir = ".voyager"
skills_dir = ".voyager/skills"
ide_adapter = "generic_cli"
ai_provider = "claude"

[ai.claude]
model = "claude-3-5-sonnet-20241022"
timeout_seconds = 60

[ide.generic_cli]
auto_save_brain = true
verbose = true
```

See [docs/configuration.md](docs/configuration.md) for full reference.

## Examples

### Generic CLI with Claude

```bash
cp examples/generic-cli/voyager.toml .voyager/config.toml
export ANTHROPIC_API_KEY="sk-ant-..."
voyager session start
```

### Generic CLI with OpenAI

```bash
pip install openai
cp examples/with-openai/voyager.toml .voyager/config.toml
export OPENAI_API_KEY="sk-..."
voyager session start
```

### Local with Ollama

```bash
ollama pull codellama:34b
ollama serve
cp examples/with-ollama/voyager.toml .voyager/config.toml
voyager session start
```

## Hybrid Approach

Use different providers for different tasks:

```bash
# Quick brain updates (free, private)
voyager brain update --provider ollama

# Complex skill generation (best quality)
voyager factory propose --provider claude

# Simple questions (cheap)
voyager ask "What's next?" --provider openai --model gpt-3.5-turbo
```

## Benefits

### Universal Compatibility

- ✅ Works with **any editor**: Vim, Emacs, VS Code, Sublime, etc.
- ✅ Works with **any AI**: Claude, GPT-4, local models
- ✅ Works **anywhere**: Terminal, SSH, Docker containers

### Portability

- ✅ Your memory travels with your code (`.voyager/` directory)
- ✅ Team members can share skills and curriculum
- ✅ Switch IDEs without losing context

### Flexibility

- ✅ Choose your AI provider based on needs (quality, cost, privacy)
- ✅ Manual or automatic session management
- ✅ Scriptable and CLI-first design

### Privacy

- ✅ Use local models (Ollama) for complete privacy
- ✅ No data leaves your machine
- ✅ Run offline if needed

## Documentation

### Core Documentation

- [Architecture](ARCHITECTURE.md) - System design and adapter architecture
- [Migration Guide](MIGRATION_GUIDE.md) - Migrating from Claude Code to universal setup

### Provider & Editor Guides

- **[PROVIDERS.md](PROVIDERS.md)** - Complete guide to all 9 AI providers
- **[EXTENSIONS.md](EXTENSIONS.md)** - Complete guide to all editor integrations
- [VS Code Extension](extensions/vscode/README.md) - VS Code extension documentation
- [Emacs Package](extensions/emacs/README.md) - Emacs package documentation
- [Sublime Text Plugin](extensions/sublime/README.md) - Sublime Text plugin documentation
- [LSP Server](src/voyager/lsp/README.md) - Generic LSP server for any editor

### Examples & Tutorials

- [Gemini Provider Example](examples/providers/gemini_example.md)
- [Cohere Provider Example](examples/providers/cohere_example.md)
- [Generic CLI Example](examples/generic-cli/README.md)
- [OpenAI Example](examples/with-openai/README.md)
- [Ollama Example](examples/with-ollama/README.md)
- [OpenRouter Example](examples/with-openrouter/README.md)

## Migration from Claude Code

Existing Claude Code users can continue using the original setup.
The adapter system is fully backward compatible:

```toml
[voyager]
state_dir = ".claude/voyager"
skills_dir = ".claude/skills"
ide_adapter = "claude_code"
ai_provider = "claude"
```

Or migrate to the universal setup:

```bash
# Move state to new location
mv .claude/voyager .voyager
mv .claude/skills .voyager/skills

# Update config
cat > .voyager/config.toml << EOF
[voyager]
ide_adapter = "generic_cli"
ai_provider = "claude"
EOF
```

## Creating Custom Adapters

### IDE Adapter

```python
from voyager.adapters.base.ide_adapter import IDEAdapter, IDEEvent, IDEContext

class MyIDEAdapter(IDEAdapter):
    def get_project_dir(self) -> Path:
        return Path.cwd()

    def on_session_start(self, event: IDEEvent) -> IDEContext | None:
        # Load and return brain context
        pass

    # Implement other methods...
```

### AI Provider

```python
from voyager.adapters.base.ai_provider import AIProvider, AIRequest, AIResponse

class MyAIProvider(AIProvider):
    def call(self, request: AIRequest) -> AIResponse:
        # Make API call and return response
        pass

    def is_available(self) -> bool:
        # Check if provider is available
        pass
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for details.

## Contributing

We welcome contributions for:

- New IDE adapters (JetBrains, Zed, etc.)
- New AI providers (HuggingFace, LocalAI, Anthropic Bedrock, etc.)
- Improvements to existing integrations
- Documentation improvements
- Bug fixes and features
- Package manager submissions (VS Code Marketplace, MELPA, Package Control)

## Roadmap

### Completed ✅

- [x] Generic CLI adapter
- [x] OpenAI provider
- [x] Ollama provider
- [x] VS Code extension
- [x] Generic LSP server
- [x] **Gemini provider** ✨
- [x] **Cohere provider** ✨
- [x] **Emacs package** ✨
- [x] **Sublime Text plugin** ✨
- [x] OpenRouter provider
- [x] Azure OpenAI provider
- [x] Together AI provider
- [x] Fireworks AI provider

### In Progress / Planned

- [ ] JetBrains plugin
- [ ] Zed extension
- [ ] Package manager releases (VS Code Marketplace, MELPA, Package Control)
- [ ] More AI providers (HuggingFace, LocalAI, etc.)

## License

MIT

## Acknowledgments

Inspired by the [Voyager paper](https://arxiv.org/abs/2305.16291) from NVIDIA and Caltech.

Original Claude Code integration by the Zenbase team.

Universal adapter system designed to make AI memory accessible to everyone,
regardless of their IDE or AI provider choice.
