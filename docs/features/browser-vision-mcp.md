# Browser Vision MCP Server

The Browser Vision MCP Server exposes Clawtopus's browser automation capabilities via the Model Context Protocol (MCP), enabling any MCP-compatible agent to control browsers, take screenshots, and perform web automation tasks.

## Overview

Clawtopus includes a powerful browser automation system (`src/browser/`) that can:

- Navigate websites programmatically
- Take screenshots optimized for vision models
- Click, fill forms, scroll, and interact with pages
- Execute JavaScript in browser context
- Share browser sessions across multiple agents

The MCP server makes these capabilities available to external agents like Claude Desktop, Cline, or any MCP-compatible tool.

## Capabilities

### Core Browser Tools

The MCP server exposes 8 browser automation tools:

| Tool                 | Description                 | Use Case                                      |
| -------------------- | --------------------------- | --------------------------------------------- |
| `browser_navigate`   | Navigate to URL             | Open websites for testing or data extraction  |
| `browser_screenshot` | Capture page screenshot     | Visual verification, documentation, debugging |
| `browser_click`      | Click on element            | Interact with buttons, links, forms           |
| `browser_fill`       | Fill form fields            | Automate form submission, data entry          |
| `browser_snapshot`   | Get page accessibility tree | Structured page analysis for agents           |
| `browser_scroll`     | Scroll page                 | Navigate long pages, lazy-loaded content      |
| `browser_evaluate`   | Execute JavaScript          | Custom automation, data extraction            |
| `browser_close`      | Close browser session       | Cleanup, resource management                  |

### Vision-Optimized Screenshots

Screenshots are automatically optimized for vision models:

- **Compression**: Auto-compressed to < 5MB JPEG
- **Dimensions**: Capped at 2000px (configurable)
- **Quality**: 85% → 35% fallback if still too large
- **Accessibility**: Includes accessibility tree as text context
- **Element-specific**: Can screenshot specific elements

### Multi-Agent Session Sharing

Multiple AI agents can share browser sessions:

- **Named sessions**: Persist across agent restarts
- **Session isolation**: Each session isolated by default
- **Shared sessions**: Optional shared sessions via configuration
- **Timeout**: Sessions expire after 30min inactivity
- **Concurrent limits**: Enforced to prevent resource exhaustion

## Usage

### Starting the MCP Server

```bash
# Start the browser MCP server
clawtopus mcp browser --port 3000 --token YOUR_TOKEN

# With custom configuration
clawtopus mcp browser \
  --port 3000 \
  --token YOUR_TOKEN \
  --max-sessions 10 \
  --session-timeout 1800
```

### Connecting from Claude Desktop

Add to Claude Desktop configuration:

```json
{
  "mcpServers": {
    "clawtopus-browser": {
      "command": "clawtopus",
      "args": ["mcp", "browser", "--port", "3000"],
      "env": {
        "CLAWTOPUS_TOKEN": "YOUR_TOKEN"
      }
    }
  }
}
```

### Example Workflows

**Web Testing:**

```
Agent: Navigate to https://example.com
Agent: Take screenshot of login form
Agent: Fill username field with "test@example.com"
Agent: Fill password field
Agent: Click login button
Agent: Verify dashboard loaded
```

**Data Extraction:**

```
Agent: Navigate to product page
Agent: Execute JavaScript to extract prices
Agent: Scroll through pagination
Agent: Collect all product data
Agent: Export to structured format
```

**Visual Verification:**

```
Agent: Navigate to deployed app
Agent: Screenshot homepage
Agent: Verify layout matches design spec
Agent: Check responsive breakpoints
```

## Configuration

### Environment Variables

| Variable                  | Description               | Default    |
| ------------------------- | ------------------------- | ---------- |
| `BROWSER_HEADLESS`        | Run browser headless      | `true`     |
| `BROWSER_VIEWPORT`        | Default viewport size     | `1280x720` |
| `SCREENSHOT_QUALITY`      | JPEG quality (1-100)      | `85`       |
| `SCREENSHOT_MAX_SIZE`     | Max dimension in px       | `2000`     |
| `SESSION_TIMEOUT`         | Session timeout (seconds) | `1800`     |
| `MAX_CONCURRENT_SESSIONS` | Max concurrent browsers   | `10`       |

### Security

- **Token-based authentication** required for all connections
- **Session isolation** prevents cross-session data leakage
- **Resource limits** prevent denial of service
- **Sandboxed execution** for JavaScript evaluation
- **Audit logging** of all browser actions

## Architecture

```
MCP Client (Claude/Cline)
           │ MCP Protocol
           ▼
   BrowserMCP Server
           │
           ▼
   Clawtopus Browser Core
           │
           ▼
   Playwright/CDP Browser
```

**Code Location**: `src/mcp/browser-mcp-server.ts`

## Integration with QuantumReef

When using Clawtopus + QuantumReef ecosystem:

1. **Clawtopus PM** plans browser automation tasks
2. **QuantumReef** executes browser domain tasks
3. **Browser MCP** exposes capabilities to external agents
4. **All coordinated** via WebSocket with shared context

## Consciousness Alignment

**Score**: 8.5/10

- **Glass-box transparency**: All browser actions logged and auditable
- **Truth over theater**: Actual browser automation, not simulation
- **Consciousness expansion**: Extends agent capabilities into web environment
- **Elegant systems**: Reuses existing infrastructure, no duplication

## Roadmap

- [ ] Video recording of browser sessions
- [ ] Mobile viewport emulation
- [ ] Network request interception
- [ ] Cookie and storage management
- [ ] PDF generation from pages

## See Also

- [MCP Specification](https://modelcontextprotocol.io)
- [Browser Automation Guide](./browser-automation.md)
- [Vision Model Optimization](./vision-optimization.md)
