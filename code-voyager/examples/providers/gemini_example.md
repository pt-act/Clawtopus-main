# Google Gemini Provider - Example Usage

This example demonstrates how to use Voyager with Google's Gemini AI models.

## Installation

Install the required dependency:

```bash
pip install "voyager-agent[gemini]"
```

Or install manually:

```bash
pip install google-generativeai>=0.3.0
```

## Configuration

### 1. Get API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Configure Voyager

Edit your configuration file (`~/.config/voyager/config.toml`):

```toml
[ai]
provider = "gemini"

[ai.gemini]
model = "gemini-1.5-pro"
api_key = "your-google-api-key-here"
temperature = 0.7
timeout_seconds = 60
```

Or set via environment variable:

```bash
export GEMINI_API_KEY="your-google-api-key-here"
```

Or use the CLI:

```bash
voyager config set ai.provider gemini
voyager config set ai.gemini.api_key "your-api-key"
voyager config set ai.gemini.model "gemini-1.5-pro"
```

## Available Models

Gemini supports several models:

| Model              | Description          | Context Window | Best For                          |
| ------------------ | -------------------- | -------------- | --------------------------------- |
| `gemini-1.5-pro`   | Most capable model   | 2M tokens      | Complex reasoning, long documents |
| `gemini-1.5-flash` | Fast and efficient   | 1M tokens      | Quick responses, rapid iteration  |
| `gemini-pro`       | Balanced performance | 32K tokens     | General purpose tasks             |

### Model Selection

```toml
[ai.gemini]
model = "gemini-1.5-pro"  # Default: Best quality
# model = "gemini-1.5-flash"  # Faster, lower cost
# model = "gemini-pro"  # Balanced
```

## Usage Examples

### Basic Session

```bash
# Start a session with Gemini
voyager config set ai.provider gemini
voyager session start

# Update brain with context
voyager brain update --context "Working on API integration"

# Search for relevant skills
voyager skills search --query "error handling patterns"
```

### Python API Usage

```python
from voyager.adapters.ai import GeminiProvider
from voyager.adapters.ai.base import AIRequest

# Initialize provider
provider = GeminiProvider()

# Create a request
request = AIRequest(
    prompt="Explain the concept of async/await in Python",
    system_prompt="You are a helpful coding assistant",
    temperature=0.7,
    max_tokens=1000
)

# Get response
response = provider.call(request)

if response.success:
    print(response.output)
else:
    print(f"Error: {response.error_message}")
```

### Advanced Configuration

```toml
[ai.gemini]
model = "gemini-1.5-pro"
api_key = "your-api-key"

# Adjust creativity (0.0 = deterministic, 1.0 = creative)
temperature = 0.7

# Maximum tokens in response
max_tokens = 2048

# Request timeout in seconds
timeout_seconds = 60

# Safety settings (BLOCK_NONE, BLOCK_ONLY_HIGH, BLOCK_MEDIUM_AND_ABOVE, BLOCK_LOW_AND_ABOVE)
safety_settings = {
    "HARM_CATEGORY_HARASSMENT" = "BLOCK_ONLY_HIGH",
    "HARM_CATEGORY_HATE_SPEECH" = "BLOCK_ONLY_HIGH",
    "HARM_CATEGORY_SEXUALLY_EXPLICIT" = "BLOCK_ONLY_HIGH",
    "HARM_CATEGORY_DANGEROUS_CONTENT" = "BLOCK_ONLY_HIGH"
}
```

## Features

### Long Context Support

Gemini 1.5 Pro supports up to 2 million tokens of context:

```bash
# Process large codebases
voyager brain update --file large_file.py
voyager brain update --file another_file.py
# Gemini can handle very large context windows
```

### Multimodal Capabilities

Gemini supports text, code, and can understand structured data:

```python
request = AIRequest(
    prompt="""
    Analyze this JSON API response and suggest improvements:

    {
        "users": [
            {"id": 1, "name": "Alice"},
            {"id": 2, "name": "Bob"}
        ]
    }
    """,
    system_prompt="You are an API design expert"
)

response = provider.call(request)
```

### Code Generation

Gemini excels at code generation and explanation:

```bash
# Update brain with coding task
voyager brain update --context "Need to implement OAuth2 authentication"

# Search for OAuth patterns
voyager skills search --query "OAuth implementation"

# Let Gemini generate code based on context
voyager brain update --context "Generate OAuth2 client class in Python"
```

