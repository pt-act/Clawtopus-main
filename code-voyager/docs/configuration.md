# Configuration Guide

Code Voyager is configured via TOML files. This guide covers all configuration options.

## Configuration File Location

Voyager searches for configuration in this order:

1. Explicitly specified path (via `--config` flag)
2. `.voyager/config.toml` in project directory
3. `voyager.toml` in project directory
4. `.voyager/config.toml` in current directory
5. `voyager.toml` in current directory
6. Default configuration (built-in)

## Basic Configuration

### Minimal Configuration

```toml
[voyager]
ide_adapter = "generic_cli"
ai_provider = "claude"
```

This uses:

- Generic CLI adapter (manual session management)
- Claude AI provider
- Default storage locations (`.voyager/`)

### Recommended Configuration

```toml
[voyager]
state_dir = ".voyager"
skills_dir = ".voyager/skills"
ide_adapter = "generic_cli"
ai_provider = "claude"

[ai.claude]
model = "claude-3-5-sonnet-20241022"
timeout_seconds = 60
max_turns = 10

[ide.generic_cli]
auto_save_brain = true
verbose = true
```

## Configuration Sections

### `[voyager]` - Main Settings

```toml
[voyager]
# Storage directory for Voyager state (brain, curriculum, etc.)
state_dir = ".voyager"

# Directory for skills
skills_dir = ".voyager/skills"

# IDE adapter to use
# Options: "claude_code", "generic_cli", "vscode", "jetbrains", "vim", "generic_lsp"
ide_adapter = "generic_cli"

# AI provider to use
# Options: "claude", "openai", "ollama", "anthropic", "gemini"
ai_provider = "claude"
```

### `[ai.claude]` - Claude Settings

```toml
[ai.claude]
# Model to use
model = "claude-3-5-sonnet-20241022"

# Timeout for API calls (seconds)
timeout_seconds = 60

# Maximum conversation turns
max_turns = 10
```

**Available Models:**

- `claude-3-5-sonnet-20241022` (Recommended)
- `claude-3-opus-latest`
- `claude-3-sonnet-20240229`

**API Key:** Set via `ANTHROPIC_API_KEY` environment variable

### `[ai.openai]` - OpenAI Settings

```toml
[ai.openai]
# Model to use
model = "gpt-4"

# Timeout for API calls (seconds)
timeout_seconds = 60

# Maximum conversation turns
max_turns = 10
```

**Available Models:**

- `gpt-4` (Best quality)
- `gpt-4-turbo-preview` (Faster, cheaper)
- `gpt-3.5-turbo` (Cheapest)

**API Key:** Set via `OPENAI_API_KEY` environment variable

### `[ai.ollama]` - Ollama Settings

```toml
[ai.ollama]
# Model to use (must be pulled first)
model = "codellama:34b"

# Ollama server URL
base_url = "http://localhost:11434"

# Timeout for API calls (seconds)
# Local models may need more time
timeout_seconds = 120
```

**Available Models:**

- `codellama:34b` (Best for code)
- `llama3.1:70b` (Best quality)
- `llama3.1:8b` (Fast)
- `mistral:latest` (Balanced)

**Setup:** Install Ollama and run `ollama pull <model>`

### `[ide.claude_code]` - Claude Code Settings

```toml
[ide.claude_code]
# Enable or disable hooks
hooks_enabled = true
```

**Additional Setup:** Configure hooks in `.claude/settings.json`

### `[ide.generic_cli]` - Generic CLI Settings

```toml
[ide.generic_cli]
# Automatically save brain state after updates
auto_save_brain = true

# Show verbose output
verbose = true
```

### `[ide.vscode]` - VS Code Settings (Coming Soon)

```toml
[ide.vscode]
# VS Code extension ID
extension_id = "voyager.code-voyager"

# Auto-start on workspace open
auto_start = true
```

### `[ide.jetbrains]` - JetBrains Settings (Coming Soon)

```toml
[ide.jetbrains]
# Plugin ID
plugin_id = "ai.zenbase.voyager"
```

### `[ide.vim]` - Vim Settings (Coming Soon)

```toml
[ide.vim]
# Plugin name
plugin_name = "voyager.nvim"
```

### `[ide.generic_lsp]` - LSP Settings (Coming Soon)

```toml
[ide.generic_lsp]
# Port for LSP server
port = 7878

# Host to bind to
host = "127.0.0.1"
```

## Environment Variables

Voyager respects several environment variables:

### Project Directory

```bash
# Override project directory
export VOYAGER_PROJECT_DIR="/path/to/project"

# Backward compatibility with Claude Code
export CLAUDE_PROJECT_DIR="/path/to/project"
```

### API Keys

```bash
# Claude/Anthropic
export ANTHROPIC_API_KEY="sk-ant-..."

# OpenAI
export OPENAI_API_KEY="sk-..."

# Google Gemini
export GOOGLE_API_KEY="..."
```

### Skill Index

