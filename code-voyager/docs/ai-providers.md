# AI Providers

Code Voyager supports multiple AI providers, allowing you to choose the best model
for your needs based on cost, quality, privacy, and availability.

## Available Providers

### Claude (`claude`)

**Default provider** using Claude Agent SDK.

**Features:**

- Direct file operations (Read, Write, Glob)
- Multi-turn conversations
- Tool use support
- Best integration with Voyager

**Models:**

- `claude-3-5-sonnet-20241022` (Recommended)
- `claude-3-opus-latest`
- `claude-3-sonnet-20240229`

**Configuration:**

```toml
[voyager]
ai_provider = "claude"

[ai.claude]
model = "claude-3-5-sonnet-20241022"
timeout_seconds = 60
max_turns = 10
```

**Requirements:**

- Claude Agent SDK installed
- ANTHROPIC_API_KEY environment variable

**Pros:**

- ✅ Best code understanding
- ✅ Direct file operations
- ✅ Excellent at skill generation
- ✅ Full Voyager feature support

**Cons:**

- ❌ Requires API key
- ❌ API costs
- ❌ Internet connection required

**Cost:** ~$3 per million input tokens, ~$15 per million output tokens

### OpenAI (`openai`)

**Alternative provider** using OpenAI's GPT models.

**Features:**

- Access to GPT-4, GPT-4-Turbo, GPT-3.5-Turbo
- Good code understanding
- Wide model selection

**Models:**

- `gpt-4` (Best quality)
- `gpt-4-turbo-preview` (Faster)
- `gpt-3.5-turbo` (Cheapest)

**Configuration:**

```toml
[voyager]
ai_provider = "openai"

[ai.openai]
model = "gpt-4"
timeout_seconds = 60
```

**Requirements:**

- `openai` package installed (`pip install openai`)
- OPENAI_API_KEY environment variable

**Pros:**

- ✅ Good quality
- ✅ Multiple model options
- ✅ Fast responses (turbo models)
- ✅ Lower cost (GPT-3.5)

**Cons:**

- ❌ No direct file operations
- ❌ Requires API key
- ❌ Some features limited

**Cost:**

- GPT-4: ~$10 per million input tokens
- GPT-3.5: ~$0.50 per million input tokens

### Ollama (`ollama`)

**Local provider** for complete privacy and offline use.

**Features:**

- Runs models locally
- No API keys needed
- Complete privacy
- Offline capable

**Models:**

- `codellama:34b` (Best for code)
- `llama3.1:70b` (Best quality)
- `llama3.1:8b` (Fast)
- `mistral:latest` (Balanced)

**Configuration:**

```toml
[voyager]
ai_provider = "ollama"

[ai.ollama]
model = "codellama:34b"
base_url = "http://localhost:11434"
timeout_seconds = 120
```

**Requirements:**

- Ollama installed (https://ollama.ai/)
- `httpx` package (`pip install httpx`)
- Model pulled (`ollama pull codellama:34b`)

**Pros:**

- ✅ Complete privacy
- ✅ No API costs
- ✅ Offline capable
- ✅ No rate limits

**Cons:**

- ❌ Requires powerful hardware
- ❌ Slower than API models
- ❌ Lower quality (vs GPT-4/Claude)
- ❌ No direct file operations

**Cost:** Free (hardware only)

### Anthropic API (`anthropic`) - Coming Soon

**Direct Anthropic API** without Claude Agent SDK.

Similar to Claude provider but using direct API calls.

### Gemini (`gemini`) - Coming Soon

**Google Gemini** provider.

**Models:**

- `gemini-pro`
- `gemini-ultra`

## Provider Comparison

| Feature      | Claude     | OpenAI   | Ollama    | Anthropic  | Gemini |
| ------------ | ---------- | -------- | --------- | ---------- | ------ |
| Code quality | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐    | ⭐⭐⭐⭐⭐ | 🚧     |
| Speed        | Fast       | Fast     | Slow-Fast | Fast       | 🚧     |
| Cost         | $$$        | $-$$$    | Free      | $$$        | 🚧     |
| Privacy      | Low        | Low      | High      | Low        | 🚧     |
| File ops     | ✅         | ❌       | ❌        | 🚧         | 🚧     |
| Offline      | ❌         | ❌       | ✅        | ❌         | 🚧     |
| Setup        | Easy       | Easy     | Medium    | Easy       | 🚧     |

## Choosing a Provider

### Choose Claude if:

- You want the best code understanding
- You need file operation support
- Cost is not a primary concern
- You're already using Claude Code

### Choose OpenAI if:

- You want good quality at lower cost
- You have existing OpenAI credits
- You need fast responses (GPT-4-Turbo)
- You want flexibility in model selection

### Choose Ollama if:

- Privacy is critical
- You want no ongoing costs
- You have powerful hardware
- You need offline capability
- You're okay with slower responses

## Hybrid Approach

You can use different providers for different tasks:

```bash
# Use Ollama for quick brain updates (free, private)
voyager brain update --provider ollama

# Use Claude for complex skill generation (best quality)
voyager factory propose --provider claude

# Use GPT-3.5 for simple questions (cheap)
voyager ask "What's next?" --provider openai --model gpt-3.5-turbo
```

## Creating a Custom Provider

Implement the `AIProvider` interface:

```python
from voyager.adapters.base.ai_provider import AIProvider, AIRequest, AIResponse

class MyAIProvider(AIProvider):
    def call(self, request: AIRequest) -> AIResponse:
        # Make API call to your AI service
        response_text = my_ai_api.generate(
            prompt=request.prompt,
            system=request.system_prompt,
        )

        return AIResponse(
            success=True,
            output=response_text,
            metadata={"provider": "my_ai"},
        )

    def is_available(self) -> bool:
        # Check if API key is set, service is reachable, etc.
        return os.environ.get("MY_AI_API_KEY") is not None
```

Register it:

```python
from voyager.adapters import registry

registry.register_ai_provider("my_ai", MyAIProvider)
```

## Performance Tips

### Optimize Costs

1. **Use cheaper models for simple tasks**

```toml
[ai.openai]
model = "gpt-3.5-turbo"  # 20x cheaper than GPT-4
```

2. **Reduce max_turns**

```toml
max_turns = 5  # Instead of 10
```

3. **Use local models**

```toml
ai_provider = "ollama"  # No API costs
```

### Improve Quality

1. **Use the best models**

```toml
[ai.claude]
model = "claude-3-5-sonnet-20241022"
```

2. **Increase timeout for complex tasks**

```toml
timeout_seconds = 120
```

3. **Provide better system prompts**

### Maximize Privacy

1. **Use Ollama exclusively**

```toml
ai_provider = "ollama"
```

2. **Run Ollama on your own server**

```toml
[ai.ollama]
base_url = "http://my-server:11434"
```

3. **Avoid cloud providers** for sensitive code

## API Key Management

### Environment Variables

Set in your shell:

```bash
# Claude
export ANTHROPIC_API_KEY="sk-ant-..."

# OpenAI
export OPENAI_API_KEY="sk-..."

# Gemini
export GOOGLE_API_KEY="..."
```

### `.env` File

Create `.env` in your project:

```bash
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

Load with `python-dotenv`:

```python
from dotenv import load_dotenv
load_dotenv()
```

### Secrets Manager

Use a secrets manager for production:

```bash
# AWS Secrets Manager
aws secretsmanager get-secret-value --secret-id anthropic-api-key

# 1Password CLI
op read "op://dev/anthropic/api-key"
```
