# Claude Desktop Setup Guide

> Configure Claude Desktop to use the Browser Vision MCP Server

## Prerequisites

1. **Clawtopus installed** globally or locally
2. **Claude Desktop** installed
3. **Chrome/Chromium** browser available

## Step 1: Find Claude Desktop Config Location

### macOS

```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

### Windows

```
%APPDATA%\Claude\claude_desktop_config.json
```

### Linux

```bash
~/.config/Claude/claude_desktop_config.json
```

## Step 2: Configure MCP Server

Add the browser MCP server to your configuration:

```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["clawtopus", "mcp-browser"],
      "env": {
        "MCP_AUTH_TOKEN": "your-token-here"
      }
    }
  }
}
```

### With Custom Configuration

```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["clawtopus", "mcp-browser", "--config", "/path/to/config.yaml"],
      "env": {
        "MCP_AUTH_TOKEN": "your-token-here",
        "CLAWTOPUS_MCP_CONFIG": "/path/to/config.yaml"
      }
    }
  }
}
```

## Step 3: Restart Claude Desktop

1. Fully quit Claude Desktop (Cmd+Q / Ctrl+Q)
2. Restart the application
3. Look for the 🔨 hammer icon in the chat interface

## Step 4: Verify Installation

Ask Claude:

```
What tools are available?
```

You should see the 8 browser tools listed:

- `browser.navigate`
- `browser.screenshot`
- `browser.click`
- `browser.fill`
- `browser.snapshot`
- `browser.scroll`
- `browser.evaluate`
- `browser.close`

## Step 5: Test Browser Automation

Try a simple command:

```
Navigate to example.com and take a screenshot
```

Claude should:

1. Use `browser.navigate` to load example.com
2. Use `browser.screenshot` to capture the page
3. Display the screenshot with analysis

## Configuration Options

### Security Settings

Create `~/.clawtopus/mcp-config.yaml`:

```yaml
mcp:
  browser:
    security:
      requireHttps: true
      blockPrivateIps: false
      urlAllowlist:
        - "*.example.com"
        - "localhost"
      blockedJsPatterns:
        - "eval\\s*\\("
        - "Function\\s*\\("

    sessions:
      maxConcurrent: 10
      timeoutMinutes: 30
      allowSharedSessions: false

    screenshot:
      maxWidth: 2000
      maxHeight: 2000
      maxBytes: 5242880
      quality: 85
```

### Authentication

Set environment variable:

```bash
export MCP_AUTH_TOKEN="your-secure-token"
```

Or in Claude Desktop config:

```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["clawtopus", "mcp-browser"],
      "env": {
        "MCP_AUTH_TOKEN": "your-secure-token"
      }
    }
  }
}
```

## Troubleshooting

### "Tool not found" error

**Problem**: MCP server not connected

**Solution**:

1. Check Claude Desktop config JSON syntax
2. Verify `clawtopus` is installed: `npm list -g clawtopus`
3. Restart Claude Desktop

### "Authentication failed" error

**Problem**: Auth token missing or invalid

**Solution**:

1. Set `MCP_AUTH_TOKEN` environment variable
2. Or disable auth in config: `auth: { mode: "none" }`

### Screenshots not displaying

**Problem**: Image size too large

**Solution**:

- Screenshots auto-compress to < 5MB
- Check `maxBytes` in screenshot config
- Use `fullPage: false` for smaller captures

### Browser not launching

**Problem**: Chrome not found

**Solution**:

1. Install Chrome/Chromium
2. Set `CHROME_PATH` environment variable
3. Or specify in config: `browserProfile: "default"`

## Advanced Usage

### Multiple Browser Profiles

```json
{
  "mcpServers": {
    "browser-work": {
      "command": "npx",
      "args": ["clawtopus", "mcp-browser"],
      "env": {
        "CLAWTOPUS_BROWSER_PROFILE": "work"
      }
    },
    "browser-personal": {
      "command": "npx",
      "args": ["clawtopus", "mcp-browser"],
      "env": {
        "CLAWTOPUS_BROWSER_PROFILE": "personal"
      }
    }
  }
}
```

### HTTP Transport (Advanced)

For remote connections:

```yaml
mcp:
  browser:
    transport:
      type: http
      port: 8081
      host: localhost
```

Then in Claude Desktop config:

```json
{
  "mcpServers": {
    "browser": {
      "url": "http://localhost:8081/mcp"
    }
  }
}
```

## Next Steps

- Read the [Tool Reference](tool-reference.md) for detailed API documentation
- Review [Security Best Practices](security.md)
- See [Example Prompts](../../examples/mcp/sample-prompts.md) for inspiration
