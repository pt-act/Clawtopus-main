# AI Provider Guide

Voyager supports multiple AI providers, giving you the flexibility to choose the best model for your workflow, budget, and requirements.

## Supported Providers

| Provider         | Models               | Context | Best For                       | Cost   | Status    |
| ---------------- | -------------------- | ------- | ------------------------------ | ------ | --------- |
| **Claude**       | Sonnet, Opus, Haiku  | 200K    | Best overall quality, coding   | $$$    | ✅ Stable |
| **OpenAI**       | GPT-4, GPT-3.5       | 128K    | General purpose, widely tested | $$$    | ✅ Stable |
| **Gemini**       | 1.5 Pro, Flash, Pro  | 2M      | Large context, multimodal      | $      | ✅ Stable |
| **Cohere**       | Command R+, R        | 128K    | RAG, code generation           | $$     | ✅ Stable |
| **Ollama**       | Llama, Mistral, etc. | Varies  | Local, privacy, free           | Free   | ✅ Stable |
| **OpenRouter**   | 50+ models           | Varies  | Multiple models, one API       | Varies | ✅ Stable |
| **Azure OpenAI** | GPT-4, GPT-3.5       | 128K    | Enterprise, compliance         | $$$    | ✅ Stable |
| **Together AI**  | 50+ open models      | Varies  | Open models, fast inference    | $$     | ✅ Stable |
| **Fireworks AI** | Llama, Mixtral, etc. | Varies  | Fast inference, open models    | $$     | ✅ Stable |

---

## Quick Start

### 1. Choose a Provider

```bash
voyager config set ai.provider <provider-name>
```

Available provider names:

- `claude` - Anthropic Claude
- `openai` - OpenAI GPT models
- `gemini` - Google Gemini
- `cohere` - Cohere Command models
- `ollama` - Local Ollama models
- `openrouter` - OpenRouter (50+ models)
- `azure-openai` - Azure OpenAI
- `together` - Together AI
- `fireworks` - Fireworks AI

### 2. Configure API Key

```bash
voyager config set ai.<provider>.api_key "your-api-key"
```

Or set environment variable:

```bash
export ANTHROPIC_API_KEY="your-key"  # For Claude
export OPENAI_API_KEY="your-key"     # For OpenAI
export GEMINI_API_KEY="your-key"     # For Gemini
export COHERE_API_KEY="your-key"     # For Cohere
# etc.
```

### 3. Select Model

```bash
voyager config set ai.<provider>.model "model-name"
```

---

## Provider Details

### Claude (Anthropic)

**Best for:** Overall code quality, complex reasoning, following instructions precisely

#### Models

| Model                        | Context | Best For                  | Cost (Input/Output)       |
| ---------------------------- | ------- | ------------------------- | ------------------------- |
| `claude-3-5-sonnet-20241022` | 200K    | Best balance, recommended | $3/$15 per 1M tokens      |
| `claude-3-opus-20240229`     | 200K    | Maximum quality           | $15/$75 per 1M tokens     |
| `claude-3-haiku-20240307`    | 200K    | Fast, cost-effective      | $0.25/$1.25 per 1M tokens |

#### Configuration

```toml
[ai]
provider = "claude"

[ai.claude]
model = "claude-3-5-sonnet-20241022"
api_key = "your-anthropic-api-key"
temperature = 0.7
max_tokens = 4096
timeout_seconds = 60
```

#### Installation

```bash
pip install "voyager-agent[claude]"  # Or just voyager-agent
voyager config set ai.provider claude
voyager config set ai.claude.api_key "sk-ant-..."
```

#### Example

```bash
voyager config set ai.provider claude
voyager config set ai.claude.model "claude-3-5-sonnet-20241022"
voyager session start
```

**Documentation:** See [examples/with-claude/README.md](examples/with-claude/README.md) (if available)

---

### OpenAI

**Best for:** General purpose, wide model selection, proven track record

#### Models

| Model                 | Context | Best For         | Cost (Input/Output)       |
| --------------------- | ------- | ---------------- | ------------------------- |
| `gpt-4-turbo-preview` | 128K    | Best quality     | $10/$30 per 1M tokens     |
| `gpt-4`               | 8K      | Balanced quality | $30/$60 per 1M tokens     |
| `gpt-3.5-turbo`       | 16K     | Fast, economical | $0.50/$1.50 per 1M tokens |

#### Configuration

```toml
[ai]
provider = "openai"

[ai.openai]
model = "gpt-4-turbo-preview"
api_key = "your-openai-api-key"
temperature = 0.7
max_tokens = 4096
timeout_seconds = 60
```

#### Installation

```bash
pip install "voyager-agent[openai]"
voyager config set ai.provider openai
voyager config set ai.openai.api_key "sk-..."
```

#### Example

