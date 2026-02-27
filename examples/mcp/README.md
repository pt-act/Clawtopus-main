# Browser Vision MCP Examples

> Working examples and configurations for the Browser Vision MCP Server

## Files

### `claude_desktop_config.json`

Claude Desktop configuration to enable browser automation:

```json
{
  "mcpServers": {
    "clawtopus-browser": {
      "command": "npx",
      "args": ["clawtopus", "mcp-browser"],
      "env": {
        "MCP_AUTH_TOKEN": "your-secure-token-here",
        "CLAWTOPUS_BROWSER_PROFILE": "default"
      }
    }
  }
}
```

**Setup:**

1. Copy to your Claude Desktop config location:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. Replace `your-secure-token-here` with a secure token
3. Restart Claude Desktop

### `sample-prompts.md`

Example prompts demonstrating all 8 browser tools:

- **Basic Navigation** - Navigate and screenshot
- **Form Interaction** - Fill forms and submit
- **Accessibility** - Get page snapshots
- **Data Extraction** - Scrape content
- **E-commerce** - Product search
- **Testing** - Visual regression
- **Research** - Extract information
- **Complex Workflows** - Multi-step tasks

## Quick Start

### 1. Install Clawtopus

```bash
npm install -g clawtopus
```

### 2. Configure Claude Desktop

Copy the example config:

```bash
# macOS
cp claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Generate a secure token
openssl rand -hex 32

# Edit config and add your token
```

### 3. Test the Setup

In Claude Desktop, try:

```
Navigate to example.com and take a screenshot
```

## Example Workflow

### Research Task

```
1. Navigate to arxiv.org
2. Search for "machine learning"
3. Open the first paper
4. Extract the abstract
5. Summarize the key findings
```

### Form Testing

```
1. Navigate to the login page
2. Try logging in with invalid credentials
3. Capture the error message
4. Try with valid credentials
5. Verify successful login
```

### E-commerce

```
1. Go to an online store
2. Search for a product
3. Filter by price range
4. Sort by rating
5. Take screenshots of top 3 products
```

## Troubleshooting

See the [Claude Desktop Setup Guide](../../docs/mcp/claude-desktop-setup.md) for troubleshooting.

## More Documentation

- [Tool Reference](../../docs/mcp/tool-reference.md) - Complete API docs
- [Configuration](../../docs/mcp/configuration.md) - Server config options
- [Security](../../docs/mcp/security.md) - Security best practices
