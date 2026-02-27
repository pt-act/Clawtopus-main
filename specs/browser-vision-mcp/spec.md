# Browser Vision MCP Server Specification

> **Goal**: Expose Clawtopus browser automation and vision capabilities via Model Context Protocol (MCP), enabling any MCP-compatible agent to leverage existing browser infrastructure.

**Consciousness Alignment Score**: 8.5/10 ✅

---

## Goal

Create an MCP server that:

1. Exposes Clawtopus browser tools (`src/browser/`) via standardized MCP protocol
2. Provides vision-optimized screenshots for Claude, GPT-4V, and other vision models
3. Enables multi-agent browser session sharing through MCP
4. Reuses 100% of existing browser infrastructure (no duplication)

---

## User Stories

### US-1: External Agent Browser Access

As an AI agent developer using Claude Desktop or Cline, I want to control browsers via MCP, so that my agent can navigate websites and take screenshots without maintaining separate browser infrastructure.

**Acceptance Criteria:**

- MCP server provides 8 core browser tools (navigate, screenshot, click, fill, snapshot, scroll, evaluate, close)
- Tools follow MCP 1.0 specification
- Authentication via token-based auth
- Clear error messages for browser failures

### US-2: Vision Model Screenshot Optimization

As a vision model user, I want screenshots automatically optimized for my model, so that I can analyze web pages without manual image processing.

**Acceptance Criteria:**

- Screenshots auto-compressed to < 5MB JPEG
- Dimensions capped at 2000px (configurable)
- Quality optimization (85% → 35% fallback)
- Accessibility tree included as text context
- Support for element-specific screenshots

### US-3: Multi-Agent Session Sharing

As a system administrator running multiple AI agents, I want them to share browser sessions via MCP, so that agents can collaborate on complex web workflows.

**Acceptance Criteria:**

- Named sessions persist across agent restarts
- Session isolation by default
- Optional shared sessions via configuration
- Session timeout after 30min inactivity
- Concurrent session limits enforced

---

## Specific Requirements

### SR-1: MCP Protocol Compliance

**MCP Version**: 1.0 (2024-11-05)

**Required Endpoints**:

```json
{
  "protocolVersion": "2024-11-05",
  "capabilities": {
    "tools": {
      "listChanged": true
    },
    "logging": {}
  },
  "serverInfo": {
    "name": "clawtopus-browser-mcp",
    "version": "1.0.0"
  }
}
```

**Implementation**:

```typescript
// src/mcp/browser-mcp-server.ts
export class BrowserMCPServer {
  async handleListTools(): Promise<Tool[]> {
    return [
      browserNavigateTool,
      browserScreenshotTool,
      browserClickTool,
      browserFillTool,
      browserSnapshotTool,
      browserScrollTool,
      browserEvaluateTool,
      browserCloseTool,
    ];
  }

  async handleCallTool(request: CallToolRequest): Promise<CallToolResult> {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "browser.navigate":
        return this.navigate(args);
      case "browser.screenshot":
        return this.screenshot(args);
      // ... etc
    }
  }
}
```

### SR-2: Browser Tool Specifications

#### Tool: `browser.navigate`

**Purpose**: Navigate to specified URL

**Input Schema**:

```json
{
  "type": "object",
  "properties": {
    "url": {
      "type": "string",
      "format": "uri",
      "description": "URL to navigate to"
    },
    "waitUntil": {
      "type": "string",
      "enum": ["load", "domcontentloaded", "networkidle"],
      "default": "networkidle",
      "description": "When to consider navigation complete"
    },
    "timeout": {
      "type": "number",
      "default": 30000,
      "description": "Navigation timeout in milliseconds"
    },
    "sessionId": {
      "type": "string",
      "description": "Browser session identifier"
    }
  },
  "required": ["url"]
}
```