## Best Practices

### 1. Model Selection

- **Use gemini-1.5-pro** for:
  - Complex reasoning tasks
  - Large codebase analysis
  - Detailed explanations
  - High-quality code generation

- **Use gemini-1.5-flash** for:
  - Quick responses
  - Simple queries
  - Rapid iteration
  - Cost optimization

### 2. Temperature Settings

```toml
# For code generation (more deterministic)
temperature = 0.2

# For creative solutions (more varied)
temperature = 0.8

# Balanced (default)
temperature = 0.7
```

### 3. Context Management

```bash
# Clear brain before switching tasks
voyager brain clear

# Start new session for new task
voyager session end
voyager session start
```

### 4. Error Handling

```python
from voyager.adapters.ai import GeminiProvider
from voyager.adapters.ai.base import AIRequest

provider = GeminiProvider()

try:
    response = provider.call(request)

    if response.success:
        print(response.output)
    else:
        print(f"Error: {response.error_message}")

        # Check for specific errors
        if "quota" in response.error_message.lower():
            print("Quota exceeded. Check your API limits.")
        elif "api key" in response.error_message.lower():
            print("Invalid API key. Check configuration.")

except Exception as e:
    print(f"Unexpected error: {e}")
```

## Pricing

Gemini pricing (as of Dec 2024):

| Model            | Input               | Output              | Context    |
| ---------------- | ------------------- | ------------------- | ---------- |
| Gemini 1.5 Pro   | $0.00125/1K chars   | $0.005/1K chars     | 2M tokens  |
| Gemini 1.5 Flash | $0.0001875/1K chars | $0.00075/1K chars   | 1M tokens  |
| Gemini Pro       | Free tier available | Free tier available | 32K tokens |

Check [Google AI Pricing](https://ai.google.dev/pricing) for latest rates.

## Troubleshooting

### "API key not found"

```bash
# Set API key
export GEMINI_API_KEY="your-api-key"

# Or in config
voyager config set ai.gemini.api_key "your-api-key"
```

### "Quota exceeded"

- Check your usage at [Google AI Studio](https://makersuite.google.com/)
- Consider using gemini-1.5-flash for cost savings
- Implement rate limiting in your application

### "Model not found"

Ensure you're using a valid model name:

```toml
[ai.gemini]
model = "gemini-1.5-pro"  # Correct
# model = "gemini-1.5"  # Wrong - too vague
```

### Timeout Issues

Increase timeout for complex queries:

```toml
[ai.gemini]
timeout_seconds = 120  # Increase from default 60
```

## Integration Examples

### VS Code Extension

The VS Code extension automatically supports Gemini:

1. Install extension
2. Configure Gemini in Voyager config
3. Use sidebar to interact with Voyager

### Emacs Package

```elisp
;; Configure Gemini in voyager.el
(setq voyager-provider "gemini")

;; Use normal Voyager commands
M-x voyager-session-start
M-x voyager-brain-update
```

### Sublime Text Plugin

```
Tools → Voyager → Select AI Provider → gemini

Or:
Ctrl+Alt+V, Ctrl+Alt+P → Select "gemini"
```

## Resources

- [Google AI Documentation](https://ai.google.dev/docs)
- [Gemini API Reference](https://ai.google.dev/api)
- [Google AI Studio](https://makersuite.google.com/)
- [Voyager GitHub](https://github.com/infinity-vs/code-voyager)

## Example Workflow

Complete example of using Voyager with Gemini:

```bash
# 1. Configure Gemini
voyager config set ai.provider gemini
voyager config set ai.gemini.api_key "your-api-key"
voyager config set ai.gemini.model "gemini-1.5-pro"

# 2. Start session
voyager session start

# 3. Update brain with project context
voyager brain update --context "Building a REST API with FastAPI"

# 4. Add useful code patterns as skills
voyager skills add --name "fastapi-endpoint" --file examples/api.py

# 5. Search for patterns when needed
voyager skills search --query "async database operations"

# 6. Update brain with specific tasks
voyager brain update --context "Need to implement JWT authentication"

# 7. View brain state to see accumulated context
voyager brain show

# 8. End session when done
voyager session end
```

---

**Note:** Gemini is a powerful model with excellent code understanding capabilities. The large context window (2M tokens for 1.5 Pro) makes it ideal for working with large codebases.