```bash
voyager config set ai.provider openai
voyager config set ai.openai.model "gpt-4-turbo-preview"
voyager session start
```

**Documentation:** See [examples/with-openai/README.md](examples/with-openai/README.md)

---

### Google Gemini

**Best for:** Large context windows (2M tokens), long documents, codebase analysis

#### Models

| Model              | Context   | Best For                         | Cost (Input/Output)              |
| ------------------ | --------- | -------------------------------- | -------------------------------- |
| `gemini-1.5-pro`   | 2M tokens | Complex reasoning, large context | $0.00125/$0.005 per 1K chars     |
| `gemini-1.5-flash` | 1M tokens | Fast responses, cost-effective   | $0.0001875/$0.00075 per 1K chars |
| `gemini-pro`       | 32K       | General purpose, free tier       | Free tier available              |

#### Configuration

```toml
[ai]
provider = "gemini"

[ai.gemini]
model = "gemini-1.5-pro"
api_key = "your-google-api-key"
temperature = 0.7
max_tokens = 2048
timeout_seconds = 60
```

#### Installation

```bash
pip install "voyager-agent[gemini]"
voyager config set ai.provider gemini
voyager config set ai.gemini.api_key "AIza..."
```

#### Features

- **Huge context:** Up to 2M tokens (gemini-1.5-pro)
- **Multimodal:** Can understand code and structured data
- **Free tier:** Generous free tier for testing

#### Example

```bash
voyager config set ai.provider gemini
voyager config set ai.gemini.model "gemini-1.5-pro"
voyager session start
```

**Documentation:** See [examples/providers/gemini_example.md](examples/providers/gemini_example.md)

---

### Cohere

**Best for:** RAG applications, code generation, large context

#### Models

| Model            | Context | Best For          | Cost (Input/Output)       |
| ---------------- | ------- | ----------------- | ------------------------- |
| `command-r-plus` | 128K    | Best quality, RAG | $3/$15 per 1M tokens      |
| `command-r`      | 128K    | Balanced          | $0.50/$1.50 per 1M tokens |
| `command`        | 4K      | Fast responses    | $1/$2 per 1M tokens       |
| `command-light`  | 4K      | High throughput   | $0.30/$0.60 per 1M tokens |

#### Configuration

```toml
[ai]
provider = "cohere"

[ai.cohere]
model = "command-r-plus"
api_key = "your-cohere-api-key"
temperature = 0.7
max_tokens = 2048
timeout_seconds = 60
```

#### Installation

```bash
pip install "voyager-agent[cohere]"
voyager config set ai.provider cohere
voyager config set ai.cohere.api_key "..."
```

#### Features

- **RAG optimized:** Excellent for retrieval-augmented generation
- **Chat history:** Built-in conversation tracking
- **Large context:** 128K tokens for Command R models
- **Free tier:** Available for development

#### Example

```bash
voyager config set ai.provider cohere
voyager config set ai.cohere.model "command-r-plus"
voyager session start
```

**Documentation:** See [examples/providers/cohere_example.md](examples/providers/cohere_example.md)

---

### Ollama (Local)

**Best for:** Privacy, offline work, free usage, experimentation

#### Models

Run any Ollama-compatible model locally:

- `llama2`, `llama3`
- `codellama`
- `mistral`, `mixtral`
- `deepseek-coder`
- `qwen`
- And many more...

#### Configuration

```toml
[ai]
provider = "ollama"

[ai.ollama]
model = "codellama"
base_url = "http://localhost:11434"
timeout_seconds = 120
```

#### Installation

1. Install Ollama: https://ollama.ai/
2. Pull a model: `ollama pull codellama`
3. Configure Voyager:

```bash
pip install "voyager-agent[ollama]"
voyager config set ai.provider ollama
voyager config set ai.ollama.model "codellama"
```

#### Features

- **Completely free:** No API costs
- **Private:** All processing happens locally
- **Offline:** Works without internet
- **Customizable:** Use any Ollama model

#### Example

```bash
# Start Ollama
ollama serve

# Pull a model
ollama pull codellama

# Configure Voyager
voyager config set ai.provider ollama
voyager config set ai.ollama.model "codellama"
voyager session start
```

**Documentation:** See [examples/with-ollama/README.md](examples/with-ollama/README.md)

---

### OpenRouter

**Best for:** Access to 50+ models through one API, model comparison

#### Available Models

OpenRouter provides access to:

- Claude 3 Opus, Sonnet, Haiku
- GPT-4, GPT-3.5
- Llama 2, Llama 3
- Mistral, Mixtral
- Gemini Pro
- And 40+ more models

#### Configuration

```toml
[ai]
provider = "openrouter"

[ai.openrouter]
model = "anthropic/claude-3-5-sonnet"
api_key = "your-openrouter-api-key"
temperature = 0.7
timeout_seconds = 60
```

