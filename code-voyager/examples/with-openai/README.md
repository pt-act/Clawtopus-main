# Using Voyager with OpenAI

This example shows how to use Code Voyager with OpenAI (GPT-4, GPT-3.5) instead of Claude.

## Prerequisites

1. Install Voyager:

```bash
uv tool install "git+https://github.com/zenbase-ai/code-voyager.git"
```

2. Install OpenAI SDK:

```bash
pip install openai
```

3. Get an OpenAI API key from https://platform.openai.com/api-keys

## Setup

1. Set your OpenAI API key:

```bash
export OPENAI_API_KEY="sk-..."
```

2. Copy the configuration to your project:

```bash
mkdir -p .voyager
cp voyager.toml .voyager/config.toml
```

3. Initialize Voyager:

```bash
voyager init
```

## Usage

All commands work the same as with Claude:

```bash
# Start session
voyager session start

# Ask questions (uses GPT-4)
voyager ask "What were we working on?"

# Update brain
voyager brain update

# Create skills
voyager factory propose

# End session
voyager session end
```

## Model Selection

You can use different OpenAI models:

### GPT-4 (Recommended)

```toml
[ai.openai]
model = "gpt-4"
```

Best for:

- Complex reasoning
- Code understanding
- Skill generation

### GPT-4-Turbo

```toml
[ai.openai]
model = "gpt-4-turbo-preview"
```

Best for:

- Faster responses
- Lower cost
- Large codebases

### GPT-3.5-Turbo

```toml
[ai.openai]
model = "gpt-3.5-turbo"
```

Best for:

- Quick questions
- Simple tasks
- Cost-sensitive use cases

## Cost Considerations

OpenAI charges per token. Typical costs:

- **Brain update**: ~$0.05-0.10 per update
- **Skill proposal**: ~$0.10-0.20 per proposal
- **Curriculum planning**: ~$0.20-0.50 per plan

Tips to reduce costs:

- Use GPT-3.5-Turbo for simple tasks
- Limit `max_turns` in config
- Use `--skip-llm` flag when possible

## Limitations

Unlike Claude Agent SDK, OpenAI doesn't directly support file operations.
This means:

- Brain updates work normally
- Curriculum planning works normally
- Skill proposals work normally
- Some advanced features may be limited

For full functionality, consider using Claude or a local model via Ollama.
