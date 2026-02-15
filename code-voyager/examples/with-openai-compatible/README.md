# Using Voyager with OpenAI-Compatible APIs

Many AI providers implement the OpenAI Chat Completions API format. This provider lets you use any of them with Code Voyager!

## Compatible Services

### Cloud Providers

- ✅ **Azure OpenAI** - Microsoft's enterprise AI service
- ✅ **Together AI** - Fast, affordable AI inference
- ✅ **Fireworks AI** - Ultra-fast model serving
- ✅ **Anyscale Endpoints** - Ray-powered AI serving
- ✅ **Perplexity AI** - Search-augmented AI
- ✅ **Replicate** - Run models via API
- ✅ **Deep Infra** - Affordable AI infrastructure
- ✅ **Novita AI** - GPU cloud for AI
- ✅ **Many more!**

### Self-Hosted Solutions

- ✅ **LocalAI** - Self-hosted OpenAI alternative
- ✅ **LM Studio** - Run models on your machine
- ✅ **Text Generation WebUI (oobabooga)** - Popular UI with API
- ✅ **vLLM** - Fast LLM inference server
- ✅ **Fastchat** - Training and serving framework

## Setup

### Install Voyager

```bash
uv tool install "git+https://github.com/infinity-vs/code-voyager.git[openai-compatible]"
```

### Choose Your Provider

Pick one from below based on your needs:

## Provider Guides

### Together AI (Recommended for Cloud)

**Why Together AI?**

- ✅ Great model selection (Llama, Mixtral, DeepSeek, etc.)
- ✅ Competitive pricing
- ✅ Fast inference
- ✅ Easy setup

**Setup:**