**Output**:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Navigated to https://example.com (200 OK)"
    }
  ]
}
```

#### Tool: `browser.screenshot`

**Purpose**: Capture screenshot optimized for vision models

**Input Schema**:

```json
{
  "type": "object",
  "properties": {
    "selector": {
      "type": "string",
      "description": "CSS selector for specific element (optional)"
    },
    "fullPage": {
      "type": "boolean",
      "default": false,
      "description": "Capture full page vs viewport"
    },
    "includeAccessibilityTree": {
      "type": "boolean",
      "default": true,
      "description": "Include accessibility tree as text"
    },
    "sessionId": {
      "type": "string",
      "description": "Browser session identifier"
    }
  }
}
```

**Output**:

```json
{
  "content": [
    {
      "type": "image",
      "data": "base64-encoded-jpeg...",
      "mimeType": "image/jpeg"
    },
    {
      "type": "text",
      "text": "[Accessibility tree for context]"
    }
  ]
}
```

**Implementation**:

```typescript
async screenshot(args: ScreenshotArgs): Promise<CallToolResult> {
  // 1. Capture via existing screenshot.ts
  const rawBuffer = await this.browser.captureScreenshot({
    selector: args.selector,
    fullPage: args.fullPage
  });

  // 2. Optimize via existing image-ops.ts
  const optimized = await normalizeBrowserScreenshot(rawBuffer, {
    maxSide: 2000,
    maxBytes: 5 * 1024 * 1024
  });

  // 3. Get accessibility tree if requested
  const a11yTree = args.includeAccessibilityTree
    ? await this.browser.getAccessibilityTree()
    : null;

  return {
    content: [
      {
        type: "image",
        data: optimized.buffer.toString('base64'),
        mimeType: optimized.contentType || "image/jpeg"
      },
      ...(a11yTree ? [{ type: "text", text: a11yTree }] : [])
    ]
  };
}
```

#### Tool: `browser.click`

**Purpose**: Click element on page

**Input Schema**:

```json
{
  "type": "object",
  "properties": {
    "selector": {
      "type": "string",
      "description": "CSS selector or @ref from snapshot"
    },
    "waitForNavigation": {
      "type": "boolean",
      "default": false,
      "description": "Wait for navigation after click"
    },
    "timeout": {
      "type": "number",
      "default": 5000
    },
    "sessionId": {
      "type": "string"
    }
  },
  "required": ["selector"]
}
```

#### Tool: `browser.snapshot`

**Purpose**: Get accessibility tree with element refs

**Input Schema**:

```json
{
  "type": "object",
  "properties": {
    "selector": {
      "type": "string",
      "description": "Scope to specific element"
    },
    "interactiveOnly": {
      "type": "boolean",
      "default": false,
      "description": "Only show interactive elements"
    },
    "compact": {
      "type": "boolean",
      "default": true,
      "description": "Remove empty structural elements"
    },
    "sessionId": {
      "type": "string"
    }
  }
}
```

**Example Output**:

```
[Snapshot of example.com]
- @e1: heading "Example Domain" (level: 1)
- @e2: paragraph "This domain is for use in illustrative examples..."
- @e3: link "More information..." → https://www.iana.org/domains/example
```

### SR-3: Session Management

**Session Lifecycle**:

```
Create Session → Use Session → (Inactivity 30min) → Auto-Cleanup
     ↓                ↓
Named Session    Shared Session
(persistent)     (configurable)
```

**Implementation**:

```typescript
// src/mcp/session-manager.ts
interface BrowserSession {
  id: string;
  name?: string;
  browserContext: BrowserContext;
  lastActivity: Date;
  createdBy: string; // MCP client ID
  shared: boolean;
}

export class MCPSessionManager {
  private sessions = new Map<string, BrowserSession>();
  private readonly TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  async createSession(options: {
    name?: string;
    shared?: boolean;
    clientId: string;
  }): Promise<string> {
    const sessionId = options.name || randomUUID();

    // Reuse existing session if shared and exists
    if (options.shared && this.sessions.has(sessionId)) {
      return sessionId;
    }

    // Create new browser context via existing infrastructure
    const browserContext = await this.browserService.createContext();

    this.sessions.set(sessionId, {
      id: sessionId,
      name: options.name,
      browserContext,
      lastActivity: new Date(),
      createdBy: options.clientId,
      shared: options.shared || false,
    });

    return sessionId;
  }

  async getSession(sessionId: string, clientId: string): Promise<BrowserSession> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Check access permissions
    if (!session.shared && session.createdBy !== clientId) {
      throw new Error(`Access denied to session: ${sessionId}`);
    }

    // Update activity
    session.lastActivity = new Date();

