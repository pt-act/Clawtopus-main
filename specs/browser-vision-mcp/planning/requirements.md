# Browser Vision MCP Server - Planning Requirements

## Feature Intent

Create an **MCP (Model Context Protocol) server** that exposes Clawtopus's existing browser automation and vision capabilities as standardized tools. This allows any MCP-compatible agent to leverage Clawtopus's superior browser infrastructure without duplicating the 60+ file browser subsystem.

## Problem Statement

**Current State:**

- Clawtopus has extensive browser/vision capabilities in `src/browser/` (60+ files)
- These capabilities are only accessible via internal APIs or gateway endpoints
- External agents (like those using `agent-browser`) cannot leverage Clawtopus's browser power
- No standardized protocol for browser tool interoperability

**Desired State:**

- Clawtopus browser tools exposed via MCP protocol
- Any MCP-compatible agent can navigate, screenshot, and interact with browsers
- Vision models can receive optimized screenshots through standardized interface
- Reduced duplication - external agents don't need their own browser infrastructure

## User Stories

### Story 1: External Agent Developer

> As an AI agent developer, I want to use Clawtopus's browser capabilities via MCP, so that I don't need to maintain my own browser automation infrastructure.

**Acceptance Criteria:**

- MCP server provides `browser.navigate`, `browser.screenshot`, `browser.click` tools
- Tools follow MCP protocol specification
- Authentication ensures only authorized agents can control browsers

### Story 2: Vision Model Integration

> As a vision model user, I want to send screenshots to Claude/GPT-4V via MCP, so that I can analyze web pages visually.

**Acceptance Criteria:**

- Screenshots automatically optimized for vision models (JPEG, size limits)
- Image format matches model requirements
- Accessible description included for accessibility trees

### Story 3: Multi-Agent Coordination

> As a system administrator, I want multiple agents to share browser sessions via MCP, so that agents can collaborate on web tasks.

**Acceptance Criteria:**

- Session isolation between different agent contexts
- Shared sessions possible when explicitly configured
- Session persistence across agent restarts

## Specific Requirements

### R1: MCP Protocol Compliance

- Follow Model Context Protocol 1.0 specification
- Implement `tools/list` endpoint
- Implement `tools/call` endpoint with proper error handling
- Support async tool execution with progress notifications

### R2: Browser Tools

Expose these tools via MCP:

| Tool                 | Purpose                | Parameters                                       |
| -------------------- | ---------------------- | ------------------------------------------------ |
| `browser.navigate`   | Navigate to URL        | `url: string`, `waitUntil?: string`              |
| `browser.screenshot` | Capture screenshot     | `selector?: string`, `fullPage?: boolean`        |
| `browser.click`      | Click element          | `selector: string`, `options?: object`           |
| `browser.fill`       | Fill input field       | `selector: string`, `value: string`              |
| `browser.snapshot`   | Get accessibility tree | `selector?: string`, `interactiveOnly?: boolean` |
| `browser.scroll`     | Scroll page            | `direction: string`, `pixels?: number`           |
| `browser.evaluate`   | Execute JavaScript     | `script: string`                                 |
| `browser.close`      | Close browser session  | `sessionId?: string`                             |

### R3: Vision Model Optimization

- Screenshots auto-optimized to < 5MB JPEG
- Max dimensions 2000px (configurable)
- Quality compression for vision model compatibility
- Include accessibility tree as text context

### R4: Session Management

- Session isolation per MCP client
- Named sessions for persistence
- Session timeout after 30 minutes inactivity
- Concurrent session limits (configurable)

### R5: Security & Authentication

- Token-based authentication for MCP connections
- Path allowlist for URL navigation
- JavaScript execution sandboxed
- Screenshot permissions per domain

### R6: Integration with Clawtopus

- Reuse existing `src/browser/` infrastructure
- Leverage `browser.control-service.ts` for HTTP layer
- Use existing screenshot normalization
- Integrate with gateway authentication

