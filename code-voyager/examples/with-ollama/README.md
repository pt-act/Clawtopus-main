# Using Voyager with Ollama (Local LLMs)

This example shows how to use Code Voyager with Ollama to run completely local
language models. No API keys, no internet connection required, full privacy.

## Prerequisites

1. Install Ollama from https://ollama.ai/

2. Install Voyager:

```bash
uv tool install "git+https://github.com/zenbase-ai/code-voyager.git"
```

3. Install httpx for HTTP requests:

```bash
pip install httpx
```

## Setup

1. Pull your preferred model:

```bash
# For code tasks (recommended)
ollama pull codellama:34b

# Or Llama 3.1 for general tasks
ollama pull llama3.1:70b

# Or Mistral for balanced performance
ollama pull mistral:latest

# Or smaller models for faster responses
ollama pull codellama:7b
```

2. Start Ollama:

```bash
ollama serve
```

3. Copy the configuration to your project:

```bash
mkdir -p .voyager
cp voyager.toml .voyager/config.toml
```

4. Initialize Voyager:

```bash
voyager init
```

## Usage

All commands work the same:

```bash
# Start session
voyager session start

# Ask questions (uses local LLM)
voyager ask "What were we working on?"

# Update brain
voyager brain update

# Create skills
voyager factory propose

# End session
voyager session end
```

## Model Selection

Choose based on your hardware and needs:

### Code Llama 34B (Recommended for Code)

```toml
[ai.ollama]
model = "codellama:34b"
```

**Requirements**: 20GB+ RAM  
**Best for**: Code understanding, skill generation  
**Speed**: Moderate

### Llama 3.1 70B (Best Quality)

```toml
[ai.ollama]
model = "llama3.1:70b"
```

**Requirements**: 40GB+ RAM  
**Best for**: Complex reasoning, planning  
**Speed**: Slow

### Llama 3.1 8B (Fast & Lightweight)

```toml
[ai.ollama]
model = "llama3.1:8b"
```

**Requirements**: 8GB RAM  
**Best for**: Quick responses, simple tasks  
**Speed**: Fast

### Mistral 7B (Balanced)

```toml
[ai.ollama]
model = "mistral:latest"
```

**Requirements**: 8GB RAM  
**Best for**: General purpose, good balance  
**Speed**: Fast

### Code Llama 7B (Lightweight Code)

```toml
[ai.ollama]
model = "codellama:7b"
```

**Requirements**: 8GB RAM  
**Best for**: Code tasks on limited hardware  
**Speed**: Fast

## Performance Tips

### Speed Up Responses

1. **Use smaller models**: 7B models are 5-10x faster than 70B
2. **Increase timeout**: Local models may need more time

```toml
timeout_seconds = 180
```

3. **Use GPU**: Ollama automatically uses GPU if available
4. **Warm up the model**: First request is slower

```bash
ollama run codellama:7b "Hello"
```

### Improve Quality

1. **Use larger models**: 34B or 70B for best results
2. **Adjust temperature** (via model settings)
3. **Provide more context** in prompts

## Privacy Benefits

✅ **Complete Privacy**: All processing happens locally  
✅ **No API Keys**: No accounts or authentication needed  
✅ **Offline**: Works without internet connection  
✅ **No Logs**: Your code never leaves your machine  
✅ **Free**: No usage costs or token limits

## Limitations

⚠️ **Slower**: Local models are slower than API models  
⚠️ **Hardware**: Requires significant RAM for larger models  
⚠️ **Quality**: May not match GPT-4 or Claude for complex tasks  
⚠️ **No File Ops**: Ollama doesn't support direct file operations

## Hybrid Approach

You can use different providers for different tasks:

```bash
# Use Ollama for brain updates (privacy)
voyager brain update --provider ollama

# Use Claude for complex skill generation (quality)
voyager factory propose --provider claude
```

## Remote Ollama

You can also run Ollama on a remote server:

```toml
[ai.ollama]
base_url = "http://192.168.1.100:11434"
```

This allows you to:

- Use a powerful server for model inference
- Share models across your team
- Run Voyager on lightweight machines
