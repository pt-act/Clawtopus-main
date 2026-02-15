# Code Voyager v0.2.0 - Major Feature Release

## 🎉 What's New

This release massively expands Code Voyager's compatibility and usability with new AI providers, a VS Code extension, and a universal LSP server!

### 🤖 New AI Providers

#### OpenRouter Support

Access **50+ models** from multiple providers through a single API!

- ✅ **Single API key** for Anthropic, OpenAI, Google, Meta, Mistral, and more
- ✅ **Automatic fallbacks** for better reliability
- ✅ **Unified cost tracking** across all providers
- ✅ **Latest models** available immediately

**Example:**

```toml
[ai.openrouter]
model = "anthropic/claude-3.5-sonnet"
# Or: openai/gpt-4, google/gemini-pro, meta-llama/llama-3.1-70b-instruct
```

**Learn more:** `examples/with-openrouter/README.md`

#### OpenAI-Compatible APIs

Use **any** OpenAI-compatible API provider!

Supported services:

- **Cloud**: Azure OpenAI, Together AI, Fireworks AI, Anyscale, and more
- **Self-hosted**: LocalAI, LM Studio, Text Generation WebUI, vLLM

**Example:**

```toml
[ai.openai_compatible]
base_url = "https://api.together.xyz/v1"
model = "mistralai/Mixtral-8x7B-Instruct-v0.1"
```

**Learn more:** `examples/with-openai-compatible/README.md`

### 🖥️ VS Code Extension

**Full IDE integration** with sidebar views and automatic session management!

**Features:**

- 📊 **Real-time Brain State** - Visualize goals, decisions, next steps in sidebar
- ⚡ **Skills Browser** - Browse and search skills with visual cards
- 🎯 **Quick Commands** - All Voyager features via Command Palette
- 🔄 **Auto-start** - Automatically manages sessions on workspace open/close
- 🎨 **Beautiful UI** - Modern, VS Code-native interface

**Install:**

```bash
cd extensions/vscode
npm install
npm run compile
# Press F5 in VS Code to launch
```

**Learn more:** `extensions/vscode/README.md`

### 🌐 Generic LSP Server

**Works with ANY LSP-compatible editor!**

**Supported Editors:**

- ✅ VS Code (LSP client)
- ✅ Neovim (nvim-lspconfig)
- ✅ Vim (vim-lsp, coc.nvim)
- ✅ Emacs (lsp-mode, eglot)
- ✅ Sublime Text (LSP package)
- ✅ And many more!

**Features:**

- 🎯 **Commands** - Execute all Voyager commands via LSP
- 💡 **Hover Context** - View brain state on hover
- 🔮 **Completions** - Skill suggestions (trigger with `@`)
- 🚀 **Auto-start** - Automatic session management

**Install:**

```bash
uv tool install "git+https://github.com/infinity-vs/code-voyager.git[lsp]"
voyager-lsp  # Starts LSP server
```

**Learn more:** `src/voyager/lsp/README.md`

## 📦 Installation Options

### Minimal (Claude only)

```bash
uv tool install "git+https://github.com/infinity-vs/code-voyager.git"
```

### With OpenRouter

```bash
uv tool install "git+https://github.com/infinity-vs/code-voyager.git[openrouter]"
```

### With OpenAI-Compatible APIs

```bash
uv tool install "git+https://github.com/infinity-vs/code-voyager.git[openai-compatible]"
```

### With LSP Server

```bash
uv tool install "git+https://github.com/infinity-vs/code-voyager.git[lsp]"
```

### Full Installation (Everything)

```bash
uv tool install "git+https://github.com/infinity-vs/code-voyager.git[full]"
```

## 🎯 Quick Start Examples

### Example 1: VS Code with OpenRouter

```bash
# Install
cd extensions/vscode && npm install && npm run compile

# Configure
cat > .voyager/config.toml << EOF
[voyager]
ide_adapter = "vscode"
ai_provider = "openrouter"

[ai.openrouter]
model = "anthropic/claude-3.5-sonnet"
EOF

# Set API key
export OPENROUTER_API_KEY="sk-or-..."

# Launch (F5 in VS Code)
```

### Example 2: Neovim with LocalAI

```bash
# Install LSP server
uv tool install "git+https://github.com/infinity-vs/code-voyager.git[lsp]"

# Start LocalAI
docker run -p 8080:8080 localai/localai:latest

# Configure Neovim (see src/voyager/lsp/README.md)

# Use in Neovim
# <leader>vs - Start session
# <leader>vu - Update brain
```

### Example 3: Any Editor with Together AI

```bash
# Install
uv tool install "git+https://github.com/infinity-vs/code-voyager.git[openai-compatible]"

# Configure
cat > .voyager/config.toml << EOF
[voyager]
ai_provider = "openai_compatible"

[ai.openai_compatible]
base_url = "https://api.together.xyz/v1"
model = "mistralai/Mixtral-8x7B-Instruct-v0.1"
EOF

# Set API key
export TOGETHER_API_KEY="..."

# Use normally
voyager session start
```

