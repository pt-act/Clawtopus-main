# Browser Vision MCP Server

> Expose Clawtopus browser automation and vision capabilities via Model Context Protocol (MCP)

## Overview

The Browser Vision MCP Server enables any MCP-compatible agent (Claude Desktop, Cline, etc.) to control browsers through a standardized protocol. It provides 8 core browser tools for navigation, screenshot capture, interaction, and session management.

## Features

- **8 Browser Tools**: Navigate, screenshot, click, fill, snapshot, scroll, evaluate, close
- **Vision-Optimized Screenshots**: Auto-compressed JPEG with accessibility tree context
- **Session Management**: Named sessions with timeout and isolation
- **Security**: URL allowlists, script sandboxing, and audit logging
- **MCP 1.0 Compliant**: Full protocol compatibility

## Quick Start

### 1. Install Clawtopus

```bash
npm install -g clawtopus
```

### 2. Configure Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["clawtopus", "mcp-browser"]
    }
  }
}
```

### 3. Start Using

In Claude Desktop:

```
Navigate to example.com and take a screenshot
```

## Tools Reference

| Tool                                                        | Description                     |
| ----------------------------------------------------------- | ------------------------------- |
| [`browser.navigate`](tool-reference.md#browsernavigate)     | Navigate to URL with validation |
| [`browser.screenshot`](tool-reference.md#browserscreenshot) | Capture optimized screenshots   |
| [`browser.click`](tool-reference.md#browserclick)           | Click elements on page          |
| [`browser.fill`](tool-reference.md#browserfill)             | Fill input fields               |
| [`browser.snapshot`](tool-reference.md#browsersnapshot)     | Get accessibility tree          |
| [`browser.scroll`](tool-reference.md#browserscroll)         | Scroll page                     |
| [`browser.evaluate`](tool-reference.md#browserevaluate)     | Execute JavaScript (sandboxed)  |
| [`browser.close`](tool-reference.md#browserclose)           | Close browser sessions          |

## Documentation

- [Claude Desktop Setup](claude-desktop-setup.md) - Step-by-step configuration
- [Tool Reference](tool-reference.md) - Complete API documentation
- [Configuration](configuration.md) - Server configuration options
- [Security](security.md) - Security best practices

## Architecture

```
┌─────────────────┐      MCP Protocol       ┌──────────────────┐
│  MCP Client     │  ◄──────────────────►   │  Browser Vision  │
│  (Claude Desktop│    JSON-RPC 2.0         │  MCP Server      │
│   / Cline)      │                         │                  │
└─────────────────┘                         └────────┬─────────┘
                                                     │
                          ┌────────────────────────┼────────────────────────┐
                          │                        │                        │
                          ▼                        ▼                        ▼
                   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
                   │   Session   │         │   Security  │         │   Browser   │
                   │   Manager   │         │   Layer     │         │   Tools     │
                   └─────────────┘         └─────────────┘         └─────────────┘
```

## Requirements

- Node.js 18+
- Chrome/Chromium browser
- MCP-compatible client

## License

MIT - See LICENSE for details
