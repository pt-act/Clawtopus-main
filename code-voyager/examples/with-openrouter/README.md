# Using Voyager with OpenRouter

OpenRouter provides unified access to dozens of AI models from multiple providers through a single API. Perfect for accessing the latest models without managing multiple API keys!

## What is OpenRouter?

[OpenRouter](https://openrouter.ai/) is a unified API that gives you access to:

- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Sonnet
- **OpenAI**: GPT-4 Turbo, GPT-4, GPT-3.5 Turbo
- **Google**: Gemini Pro, PaLM 2
- **Meta**: Llama 3.1 (70B, 8B), Llama 2
- **Mistral**: Mixtral 8x7B, Mistral 7B
- **And many more**: Cohere, AI21, Anthropic, etc.

## Benefits

### Single API Key

- ✅ One API key for all providers
- ✅ No need to manage multiple accounts
- ✅ Simplified billing

### Automatic Fallbacks

- ✅ If one provider is down, automatically tries alternatives
- ✅ Better reliability than single-provider

### Cost Tracking

- ✅ Unified dashboard for all AI spending
- ✅ Per-model cost breakdown
- ✅ Usage analytics

### Latest Models

- ✅ Access new models as soon as they're released
- ✅ No waiting for SDK updates
- ✅ Easy model switching

## Setup

### 1. Get an OpenRouter API Key

1. Visit [openrouter.ai](https://openrouter.ai/)
2. Sign up for a free account
3. Go to [Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Copy the key (starts with `sk-or-...`)

### 2. Install Voyager

```bash
# Install with OpenRouter support
uv tool install "git+https://github.com/infinity-vs/code-voyager.git[openrouter]"

# Or if already installed:
pip install httpx
```

### 3. Configure API Key

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
```

Add to your shell profile (`.bashrc`, `.zshrc`, etc.):

```bash
echo 'export OPENROUTER_API_KEY="sk-or-v1-..."' >> ~/.bashrc
```

### 4. Setup Voyager

```bash
cd your-project
mkdir -p .voyager
cp voyager.toml .voyager/config.toml
```

Edit `.voyager/config.toml` and choose your model (see below).

## Model Selection

### Best for Code: Claude 3.5 Sonnet (Recommended)

```toml
[ai.openrouter]
model = "anthropic/claude-3.5-sonnet"
```

**Pros:**

- ✅ Best code understanding
- ✅ Excellent at refactoring
- ✅ Great skill generation
- ✅ Long context window (200K tokens)

**Cost:** ~$3/million input tokens

### Best for Speed: GPT-3.5 Turbo

```toml
[ai.openrouter]
model = "openai/gpt-3.5-turbo"
```

**Pros:**

- ✅ Very fast responses
- ✅ Cheapest option
- ✅ Good for simple tasks

**Cost:** ~$0.50/million input tokens

### Best Balance: GPT-4 Turbo

```toml
[ai.openrouter]
model = "openai/gpt-4-turbo-preview"
```

**Pros:**

- ✅ Good quality
- ✅ Faster than GPT-4
- ✅ Lower cost than Claude

**Cost:** ~$10/million input tokens

### Best for Privacy-Conscious: Llama 3.1 70B

```toml
[ai.openrouter]
model = "meta-llama/llama-3.1-70b-instruct"
```

**Pros:**

- ✅ Open source model
- ✅ Good quality
- ✅ Reasonable cost

**Cost:** ~$0.88/million input tokens

### All Available Models

See the full list at: https://openrouter.ai/models

Popular choices:

- `anthropic/claude-3.5-sonnet` - Best for code
- `openai/gpt-4-turbo-preview` - Balanced quality/cost
- `openai/gpt-3.5-turbo` - Cheapest
- `google/gemini-pro` - Google's latest
- `meta-llama/llama-3.1-70b-instruct` - Open source
- `mistralai/mixtral-8x7b-instruct` - Fast and cheap

## Usage

All commands work the same as with other providers:

```bash
# Start session
voyager session start

# Work on code...

# Update brain
voyager brain update

# Create skills
voyager factory propose

# End session
voyager session end
```

## Cost Optimization

### Strategy 1: Use Cheaper Models for Simple Tasks

```bash
# Quick brain updates (use cheap model)
voyager brain update --provider openrouter --model openai/gpt-3.5-turbo

# Complex skill generation (use best model)
voyager factory propose --provider openrouter --model anthropic/claude-3.5-sonnet
```

### Strategy 2: Set Budget Limits

OpenRouter lets you set spending limits:

1. Go to [Settings](https://openrouter.ai/settings)
2. Set a monthly budget limit
3. Get notified when approaching limit

### Strategy 3: Monitor Usage

Track your usage in the OpenRouter dashboard:

1. Go to [Activity](https://openrouter.ai/activity)
2. See per-model costs
3. Identify expensive operations
4. Optimize accordingly

## Features

### Automatic Fallbacks

If your primary model is unavailable, OpenRouter can automatically try alternatives:

```toml
[ai.openrouter]
model = "anthropic/claude-3.5-sonnet"

# OpenRouter will automatically fallback if Claude is down
```

### Rate Limit Management

OpenRouter manages rate limits across providers, so you don't hit limits.

### Cost Tracking

Every request includes cost information in the response metadata:

```python
# Cost is automatically tracked in response
response.metadata["cost_usd"]  # Actual cost in USD
```

## Comparison with Direct Providers

| Feature       | OpenRouter           | Direct (Claude/OpenAI) |
| ------------- | -------------------- | ---------------------- |
| API Keys      | 1                    | Multiple               |
| Model Access  | 50+ models           | 1 provider's models    |
| Fallbacks     | ✅ Automatic         | ❌ Manual              |
| Cost Tracking | ✅ Unified           | ❌ Per-provider        |
| Setup         | Easy                 | Medium                 |
| Cost          | Slight markup (~10%) | Direct pricing         |
| Reliability   | High (fallbacks)     | Medium                 |

## Advanced Configuration

### Custom Site URL

Help OpenRouter improve by adding your site:

```toml
[ai.openrouter]
site_url = "https://your-project.com"
app_name = "YourProjectName"
```

This helps with:

- Model ranking algorithms
- Usage analytics
- Community features

### Temperature Control

Adjust creativity vs. consistency:

```toml
[ai.openrouter]
temperature = 0.7  # Default (balanced)
# temperature = 0.0  # More deterministic
# temperature = 1.0  # More creative
```

### Max Tokens

Limit response length to save costs:

```toml
[ai.openrouter]
max_tokens = 2000  # Limit response length
```

## Troubleshooting

### "OPENROUTER_API_KEY not set"

**Solution:**

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
```

### "Model not found"

**Solution:** Check the model name at https://openrouter.ai/models

Make sure format is: `provider/model-name`

Examples:

- ✅ `anthropic/claude-3.5-sonnet`
- ✅ `openai/gpt-4-turbo-preview`
- ❌ `claude-3.5-sonnet` (missing provider)
- ❌ `gpt-4` (missing provider)

### Rate Limit Errors

**Solution:** OpenRouter handles rate limits automatically, but you can:

1. Increase timeout: `timeout_seconds = 120`
2. Try a different model
3. Check your account limits

### High Costs

**Solution:**

1. Check usage at https://openrouter.ai/activity
2. Switch to cheaper models for simple tasks
3. Set budget limits in settings
4. Use `max_tokens` to limit response length

## Example Workflow

### Multi-Model Approach

Use different models for different tasks:

```toml
# .voyager/config.toml
[voyager]
ai_provider = "openrouter"

[ai.openrouter]
# Default to cheap model
model = "openai/gpt-3.5-turbo"
```

Then override per command:

```bash
# Quick brain updates (cheap)
voyager brain update

# Complex skill generation (best quality)
voyager factory propose --model anthropic/claude-3.5-sonnet

# Medium complexity (balanced)
voyager curriculum plan --model openai/gpt-4-turbo-preview
```

## Best Practices

### 1. Start with Claude 3.5 Sonnet

Best overall experience for code:

```toml
model = "anthropic/claude-3.5-sonnet"
```

### 2. Monitor Costs

Check dashboard weekly:

- https://openrouter.ai/activity

### 3. Use Fallbacks

Let OpenRouter handle failures automatically - don't manually switch models.

### 4. Set Budget Limits

Prevent surprise bills:

- https://openrouter.ai/settings

### 5. Optimize for Your Workflow

- Simple questions → GPT-3.5 Turbo
- Code tasks → Claude 3.5 Sonnet
- Quick iterations → GPT-4 Turbo
- Privacy-sensitive → Llama 3.1

## Resources

- **Website**: https://openrouter.ai/
- **Models**: https://openrouter.ai/models
- **Docs**: https://openrouter.ai/docs
- **Discord**: https://discord.gg/openrouter
- **Pricing**: https://openrouter.ai/models (per-model)

## Summary

OpenRouter is ideal when you want:

✅ **Access to multiple models** without managing multiple API keys  
✅ **Automatic fallbacks** for better reliability  
✅ **Unified cost tracking** across all providers  
✅ **Latest models** as soon as they're released  
✅ **Flexibility** to switch models based on task complexity

The slight cost markup (~10%) is worth it for the convenience and reliability!