#### Installation

```bash
pip install "voyager-agent[openrouter]"
voyager config set ai.provider openrouter
voyager config set ai.openrouter.api_key "sk-or-..."
```

#### Features

- **One API:** Access 50+ models with one API key
- **Fallbacks:** Automatic fallback to other models
- **Credits:** Pay-as-you-go with credits
- **Free models:** Some models available for free

#### Example

```bash
voyager config set ai.provider openrouter
voyager config set ai.openrouter.model "anthropic/claude-3-5-sonnet"
voyager session start
```

**Documentation:** See [examples/with-openrouter/README.md](examples/with-openrouter/README.md)

---

### Azure OpenAI

**Best for:** Enterprise deployments, compliance, existing Azure infrastructure

#### Configuration

```toml
[ai]
provider = "azure-openai"

[ai.azure-openai]
model = "gpt-4"
api_key = "your-azure-api-key"
azure_endpoint = "https://your-resource.openai.azure.com/"
api_version = "2024-02-01"
deployment_name = "your-deployment-name"
timeout_seconds = 60
```

#### Installation

```bash
pip install "voyager-agent[azure-openai]"
voyager config set ai.provider azure-openai
voyager config set ai.azure-openai.api_key "..."
voyager config set ai.azure-openai.azure_endpoint "https://..."
```

#### Features

- **Enterprise ready:** SLA, compliance, security
- **Regional deployment:** Data residency control
- **Integration:** Works with Azure ecosystem
- **Same models:** Same GPT models as OpenAI

**Documentation:** See [examples/with-openai-compatible/README.md](examples/with-openai-compatible/README.md)

---

### Together AI

**Best for:** Open models, fast inference, cost-effective

#### Available Models

- Llama 2, Llama 3
- Mistral, Mixtral
- CodeLlama
- Qwen
- And more...

#### Configuration

```toml
[ai]
provider = "together"

[ai.together]
model = "meta-llama/Llama-3-70b-chat-hf"
api_key = "your-together-api-key"
base_url = "https://api.together.xyz/v1"
timeout_seconds = 60
```

#### Installation

```bash
pip install "voyager-agent[together]"
voyager config set ai.provider together
voyager config set ai.together.api_key "..."
```

**Documentation:** See [examples/with-openai-compatible/README.md](examples/with-openai-compatible/README.md)

---

### Fireworks AI

**Best for:** Fast inference, open models, function calling

#### Available Models

- Llama 2, Llama 3
- Mistral, Mixtral
- Qwen
- Function-calling models

#### Configuration

```toml
[ai]
provider = "fireworks"

[ai.fireworks]
model = "accounts/fireworks/models/llama-v3-70b-instruct"
api_key = "your-fireworks-api-key"
base_url = "https://api.fireworks.ai/inference/v1"
timeout_seconds = 60
```

#### Installation

```bash
pip install "voyager-agent[fireworks]"
voyager config set ai.provider fireworks
voyager config set ai.fireworks.api_key "..."
```

**Documentation:** See [examples/with-openai-compatible/README.md](examples/with-openai-compatible/README.md)

---

## Choosing a Provider

### By Use Case

| Use Case                    | Recommended Provider           | Why                                             |
| --------------------------- | ------------------------------ | ----------------------------------------------- |
| **Best overall quality**    | Claude 3.5 Sonnet              | Superior code generation, instruction following |
| **Large codebase analysis** | Gemini 1.5 Pro                 | 2M token context window                         |
| **Cost-effective**          | Ollama (local) or Gemini Flash | Free or very low cost                           |
| **Privacy/offline**         | Ollama                         | All processing local                            |
| **Enterprise**              | Azure OpenAI                   | SLA, compliance, security                       |
| **RAG applications**        | Cohere Command R+              | Optimized for retrieval                         |
| **Experimentation**         | OpenRouter                     | Access to 50+ models                            |
| **Fast inference**          | Together AI or Fireworks       | Optimized infrastructure                        |

### By Budget

| Budget                  | Provider                              | Monthly Cost Estimate\* |
| ----------------------- | ------------------------------------- | ----------------------- |
| **Free**                | Ollama, Gemini (free tier)            | $0                      |
| **Low ($5-20/mo)**      | Gemini Flash, GPT-3.5, Cohere Command | $5-20                   |
| **Medium ($20-100/mo)** | Claude Sonnet, GPT-4, Command R+      | $20-100                 |
| **High ($100+/mo)**     | Claude Opus, GPT-4 (heavy use)        | $100+                   |

\*Estimates based on typical Voyager usage (sessions, brain updates, skill searches)

### By Context Window