## Visual Design (Architecture)

```
┌────────────────────────────────────────────────────────────────┐
│                     MCP CLIENT AGENT                           │
│  (Claude Desktop, Cline, custom agent, etc.)                   │
└────────────┬───────────────────────────────────────────────────┘
             │ MCP Protocol (stdio or HTTP/SSE)
             │
             ▼
┌────────────────────────────────────────────────────────────────┐
│                  CLAWTOPUS MCP SERVER                          │
│                    (New Component)                             │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ MCP Protocol │  │   Session    │  │   Security   │         │
│  │   Handler    │  │   Manager    │  │    Layer     │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                 │                  │
│         └─────────────────┼─────────────────┘                  │
│                           ▼                                    │
│              ┌────────────────────────┐                       │
│              │   Browser Tool Router  │                       │
│              └───────────┬────────────┘                       │
│                          │                                    │
└──────────────────────────┼────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   CDP/Chrome │  │  Playwright  │  │   Gateway    │
│   (Existing) │  │   (Existing) │  │   (Existing) │
└──────────────┘  └──────────────┘  └──────────────┘
```

## MCP Tool Schema Examples

### browser.navigate

```json
{
  "name": "browser.navigate",
  "description": "Navigate browser to specified URL",
  "inputSchema": {
    "type": "object",
    "properties": {
      "url": { "type": "string", "format": "uri" },
      "waitUntil": {
        "type": "string",
        "enum": ["load", "domcontentloaded", "networkidle"],
        "default": "networkidle"
      }
    },
    "required": ["url"]
  }
}
```

### browser.screenshot

```json
{
  "name": "browser.screenshot",
  "description": "Capture screenshot optimized for vision models",
  "inputSchema": {
    "type": "object",
    "properties": {
      "selector": { "type": "string", "description": "CSS selector for element" },
      "fullPage": { "type": "boolean", "default": false }
    }
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "imageUrl": { "type": "string" },
      "mimeType": { "type": "string" },
      "width": { "type": "number" },
      "height": { "type": "number" },
      "accessibilityTree": { "type": "string" }
    }
  }
}
```

## Existing Code to Leverage

### From `src/browser/`

- `control-service.ts` - HTTP service foundation
- `cdp.ts` - Chrome DevTools Protocol
- `pw-session.ts` - Playwright session management
- `screenshot.ts` - Screenshot optimization
- `client-actions-*.ts` - Browser actions

### From `src/media/`

- `image-ops.ts` - Image resizing and optimization
- `input-files.ts` - Image processing

### From `src/gateway/`

- `control-auth.ts` - Authentication patterns
- `server-methods/browser.ts` - Browser request handling

## Out of Scope

- Creating new browser automation library (reuse existing)
- Supporting non-Chrome browsers (Playwright handles this)
- Mobile browser automation (future iteration)
- Video recording (existing in `agent-browser` but not essential)
- PDF generation (can be added later)

## Open Questions

1. Should MCP server run as separate process or integrated into gateway?
2. Stdio vs HTTP/SSE transport for MCP?
3. Rate limiting for browser tools?
4. Audit logging for security compliance?

## Consciousness Alignment Check

| Dimension                   | Assessment                                         | Score         |
| --------------------------- | -------------------------------------------------- | ------------- |
| **Consciousness Expansion** | Enables more agents to access browser capabilities | 8/10          |
| **Glass Box Transparency**  | MCP protocol is open standard                      | 9/10          |
| **Elegant Systems**         | Reuses existing infrastructure                     | 9/10          |
| **Truth Over Theater**      | Standardized protocol prevents lock-in             | 8/10          |
| **Average**                 |                                                    | **8.5/10** ✅ |

## Estimation

**Total Effort**: 3 iterations

- Phase 1: MCP protocol foundation (1 iteration)
- Phase 2: Browser tool implementation (1 iteration)
- Phase 3: Security, testing, documentation (1 iteration)