    return session;
  }

  // Auto-cleanup via cron
  async cleanupInactiveSessions(): Promise<void> {
    const now = Date.now();

    for (const [id, session] of this.sessions) {
      if (now - session.lastActivity.getTime() > this.TIMEOUT_MS) {
        await session.browserContext.close();
        this.sessions.delete(id);
      }
    }
  }
}
```

### SR-4: Security Model

**Authentication Flow**:

```
MCP Client → Token Auth → Rate Limit Check → Permission Check → Execute
```

**Security Layers**:

1. **Token Authentication**:

```typescript
// src/mcp/auth.ts
async authenticate MCPRequest): Promise<AuthResult> {
  const token = extractBearerToken(request);

  // Validate against gateway auth service
  const validated = await validateBrowserControlToken(token);

  if (!validated.valid) {
    throw new MCPError(ErrorCode.InvalidRequest, "Invalid authentication");
  }

  return {
    clientId: validated.clientId,
    permissions: validated.permissions
  };
}
```

2. **URL Allowlist**:

```typescript
const ALLOWED_URL_PATTERNS = [
  /^https:\/\//, // Only HTTPS
  // Additional patterns from config
  ...config.allowedUrlPatterns,
];

function validateUrl(url: string): void {
  if (!ALLOWED_URL_PATTERNS.some((p) => p.test(url))) {
    throw new Error(`URL not allowed: ${url}`);
  }
}
```

3. **JavaScript Sandboxing**:

```typescript
async evaluate(args: { script: string }): Promise<unknown> {
  // Block dangerous patterns
  const blockedPatterns = [
    /eval\s*\(/,
    /Function\s*\(/,
    /document\.cookie/,
    /localStorage/,
    /sessionStorage/
  ];

  if (blockedPatterns.some(p => p.test(args.script))) {
    throw new Error("Script contains blocked patterns");
  }

  return this.browser.evaluate(args.script);
}
```

### SR-5: Transport Options

**Option A: Stdio Transport** (default)

```typescript
// For Claude Desktop, Cline integration
const transport = new StdioServerTransport();
const server = new BrowserMCPServer();
await server.connect(transport);
```

**Option B: HTTP/SSE Transport**

```typescript
// For web-based agents
const app = express();
const transport = new SSEServerTransport("/mcp", app);
const server = new BrowserMCPServer();
await server.connect(transport);
```

**Configuration**:

```yaml
# ~/.clawtopus/config.yaml
mcp:
  browser:
    transport: stdio # or http
    httpPort: 8081 # if transport = http
    auth:
      type: token
      tokenFile: ~/.clawtopus/mcp-token
    sessions:
      maxConcurrent: 10
      timeoutMinutes: 30
    security:
      allowedUrlPatterns:
        - "^https://"
      blockEval: true
```

---

## Visual Design

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     MCP CLIENT                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Claude Desktop / Cline / Custom Agent                   │   │
│  │                                                         │   │
│  │ "Navigate to example.com and take a screenshot"         │   │
│  └──────────────────────┬──────────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────────┘
                          │ MCP Protocol (JSON-RPC)
                          │ tools/list, tools/call
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CLAWTOPUS MCP SERVER                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ MCP Protocol Handler (stdio/http)                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  │   │
│  │  │  Auth Layer │→ │ Rate Limiter│→ │ Session Manager│  │   │
│  │  └─────────────┘  └─────────────┘  └────────────────┘  │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │                                       │
│  ┌──────────────────────▼──────────────────────────────────┐   │
│  │              Browser Tool Router                         │   │
│  │  ┌────────────┬────────────┬────────────┬────────────┐  │   │
│  │  │ navigate   │ screenshot │ click      │ snapshot   │  │   │
│  │  │ fill       │ scroll     │ evaluate   │ close      │  │   │
│  │  └────────────┴────────────┴────────────┴────────────┘  │   │
│  └──────────────────────┬──────────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────────┘
                          │ Reuse Existing Infrastructure
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  src/browser/│  │  src/media/  │  │ src/gateway/ │
│  - cdp.ts    │  │  - image-ops │  │ - control-*  │
│  - pw-*.ts   │  │  - screenshot│  │ - auth       │
│  - control-* │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Tool Call Flow

```
User: "Take a screenshot of the login page"

Claude Desktop ──tools/call──► MCP Server
                               │
                               ├──1. Authenticate request
                               ├──2. Get/create session
                               ├──3. Call browser.screenshot()
                               │      │
                               │      ├──► src/browser/pw-session.ts
                               │      │         │
                               │      │         ├──► Playwright page.screenshot()
                               │      │         │
                               │      │         └──► Return raw buffer
                               │      │
                               │      └──► src/media/image-ops.ts
                               │                │
                               │                ├──► normalizeBrowserScreenshot()
                               │                │       (resize, compress)
                               │                │
                               │                └──► Return optimized JPEG
                               │
                               ├──4. Get accessibility tree
                               │      └──► src/browser/pw-role-snapshot.ts
                               │
                               └──5. Return MCP result
                                          │
◄───{image + text}─────────────────────────┘

Claude Desktop displays screenshot with context
```

---

## Existing Code to Leverage

### Core Browser (60+ files in `src/browser/`)

| File                  | Purpose                  | Reuse                   |
| --------------------- | ------------------------ | ----------------------- |
| `control-service.ts`  | HTTP service foundation  | ✅ Wrap with MCP        |
| `cdp.ts`              | Chrome DevTools Protocol | ✅ Direct use           |
| `pw-session.ts`       | Playwright sessions      | ✅ Session management   |
| `screenshot.ts`       | Screenshot optimization  | ✅ Direct use           |
| `client-actions-*.ts` | Browser actions          | ✅ Tool implementations |
| `control-auth.ts`     | Authentication           | ✅ Token validation     |

### Media Processing (`src/media/`)

| File             | Purpose          | Reuse                             |
| ---------------- | ---------------- | --------------------------------- |
| `image-ops.ts`   | Resize, optimize | ✅ `normalizeBrowserScreenshot()` |
| `input-files.ts` | Image processing | ✅ Format conversion              |

### Gateway (`src/gateway/`)

| File                        | Purpose                  | Reuse                |
| --------------------------- | ------------------------ | -------------------- |
| `server-methods/browser.ts` | Browser request handling | ✅ Pattern reference |
| `control-auth.ts`           | Auth patterns            | ✅ Token validation  |

---

## Out of Scope

**Explicitly NOT included:**

- ❌ New browser automation library (reuse existing)
- ❌ Non-Chrome browser support (Playwright handles)
- ❌ Mobile browser emulation
- ❌ Video recording (can be added later)
- ❌ PDF generation (can be added later)
- ❌ File downloads (security complexity)
- ❌ File uploads (security complexity)

---

## PBT Validation Strategy

### Properties to Validate

1. **Session Isolation**
   - Property: `∀ sessions s1, s2: s1.id ≠ s2.id → s1.context ≠ s2.context`
   - Test: Concurrent sessions don't interfere

2. **Screenshot Optimization**
   - Property: `∀ screenshot s: s.size ≤ 5MB ∧ s.width ≤ 2000`
   - Test: All screenshots meet vision model requirements

3. **Auth Enforcement**
   - Property: `∀ request r: ¬authenticated(r) → error(r)`
   - Test: Unauthenticated requests rejected

4. **Tool Completeness**
   - Property: `∀ tool t in schema: implemented(t)`
   - Test: All 8 tools respond correctly

---

## Success Metrics

### Technical

- MCP compliance: 100% spec adherence
- Screenshot latency: < 3 seconds
- Session cleanup: 100% after timeout
- Auth failure rate: 0%

### User

- Setup time: < 5 minutes
- Tool success rate: > 95%
- Documentation completeness: 100%

---

## Consciousness Alignment Verification

| Dimension                   | Evidence                                           | Score         |
| --------------------------- | -------------------------------------------------- | ------------- |
| **Consciousness Expansion** | Enables more agents to access browser capabilities | 8/10          |
| **Glass Box Transparency**  | MCP is open standard; all actions logged           | 9/10          |
| **Elegant Systems**         | Reuses 60+ files; no duplication                   | 9/10          |
| **Truth Over Theater**      | Standardized protocol prevents lock-in             | 8/10          |
| **Average**                 |                                                    | **8.5/10** ✅ |

---

## Risk Register

| Risk                            | Impact | Probability | Mitigation                         |
| ------------------------------- | ------ | ----------- | ---------------------------------- |
| MCP spec changes                | Medium | Low         | Pin to 1.0; monitor spec evolution |
| Browser version incompatibility | Medium | Medium      | Test with multiple Chrome versions |
| Memory leaks from sessions      | High   | Low         | Auto-cleanup; session limits       |
| Auth token exposure             | High   | Low         | Secure token storage; rotation     |

---

_Specification complete. Ready for task breakdown._