| Context Needed                | Provider                       | Context Size               |
| ----------------------------- | ------------------------------ | -------------------------- |
| **Small (< 10K tokens)**      | Any                            | All providers support this |
| **Medium (10-50K tokens)**    | Claude, OpenAI, Gemini, Cohere | All work well              |
| **Large (50-200K tokens)**    | Claude, Cohere, Gemini         | Recommended                |
| **Very Large (200K+ tokens)** | Gemini 1.5 Pro                 | Up to 2M tokens            |

---

## Configuration Guide

### Environment Variables

All providers support environment variables for API keys:

```bash
export ANTHROPIC_API_KEY="..."     # Claude
export OPENAI_API_KEY="..."        # OpenAI
export GEMINI_API_KEY="..."        # Gemini
export COHERE_API_KEY="..."        # Cohere
export OPENROUTER_API_KEY="..."    # OpenRouter
export AZURE_OPENAI_API_KEY="..."  # Azure OpenAI
export TOGETHER_API_KEY="..."      # Together AI
export FIREWORKS_API_KEY="..."     # Fireworks AI
```

### Configuration File

Edit `~/.config/voyager/config.toml`:

```toml
[ai]
provider = "claude"  # Default provider

[ai.claude]
model = "claude-3-5-sonnet-20241022"
api_key = "sk-ant-..."
temperature = 0.7
max_tokens = 4096

[ai.openai]
model = "gpt-4-turbo-preview"
api_key = "sk-..."

[ai.gemini]
model = "gemini-1.5-pro"
api_key = "AIza..."

# Add configurations for all providers you use
```

### Switching Providers

```bash
# Switch provider
voyager config set ai.provider gemini

# Or use environment variable
export VOYAGER_PROVIDER="gemini"
```

---

## Advanced Configuration

### Temperature Control

Control creativity vs determinism:

```toml
# More deterministic (good for code generation)
temperature = 0.2

# Balanced
temperature = 0.7

# More creative (good for brainstorming)
temperature = 0.9
```

### Token Limits

```toml
# Limit response length
max_tokens = 2048  # Shorter responses

max_tokens = 4096  # Default

max_tokens = 8192  # Longer, more detailed responses
```

### Timeouts

```toml
# Adjust for slow responses or complex queries
timeout_seconds = 30   # Short timeout
timeout_seconds = 60   # Default
timeout_seconds = 120  # Long timeout
```

---

## Cost Optimization

### Tips for Reducing Costs

1. **Use appropriate models:**
   - Claude Haiku for simple tasks
   - Gemini Flash for quick responses
   - GPT-3.5 for basic queries

2. **Limit context:**

   ```bash
   # Clear brain regularly
   voyager brain clear
   ```

3. **Use local models:**

   ```bash
   # Ollama is completely free
   voyager config set ai.provider ollama
   ```

4. **Set token limits:**

   ```toml
   max_tokens = 1024  # Shorter responses = lower cost
   ```

5. **Monitor usage:**
   - Check provider dashboards regularly
   - Set up billing alerts

---

## Troubleshooting

### "API key not found"

```bash
# Set via config
voyager config set ai.<provider>.api_key "your-key"

# Or via environment
export ANTHROPIC_API_KEY="your-key"
```

### "Rate limit exceeded"

- Wait and retry
- Implement exponential backoff
- Upgrade your provider plan
- Switch to a provider with higher limits

### "Model not found"

```bash
# Verify model name is correct
voyager config show

# Check provider documentation for valid model names
```

### "Timeout errors"

```toml
# Increase timeout
[ai.<provider>]
timeout_seconds = 120
```

---

## Provider Comparison Matrix

| Feature           | Claude     | OpenAI     | Gemini     | Cohere   | Ollama     |
| ----------------- | ---------- | ---------- | ---------- | -------- | ---------- |
| **Code Quality**  | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | ⭐⭐⭐⭐   | ⭐⭐⭐⭐ | ⭐⭐⭐     |
| **Speed**         | ⭐⭐⭐⭐   | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐     |
| **Cost**          | ⭐⭐       | ⭐⭐       | ⭐⭐⭐⭐   | ⭐⭐⭐   | ⭐⭐⭐⭐⭐ |
| **Context**       | ⭐⭐⭐⭐   | ⭐⭐⭐     | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐     |
| **Privacy**       | ⭐⭐       | ⭐⭐       | ⭐⭐       | ⭐⭐     | ⭐⭐⭐⭐⭐ |
| **Ease of Setup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | ⭐⭐⭐⭐ | ⭐⭐⭐     |

---

## Resources

- [API Key Management](docs/API_KEYS.md) (if available)
- [Configuration Guide](docs/CONFIGURATION.md) (if available)
- [Provider Examples](examples/providers/)
- [GitHub Issues](https://github.com/infinity-vs/code-voyager/issues)

---

**Note:** Provider availability, pricing, and features are subject to change. Check provider documentation for the most up-to-date information.