## 📊 Provider Comparison

| Provider              | Access         | Cost   | Privacy | Setup  |
| --------------------- | -------------- | ------ | ------- | ------ |
| **Claude**            | Claude models  | $$$    | Low     | Easy   |
| **OpenAI**            | OpenAI models  | $$     | Low     | Easy   |
| **OpenRouter**        | 50+ models     | $-$$$  | Low     | Easy   |
| **OpenAI-Compatible** | Many providers | Varies | Varies  | Medium |
| **Ollama**            | Local models   | Free   | High    | Medium |

## 🎨 IDE Comparison

| Feature            | VS Code Ext | LSP Server | CLI Only |
| ------------------ | ----------- | ---------- | -------- |
| Visual Brain State | ✅          | ❌         | ❌       |
| Sidebar UI         | ✅          | ❌         | ❌       |
| Hover Context      | ❌          | ✅         | ❌       |
| Commands           | ✅          | ✅         | ✅       |
| Auto-start         | ✅          | ✅         | ❌       |
| Editor Support     | VS Code     | Any LSP    | Any      |

## 🔧 Configuration Updates

### New AI Provider Options

```toml
[voyager]
# New options:
ai_provider = "openrouter"        # Access 50+ models
ai_provider = "openai_compatible" # Use any compatible API
```

### New IDE Adapter Options

```toml
[voyager]
# New options:
ide_adapter = "vscode"      # VS Code extension
ide_adapter = "generic_lsp" # LSP server (any editor)
```

## 📚 New Documentation

- `examples/with-openrouter/README.md` - OpenRouter guide
- `examples/with-openai-compatible/README.md` - OpenAI-compatible guide
- `extensions/vscode/README.md` - VS Code extension guide
- `src/voyager/lsp/README.md` - LSP server guide

## 🐛 Bug Fixes

- None (this is a feature release)

## ⚠️ Breaking Changes

- None! All changes are backward compatible.

## 🔮 Coming Soon

- **VS Code Marketplace** - Published extension
- **JetBrains Plugin** - IntelliJ, PyCharm, etc.
- **Vim Plugin** - Native Vim/Neovim plugin
- **More AI Providers** - Gemini, Cohere, etc.

## 📈 Stats

- **New AI Providers:** 2 (OpenRouter, OpenAI-Compatible)
- **New IDE Integrations:** 2 (VS Code Extension, LSP Server)
- **Supported Editors:** 10+ (via LSP)
- **Supported AI Models:** 50+ (via OpenRouter)
- **Lines of Code Added:** ~3,000
- **New Examples:** 2
- **New Documentation:** 4 major guides

## 🙏 Acknowledgments

Thanks to:

- OpenRouter team for the unified API
- The LSP community for standardization
- VS Code team for excellent extension APIs
- All the OpenAI-compatible providers

## 📝 Full Changelog

### Added

- OpenRouter AI provider adapter
- OpenAI-compatible AI provider adapter
- VS Code extension with sidebar views
- Generic LSP server for universal editor support
- Comprehensive documentation for all new features
- Example configurations for new providers
- Installation extras for new features

### Changed

- Updated `pyproject.toml` with new optional dependencies
- Enhanced configuration system to support new providers
- Improved AI provider abstraction

### Documentation

- Added OpenRouter usage guide
- Added OpenAI-compatible provider guide
- Added VS Code extension documentation
- Added LSP server documentation with editor configs
- Updated main README with new features

## 🚀 Upgrade Guide

### From v0.1.0

**No changes needed!** v0.2.0 is fully backward compatible.

To use new features:

1. **Add OpenRouter:**

   ```bash
   pip install httpx
   export OPENROUTER_API_KEY="..."
   ```

2. **Add VS Code Extension:**

   ```bash
   cd extensions/vscode && npm install
   ```

3. **Add LSP Server:**
   ```bash
   uv tool install --force "git+https://github.com/infinity-vs/code-voyager.git[lsp]"
   ```

## 📞 Support

- **Issues:** https://github.com/infinity-vs/code-voyager/issues
- **Discussions:** https://github.com/infinity-vs/code-voyager/discussions
- **Documentation:** See `docs/` directory

## 🎯 Try It Now!

```bash
# Install with all features
uv tool install "git+https://github.com/infinity-vs/code-voyager.git[full]"

# Try OpenRouter (get key from openrouter.ai)
export OPENROUTER_API_KEY="sk-or-..."
voyager session start --provider openrouter --model anthropic/claude-3.5-sonnet

# Or try the LSP server with your favorite editor!
voyager-lsp
```

---

**Version:** 0.2.0  
**Release Date:** December 30, 2024  
**License:** MIT
