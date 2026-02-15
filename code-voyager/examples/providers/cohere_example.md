# Cohere Provider - Example Usage

This example demonstrates how to use Voyager with Cohere's AI models, including the powerful Command R+ and Command R models.

## Installation

Install the required dependency:

```bash
pip install "voyager-agent[cohere]"
```

Or install manually:

```bash
pip install cohere>=4.0.0
```

## Configuration

### 1. Get API Key

1. Visit [Cohere Dashboard](https://dashboard.cohere.com/)
2. Sign up or sign in
3. Go to API Keys section
4. Create or copy your API key

### 2. Configure Voyager

Edit your configuration file (`~/.config/voyager/config.toml`):

```toml
[ai]
provider = "cohere"

[ai.cohere]
model = "command-r-plus"
api_key = "your-cohere-api-key-here"
temperature = 0.7
timeout_seconds = 60
```

Or set via environment variable:

```bash
export COHERE_API_KEY="your-cohere-api-key-here"
```

Or use the CLI:

```bash
voyager config set ai.provider cohere
voyager config set ai.cohere.api_key "your-api-key"
voyager config set ai.cohere.model "command-r-plus"
```

## Available Models

Cohere offers several models optimized for different use cases:

| Model            | Description          | Context Window | Best For                                |
| ---------------- | -------------------- | -------------- | --------------------------------------- |
| `command-r-plus` | Most capable model   | 128K tokens    | Complex reasoning, code generation, RAG |
| `command-r`      | Balanced performance | 128K tokens    | General purpose, good speed/quality     |
| `command`        | Fast responses       | 4K tokens      | Simple queries, quick responses         |
| `command-light`  | Lightweight          | 4K tokens      | High throughput, simple tasks           |

### Model Selection

```toml
[ai.cohere]
model = "command-r-plus"  # Default: Best quality
# model = "command-r"  # Good balance
# model = "command"  # Faster
# model = "command-light"  # Fastest, simple tasks
```

## Usage Examples

### Basic Session

```bash
# Start a session with Cohere
voyager config set ai.provider cohere
voyager session start

# Update brain with context
voyager brain update --context "Working on microservices architecture"

# Search for relevant skills
voyager skills search --query "service communication patterns"
```

### Python API Usage

```python
from voyager.adapters.ai import CohereProvider
from voyager.adapters.ai.base import AIRequest

# Initialize provider
provider = CohereProvider()

# Create a request
request = AIRequest(
    prompt="Explain the difference between REST and GraphQL APIs",
    system_prompt="You are an expert software architect",
    temperature=0.7,
    max_tokens=1500
)

# Get response
response = provider.call(request)

if response.success:
    print(response.output)

    # Access Cohere-specific metadata
    if hasattr(response, 'metadata'):
        print(f"Tokens used: {response.metadata.get('tokens', 'N/A')}")
else:
    print(f"Error: {response.error_message}")
```

### Advanced Configuration

```toml
[ai.cohere]
model = "command-r-plus"
api_key = "your-api-key"

# Adjust creativity (0.0 = deterministic, 1.0 = creative)
temperature = 0.7

# Maximum tokens in response
max_tokens = 2048

# Request timeout in seconds
timeout_seconds = 60

# Top-k sampling (1-500)
top_k = 250

# Top-p (nucleus) sampling (0.0-1.0)
top_p = 0.95

# Presence penalty (-2.0 to 2.0)
presence_penalty = 0.0

# Frequency penalty (-2.0 to 2.0)
frequency_penalty = 0.0
```

## Features

### RAG (Retrieval Augmented Generation)

Cohere models excel at RAG applications. Voyager's skill system leverages this:

```bash
# Add skills to knowledge base
voyager skills add --name "auth-pattern" --file auth.py
voyager skills add --name "db-pattern" --file database.py

# Skills are automatically retrieved when relevant
voyager brain update --context "Need to implement user authentication"

# Cohere will use retrieved skills as context
```

### Chat History

Cohere maintains conversation history automatically:

```python
from voyager.adapters.ai import CohereProvider
from voyager.adapters.ai.base import AIRequest

provider = CohereProvider()

# First message
request1 = AIRequest(
    prompt="What is dependency injection?",
    system_prompt="You are a coding mentor"
)
response1 = provider.call(request1)

# Follow-up (Cohere remembers context)
request2 = AIRequest(
    prompt="Show me an example in Python",
    system_prompt="You are a coding mentor"
)
response2 = provider.call(request2)
```

### Code Generation

Cohere Command R+ is excellent for code generation:

```bash
# Update brain with coding task
voyager brain update --context "Need to implement a caching decorator in Python"

# Search for similar patterns
voyager skills search --query "decorator patterns"

# Get code suggestions with context
voyager brain update --context "Generate a Redis-based caching decorator"
```

### Multi-turn Conversations

```python
from voyager.core.session import Session

# Start session
session = Session()
session.start()

# Multiple interactions maintain context
session.brain.update("I'm building a web scraper")
session.brain.update("It needs to handle rate limiting")
session.brain.update("And parse HTML tables")

# Cohere maintains full conversation context
```

## Best Practices

### 1. Model Selection

- **Use command-r-plus** for:
  - Complex code generation
  - Multi-step reasoning
  - RAG applications
  - Detailed explanations
  - Large context needs

- **Use command-r** for:
  - General purpose coding tasks
  - Good balance of speed and quality
  - Most common use cases

- **Use command/command-light** for:
  - Simple queries
  - High throughput needs
  - Cost optimization
  - Quick responses

### 2. Temperature Settings

```toml
# For code generation (more deterministic)
temperature = 0.3

# For brainstorming (more creative)
temperature = 0.9

# Balanced (default)
temperature = 0.7
```

### 3. Context Window Optimization

Command R/R+ support 128K token context:

```bash
# You can include large amounts of context
voyager brain update --file large_codebase.py
voyager brain update --file another_large_file.py
# Cohere can handle substantial context
```

### 4. Error Handling

```python
from voyager.adapters.ai import CohereProvider
from voyager.adapters.ai.base import AIRequest
import time

provider = CohereProvider()

def call_with_retry(request, max_retries=3):
    """Call Cohere with exponential backoff retry."""
    for attempt in range(max_retries):
        try:
            response = provider.call(request)

            if response.success:
                return response
            else:
                print(f"Attempt {attempt + 1} failed: {response.error_message}")

                # Check for rate limiting
                if "rate limit" in response.error_message.lower():
                    wait_time = 2 ** attempt  # Exponential backoff
                    print(f"Rate limited. Waiting {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                else:
                    break

        except Exception as e:
            print(f"Unexpected error: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)

    return None

# Usage
response = call_with_retry(request)
if response:
    print(response.output)
```

## Pricing

Cohere pricing (as of Dec 2024):

| Model         | Input           | Output           | Context     |
| ------------- | --------------- | ---------------- | ----------- |
| Command R+    | $3.00/1M tokens | $15.00/1M tokens | 128K tokens |
| Command R     | $0.50/1M tokens | $1.50/1M tokens  | 128K tokens |
| Command       | $1.00/1M tokens | $2.00/1M tokens  | 4K tokens   |
| Command Light | $0.30/1M tokens | $0.60/1M tokens  | 4K tokens   |

**Free Tier:** Cohere offers a trial API key with generous limits for development.

Check [Cohere Pricing](https://cohere.com/pricing) for latest rates.

## Troubleshooting

### "API key not found"

```bash
# Set API key
export COHERE_API_KEY="your-api-key"

# Or in config
voyager config set ai.cohere.api_key "your-api-key"

# Verify configuration
voyager config show
```

### "Rate limit exceeded"

```python
# Implement exponential backoff (see example above)
# Or reduce request frequency

# Check rate limits in dashboard
# Upgrade plan if needed
```

### "Invalid model name"

Ensure you're using a valid model:

```toml
[ai.cohere]
model = "command-r-plus"  # Correct
# model = "command-r-2"  # Wrong - doesn't exist
```

### Connection Timeout

Increase timeout for long responses:

```toml
[ai.cohere]
timeout_seconds = 120  # Increase from default 60
```

### Token Limit Exceeded

```bash
# For large contexts, use command-r-plus or command-r (128K context)
voyager config set ai.cohere.model "command-r-plus"

# Or reduce context size
voyager brain clear
```

## Integration Examples

### VS Code Extension

The VS Code extension automatically supports Cohere:

1. Install extension
2. Configure Cohere in Voyager config
3. Select Cohere as provider
4. Use sidebar to interact

### Emacs Package

```elisp
;; Set Cohere as provider
M-x voyager-config-set
Provider: cohere
Model: command-r-plus

;; Use normal Voyager commands
M-x voyager-session-start
M-x voyager-brain-update
```

### Sublime Text Plugin

```
Tools → Voyager → Select AI Provider → cohere

Or:
Ctrl+Alt+V, Ctrl+Alt+P → Select "cohere"
```

## Advanced Features

### Grounded Generation

Cohere supports grounded generation (citations):

```python
from voyager.adapters.ai import CohereProvider
from voyager.adapters.ai.base import AIRequest

provider = CohereProvider()

request = AIRequest(
    prompt="Explain async programming in Python",
    system_prompt="You are a technical writer",
    # Cohere can provide citations to sources
)

response = provider.call(request)

# Access citations if available
if hasattr(response, 'metadata') and 'citations' in response.metadata:
    print("Citations:", response.metadata['citations'])
```

### Custom Connectors

Integrate with Cohere's web search connectors:

```toml
[ai.cohere]
model = "command-r-plus"
connectors = ["web-search"]  # Enable web search
```

### Streaming Responses

For long-running queries, use streaming:

```python
# Note: Streaming support may require additional implementation
# Check Voyager documentation for streaming support
```

## Example Workflow

Complete example of using Voyager with Cohere:

```bash
# 1. Configure Cohere
voyager config set ai.provider cohere
voyager config set ai.cohere.api_key "your-api-key"
voyager config set ai.cohere.model "command-r-plus"

# 2. Start session
voyager session start

# 3. Update brain with project context
voyager brain update --context "Building a real-time chat application with WebSockets"

# 4. Add useful patterns as skills
voyager skills add --name "websocket-handler" --file ws_handler.py
voyager skills add --name "message-queue" --file queue.py

# 5. Search for patterns when needed
voyager skills search --query "WebSocket connection management"

# 6. Update brain with specific implementation needs
voyager brain update --context "Need to implement reconnection logic with exponential backoff"

# 7. View brain state (Cohere maintains all context)
voyager brain show

# 8. Continue iterating
voyager brain update --context "Also need to handle message ordering"

# 9. End session when done
voyager session end
```

## Resources

- [Cohere Documentation](https://docs.cohere.com/)
- [Cohere API Reference](https://docs.cohere.com/reference/about)
- [Cohere Dashboard](https://dashboard.cohere.com/)
- [Cohere Playground](https://dashboard.cohere.com/playground)
- [Voyager GitHub](https://github.com/infinity-vs/code-voyager)

## Comparison with Other Providers

| Feature         | Cohere      | Claude       | OpenAI       | Gemini      |
| --------------- | ----------- | ------------ | ------------ | ----------- |
| Context Window  | 128K        | 200K         | 128K         | 2M          |
| RAG Optimized   | ✅ Yes      | ⚠️ Partial   | ⚠️ Partial   | ✅ Yes      |
| Chat History    | ✅ Built-in | ✅ Built-in  | ✅ Built-in  | ✅ Built-in |
| Code Generation | ✅ Strong   | ✅ Excellent | ✅ Excellent | ✅ Strong   |
| Price (Input)   | $0.50/1M    | $3.00/1M     | $2.50/1M     | $0.00125/1K |
| Free Tier       | ✅ Yes      | ❌ No        | ❌ Limited   | ✅ Yes      |

---

**Note:** Cohere Command R+ is particularly well-suited for RAG applications and code generation tasks. The large context window (128K tokens) and optimization for retrieval make it an excellent choice for Voyager's skill-based system.