1. Get API key from [together.ai](https://together.ai/)

2. Set environment variable:

```bash
export TOGETHER_API_KEY="..."
```

3. Configure Voyager:

```toml
[ai.openai_compatible]
base_url = "https://api.together.xyz/v1"
model = "mistralai/Mixtral-8x7B-Instruct-v0.1"
api_key_env = "TOGETHER_API_KEY"
```

**Popular Models:**

- `mistralai/Mixtral-8x7B-Instruct-v0.1` - Great quality/cost
- `meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo` - Best quality
- `meta-llama/Llama-3-8b-chat-hf` - Fast and cheap
- `deepseek-ai/deepseek-coder-33b-instruct` - Code-focused
- See all: https://docs.together.ai/docs/inference-models

**Cost:** ~$0.20-$0.90 per million tokens (depending on model)

---

### Fireworks AI

**Why Fireworks?**

- ✅ Fastest inference available
- ✅ Good model selection
- ✅ Serverless GPU

**Setup:**

1. Get API key from [fireworks.ai](https://fireworks.ai/)

2. Set environment variable:

```bash
export FIREWORKS_API_KEY="..."
```

3. Configure Voyager:

```toml
[ai.openai_compatible]
base_url = "https://api.fireworks.ai/inference/v1"
model = "accounts/fireworks/models/llama-v3p1-70b-instruct"
api_key_env = "FIREWORKS_API_KEY"
```

**Popular Models:**

- `accounts/fireworks/models/llama-v3p1-70b-instruct` - Best quality
- `accounts/fireworks/models/mixtral-8x7b-instruct` - Fast, cheap
- See all: https://fireworks.ai/models

**Cost:** ~$0.20-$0.90 per million tokens

---

### Azure OpenAI (Enterprise)

**Why Azure OpenAI?**

- ✅ Enterprise SLAs
- ✅ Data residency options
- ✅ Integration with Azure services
- ✅ Compliance certifications

**Setup:**

1. Create Azure OpenAI resource in Azure Portal

2. Deploy a model (e.g., GPT-4)

3. Get endpoint and API key

4. Set environment variable:

```bash
export AZURE_OPENAI_API_KEY="..."
```

5. Configure Voyager:

```toml
[ai.openai_compatible]
base_url = "https://YOUR_RESOURCE.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT"
model = "gpt-4"  # Your deployment name
api_key_env = "AZURE_OPENAI_API_KEY"
```

**Replace:**

- `YOUR_RESOURCE` - Your Azure OpenAI resource name
- `YOUR_DEPLOYMENT` - Your deployment name

**Available Models:**

- GPT-4, GPT-4 Turbo
- GPT-3.5 Turbo
- See: https://learn.microsoft.com/azure/ai-services/openai/

**Cost:** Standard Azure OpenAI pricing

---

### LocalAI (Self-Hosted, Free)

**Why LocalAI?**

- ✅ Completely free
- ✅ Private - data never leaves your machine
- ✅ Offline capable
- ✅ OpenAI-compatible API

**Setup:**

1. Install LocalAI:

```bash
# Using Docker
docker run -p 8080:8080 --name localai -ti localai/localai:latest
```

2. Download a model:

```bash
curl http://localhost:8080/models/apply -H "Content-Type: application/json" -d '{
  "id": "model-gallery@llama-3-8b"
}'
```

3. Configure Voyager (no API key needed):

```toml
[ai.openai_compatible]
base_url = "http://localhost:8080/v1"
model = "llama-3-8b"
# No api_key_env needed for local
```

**Popular Models:**

- `llama-3-8b` - Fast, good quality
- `mistral-7b` - Great balance
- `codellama-7b` - Code-focused
- See all: https://localai.io/models/

**Cost:** Free (hardware only)

---

### Anyscale Endpoints

**Why Anyscale?**

- ✅ Ray-powered infrastructure
- ✅ Good model selection
- ✅ Competitive pricing

**Setup:**

1. Get API key from [anyscale.com](https://www.anyscale.com/)

2. Set environment variable:

```bash
export ANYSCALE_API_KEY="..."
```

3. Configure Voyager:

```toml
[ai.openai_compatible]
base_url = "https://api.endpoints.anyscale.com/v1"
model = "meta-llama/Llama-3-70b-chat-hf"
api_key_env = "ANYSCALE_API_KEY"
```

**Cost:** Pay-per-use pricing

---

### LM Studio (Local GUI)

**Why LM Studio?**

- ✅ Beautiful GUI for model management
- ✅ Run models locally
- ✅ Free and private
- ✅ Easy model downloads

**Setup:**

1. Download and install [LM Studio](https://lmstudio.ai/)

2. Download a model in the UI

3. Start the local server (in LM Studio):
   - Go to "Local Server" tab
   - Click "Start Server"
   - Note the port (usually 1234)

4. Configure Voyager:

```toml
[ai.openai_compatible]
base_url = "http://localhost:1234/v1"
model = "model-name"  # Use the model name from LM Studio
```

**Cost:** Free

---

## Usage

Once configured, all commands work normally:

```bash
# Start session
voyager session start

# Update brain
voyager brain update

# Propose skills
voyager factory propose

# End session
voyager session end
```

## Configuration Options

### Temperature

Control randomness (0.0 = deterministic, 1.0 = creative):

```toml
[ai.openai_compatible]
temperature = 0.7  # Default
```

### Max Tokens

Limit response length to save costs:

```toml
[ai.openai_compatible]
max_tokens = 2000
```

### Timeout

Increase for slow providers or large requests:

```toml
[ai.openai_compatible]
timeout_seconds = 120
```

## Provider Comparison

| Provider         | Best For       | Cost | Setup  | Privacy |
| ---------------- | -------------- | ---- | ------ | ------- |
| **Together AI**  | Cloud, variety | $    | Easy   | Low     |
| **Fireworks**    | Speed          | $    | Easy   | Low     |
| **Azure OpenAI** | Enterprise     | $$$  | Medium | Medium  |
| **LocalAI**      | Privacy, free  | Free | Medium | High    |
| **LM Studio**    | Local GUI      | Free | Easy   | High    |
| **Anyscale**     | Ray users      | $$   | Easy   | Low     |

## Troubleshooting

### "Connection refused"

**For local servers (LocalAI, LM Studio):**

```bash
# Check if server is running
curl http://localhost:8080/v1/models  # LocalAI
curl http://localhost:1234/v1/models  # LM Studio
```

**Solution:** Start the server first.

### "API key not found"

**Solution:** Set the environment variable:

```bash
export TOGETHER_API_KEY="..."  # or your provider's key
```

### "Model not found"

**Solution:** Check available models:

**Together AI:**

```bash
curl https://api.together.xyz/v1/models \
  -H "Authorization: Bearer $TOGETHER_API_KEY"
```

**LocalAI:**

```bash
curl http://localhost:8080/v1/models
```

### Slow responses

**Solutions:**

1. Use faster models (smaller size)
2. Increase timeout: `timeout_seconds = 180`
3. For local: Use GPU acceleration
4. For cloud: Try a different provider

## Advanced Configuration

### Multiple Providers

Configure multiple providers and switch between them:

```toml
[ai.openai_compatible]
base_url = "https://api.together.xyz/v1"
model = "mistralai/Mixtral-8x7B-Instruct-v0.1"

[ai.openai_compatible_local]
base_url = "http://localhost:8080/v1"
model = "llama-3-8b"
```

Then use:

```bash
# Cloud
voyager brain update --provider openai_compatible

# Local
voyager brain update --provider openai_compatible_local
```

### Custom Headers

Some providers need custom headers. Add to the config:

```toml
[ai.openai_compatible]
# Custom headers not yet supported
# Coming soon!
```

## Cost Optimization

### Strategy 1: Use Local for Development

```toml
# Development (local, free)
ai_provider = "openai_compatible"
base_url = "http://localhost:8080/v1"

# Production (cloud, paid)
# Switch config for production use
```

### Strategy 2: Choose Right Model Size

- **Simple tasks**: 7B-8B models
- **Medium complexity**: 13B-34B models
- **Complex tasks**: 70B+ models

### Strategy 3: Limit Max Tokens

```toml
max_tokens = 1000  # Shorter responses = lower cost
```

## Best Practices

### 1. Start Local (LocalAI or LM Studio)

Test your workflow for free before paying for cloud.

### 2. Match Provider to Use Case

- **Enterprise**: Azure OpenAI
- **Cost-sensitive**: Together AI or LocalAI
- **Speed-critical**: Fireworks AI
- **Privacy**: LocalAI or LM Studio

### 3. Monitor Costs

Most providers have dashboards:

- Together AI: https://api.together.xyz/dashboard
- Fireworks: https://fireworks.ai/account
- Azure: Azure Portal

### 4. Use Appropriate Models

- **Code tasks**: CodeLlama, DeepSeek Coder
- **General**: Llama 3.1, Mixtral
- **Fast responses**: Smaller models (7B-13B)

## Resources

### Together AI

- Website: https://together.ai/
- Docs: https://docs.together.ai/
- Models: https://docs.together.ai/docs/inference-models

### Fireworks AI

- Website: https://fireworks.ai/
- Docs: https://docs.fireworks.ai/
- Models: https://fireworks.ai/models

### Azure OpenAI

- Docs: https://learn.microsoft.com/azure/ai-services/openai/
- Portal: https://portal.azure.com/

### LocalAI

- GitHub: https://github.com/mudler/LocalAI
- Docs: https://localai.io/
- Models: https://localai.io/models/

### LM Studio

- Website: https://lmstudio.ai/
- Discord: https://discord.gg/lmstudio

## Summary

OpenAI-compatible provider is ideal when you:

✅ **Want flexibility** to choose from many providers  
✅ **Need enterprise features** (Azure OpenAI)  
✅ **Want local/private** inference (LocalAI, LM Studio)  
✅ **Optimize costs** with alternative providers  
✅ **Need specific models** not available elsewhere

The OpenAI-compatible API format is becoming the standard, giving you the most options!