```bash
# Custom skill index location
export VOYAGER_SKILL_INDEX_PATH="/path/to/index"
```

### Recursion Guard

```bash
# Internal use only (prevents infinite loops)
export VOYAGER_FOR_CODE_INTERNAL="1"
```

## Configuration Examples

### Example 1: Generic CLI with Claude

```toml
[voyager]
state_dir = ".voyager"
ide_adapter = "generic_cli"
ai_provider = "claude"

[ai.claude]
model = "claude-3-5-sonnet-20241022"
timeout_seconds = 60
```

**Use case:** Maximum portability, best AI quality

### Example 2: Generic CLI with OpenAI

```toml
[voyager]
state_dir = ".voyager"
ide_adapter = "generic_cli"
ai_provider = "openai"

[ai.openai]
model = "gpt-4"
timeout_seconds = 60

[ide.generic_cli]
verbose = true
```

**Use case:** Good quality, lower cost than Claude

### Example 3: Local with Ollama

```toml
[voyager]
state_dir = ".voyager"
ide_adapter = "generic_cli"
ai_provider = "ollama"

[ai.ollama]
model = "codellama:34b"
base_url = "http://localhost:11434"
timeout_seconds = 180

[ide.generic_cli]
auto_save_brain = true
```

**Use case:** Complete privacy, no API costs

### Example 4: Claude Code (Default)

```toml
[voyager]
state_dir = ".claude/voyager"
skills_dir = ".claude/skills"
ide_adapter = "claude_code"
ai_provider = "claude"

[ai.claude]
model = "claude-3-5-sonnet-20241022"

[ide.claude_code]
hooks_enabled = true
```

**Use case:** Using Claude Code IDE, full automation

### Example 5: Hybrid Approach

```toml
[voyager]
ide_adapter = "generic_cli"
# Default to Ollama for privacy
ai_provider = "ollama"

# Configure multiple providers
[ai.ollama]
model = "codellama:34b"
timeout_seconds = 120

[ai.claude]
model = "claude-3-5-sonnet-20241022"

[ai.openai]
model = "gpt-4"
```

Then switch providers per command:

```bash
# Quick brain update (free, private)
voyager brain update --provider ollama

# Complex skill generation (best quality)
voyager factory propose --provider claude

# Simple question (cheap)
voyager ask "What's next?" --provider openai
```

## Per-Project vs Global Configuration

### Per-Project Configuration

Place config in your project:

```
my-project/
├── .voyager/
│   └── config.toml    # Project-specific config
└── src/
```

**Benefits:**

- Different config per project
- Committed to version control
- Team members share config

### Global Configuration

Place config in home directory:

```bash
mkdir -p ~/.config/voyager
cat > ~/.config/voyager/config.toml << EOF
[voyager]
ai_provider = "claude"

[ai.claude]
model = "claude-3-5-sonnet-20241022"
EOF
```

Then use `--config` flag:

```bash
voyager --config ~/.config/voyager/config.toml brain update
```

**Benefits:**

- Same config across all projects
- Not in version control
- Personal preferences

## Configuration Priority

When multiple configs exist, Voyager merges them with this priority:

1. Command-line flags (highest)
2. Project config (`.voyager/config.toml`)
3. Global config (if specified)
4. Default config (lowest)

Example:

```bash
# Project config sets provider to "ollama"
# Command line overrides to "claude"
voyager brain update --provider claude
```

## Validation

Voyager validates your configuration on load:

```bash
# Check if config is valid
voyager config validate

# Show current configuration
voyager config show
```

Common errors:

- Invalid adapter name
- Missing AI provider configuration
- Invalid model name
- Conflicting settings

## Best Practices

### 1. Use Version Control

Commit your config for team sharing:

```bash
git add .voyager/config.toml
git commit -m "Add Voyager config"
```

### 2. Don't Commit API Keys

Use environment variables, not config files:

```toml
# ❌ Don't do this
[ai.claude]
api_key = "sk-ant-..."

# ✅ Do this instead
# Set via environment variable
```

### 3. Document Your Choices

Add comments to your config:

```toml
[voyager]
# Using Ollama for privacy (customer data)
ai_provider = "ollama"
```

### 4. Start Simple

Begin with minimal config:

```toml
[voyager]
ide_adapter = "generic_cli"
ai_provider = "claude"
```

Add options as needed.

### 5. Test Changes

Validate after editing:

```bash
voyager config validate
```

## Troubleshooting

### Config Not Found

```bash
# Check where Voyager is looking
voyager config show --verbose

# Explicitly specify path
voyager --config /path/to/config.toml brain update
```

### Invalid Configuration

```bash
# Validate config
voyager config validate

# Show current config
voyager config show
```

### Provider Not Available

```bash
# Check provider status
voyager config check-providers

# Will show which providers are available
```

### Permissions Issues

```bash
# Ensure directories exist
mkdir -p .voyager

# Fix permissions
chmod 755 .voyager
```
