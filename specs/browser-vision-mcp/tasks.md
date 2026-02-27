# Browser Vision MCP Server - Task Breakdown

> **Total Estimate**: 3 iterations  
> **Parallel Groups**: 2 (Groups 2 & 3 can overlap)  
> **Dependencies**: See dependency graph

---

## Dependency Graph

```
Group 1: Foundation (Required First)
├── Task 1.1: MCP protocol types
├── Task 1.2: Transport abstraction
└── Task 1.3: Base server class
         │
         ▼
Group 2: Core Tools (Can Parallel with Group 3)
├── Task 2.1: browser.navigate
├── Task 2.2: browser.screenshot
├── Task 2.3: browser.click & fill
├── Task 2.4: browser.snapshot
├── Task 2.5: browser.scroll & evaluate
└── Task 2.6: browser.close
         │
         ▼
Group 3: Infrastructure
├── Task 3.1: Session manager
├── Task 3.2: Authentication
├── Task 3.3: Security layer
└── Task 3.4: Configuration
         │
         ▼
Group 4: Testing & Polish
├── Task 4.1: Unit tests
├── Task 4.2: Integration tests
├── Task 4.3: Documentation
└── Task 4.4: Claude Desktop example
```

---

## Task Group 1: Foundation (1 iteration)

### Task 1.1: MCP Protocol Types

**Description**: Define TypeScript types for MCP 1.0 protocol  
**Depends On**: None  
**Acceptance Criteria**:

- [ ] `MCPRequest` interface with JSON-RPC structure
- [ ] `MCPResponse` interface with result/error
- [ ] `Tool` interface with input/output schemas
- [ ] `ToolCallResult` with content types
- [ ] Error codes enum (ErrorCode)

**Files Created**:

- `src/mcp/types.ts` (lines 1-200)

**Tests** (4 tests):

- [ ] Types compile without errors
- [ ] JSON serialization round-trip
- [ ] Error codes match MCP spec
- [ ] Tool schema validation works

---

### Task 1.2: Transport Abstraction

**Description**: Abstract transport layer for stdio and HTTP/SSE  
**Depends On**: Task 1.1  
**Acceptance Criteria**:

- [ ] `Transport` interface with `send()` and `onMessage()`
- [ ] `StdioTransport` implementation
- [ ] `SSETransport` implementation (optional for v1)
- [ ] Message framing and parsing

**Files Created**:

- `src/mcp/transport/base.ts` (lines 1-100)
- `src/mcp/transport/stdio.ts` (lines 1-150)
- `src/mcp/transport/sse.ts` (lines 1-200, optional)

**Tests** (3 tests):

- [ ] Stdio transport sends/receives messages
- [ ] Message framing handles boundaries
- [ ] Transport close cleanup

---

### Task 1.3: Base Server Class

**Description**: Base MCP server with protocol handshake  
**Depends On**: Task 1.2  
**Acceptance Criteria**:

- [ ] `MCPServer` base class
- [ ] `initialize` request handler
- [ ] `tools/list` request handler
- [ ] `tools/call` request handler
- [ ] Notification support (logging)

**Files Created**:

- `src/mcp/server.ts` (lines 1-300)

**Tests** (4 tests):

- [ ] Initialize returns correct protocol version
- [ ] Tools list returns all registered tools
- [ ] Tool call routes to correct handler
- [ ] Error responses follow MCP spec

---

## Task Group 2: Core Tools (1 iteration)

### Task 2.1: browser.navigate

**Description**: Implement URL navigation tool  
**Depends On**: Task 1.3  
**Acceptance Criteria**:

- [ ] Tool schema defined
- [ ] URL validation (HTTPS only by default)
- [ ] Wait until options (load, domcontentloaded, networkidle)
- [ ] Timeout handling
- [ ] Success/error response

**Files Created**:

- `src/mcp/tools/navigate.ts` (lines 1-150)

**Tests** (4 tests):

- [ ] Navigates to valid URL
- [ ] Rejects non-HTTPS URLs (by config)
- [ ] Respects waitUntil option
- [ ] Times out on slow pages

---

### Task 2.2: browser.screenshot

**Description**: Implement screenshot tool with vision optimization  
**Depends On**: Task 2.1  
**Acceptance Criteria**:

- [ ] Element selector support
- [ ] Full page capture option
- [ ] Integration with `normalizeBrowserScreenshot()`
- [ ] Accessibility tree inclusion
- [ ] Base64 image output

**Files Created**:

- `src/mcp/tools/screenshot.ts` (lines 1-200)

**Tests** (5 tests):

- [ ] Captures viewport screenshot
- [ ] Captures element by selector
- [ ] Optimizes to < 5MB JPEG
- [ ] Includes accessibility tree
- [ ] Full page capture works

---

### Task 2.3: browser.click & browser.fill

**Description**: Implement interaction tools  
**Depends On**: Task 2.1  
**Acceptance Criteria**:

- [ ] `browser.click` with selector and options
- [ ] `browser.fill` with selector and value
- [ ] Wait for navigation option on click
- [ ] Error on element not found

**Files Created**:

- `src/mcp/tools/click.ts` (lines 1-100)
- `src/mcp/tools/fill.ts` (lines 1-100)

**Tests** (4 tests):

- [ ] Clicks element successfully
- [ ] Fills input field
- [ ] Waits for navigation when requested
- [ ] Error on missing element

---

### Task 2.4: browser.snapshot

**Description**: Implement accessibility tree snapshot tool  
**Depends On**: Task 2.1  
**Acceptance Criteria**:

- [ ] Full accessibility tree capture
- [ ] Interactive elements only option
- [ ] Compact mode (remove empty nodes)
- [ ] Element refs (@e1, @e2, etc.)
- [ ] Text representation for AI context

**Files Created**:

- `src/mcp/tools/snapshot.ts` (lines 1-150)

**Tests** (4 tests):

- [ ] Captures full accessibility tree
- [ ] Filters to interactive only
- [ ] Compacts empty nodes
- [ ] Assigns consistent refs

---

### Task 2.5: browser.scroll & browser.evaluate

**Description**: Implement scroll and JS evaluation tools  
**Depends On**: Task 2.1  
**Acceptance Criteria**:

- [ ] `browser.scroll` with direction and pixels
- [ ] `browser.evaluate` with script sandboxing
- [ ] Block dangerous patterns in eval
- [ ] Return eval results

**Files Created**:

- `src/mcp/tools/scroll.ts` (lines 1-80)
- `src/mcp/tools/evaluate.ts` (lines 1-120)

**Tests** (4 tests):

- [ ] Scrolls page in specified direction
- [ ] Evaluates safe JavaScript
- [ ] Blocks dangerous eval patterns
- [ ] Returns eval results correctly

---

### Task 2.6: browser.close

**Description**: Implement session close tool  
**Depends On**: Task 2.1  
**Acceptance Criteria**:

- [ ] Closes browser context
- [ ] Cleans up resources
- [ ] Graceful shutdown

**Files Created**:

- `src/mcp/tools/close.ts` (lines 1-80)

**Tests** (2 tests):

- [ ] Closes session successfully
- [ ] Cleanup runs on close

---

## Task Group 3: Infrastructure (1 iteration, overlaps with Group 2)

### Task 3.1: Session Manager

**Description**: Manage browser sessions for MCP clients  
**Depends On**: Task 1.3  
**Acceptance Criteria**:

- [ ] Create named sessions
- [ ] Session isolation by client
- [ ] Shared sessions (configurable)
- [ ] Auto-cleanup after 30min timeout
- [ ] Max concurrent sessions limit

**Files Created**:

- `src/mcp/session/manager.ts` (lines 1-250)
- `src/mcp/session/types.ts` (lines 1-50)

**Tests** (5 tests):

- [ ] Creates isolated sessions
- [ ] Enforces session limits
- [ ] Auto-cleans inactive sessions
- [ ] Shared sessions work
- [ ] Access control enforced

---

### Task 3.2: Authentication

**Description**: Token-based auth for MCP connections  
**Depends On**: Task 1.3  
**Acceptance Criteria**:

- [ ] Bearer token extraction
- [ ] Token validation via gateway auth
- [ ] Client ID extraction from token
- [ ] Permission checking

**Files Created**:

- `src/mcp/auth/token.ts` (lines 1-150)

**Tests** (3 tests):

- [ ] Validates valid tokens
- [ ] Rejects invalid tokens
- [ ] Extracts client permissions

---

### Task 3.3: Security Layer

**Description**: URL filtering and script sandboxing  
**Depends On**: Task 3.2  
**Acceptance Criteria**:

- [ ] URL allowlist validation
- [ ] JavaScript pattern blocking
- [ ] Domain-based permissions
- [ ] Audit logging

**Files Created**:

- `src/mcp/security/url-filter.ts` (lines 1-100)
- `src/mcp/security/script-sandbox.ts` (lines 1-100)
- `src/mcp/security/audit.ts` (lines 1-100)

**Tests** (4 tests):

- [ ] Allows URLs matching allowlist
- [ ] Blocks non-allowed URLs
- [ ] Blocks dangerous JS patterns
- [ ] Logs security events

---

### Task 3.4: Configuration

**Description**: MCP server configuration  
**Depends On**: Task 1.3  
**Acceptance Criteria**:

- [ ] Config schema definition
- [ ] Transport selection (stdio/http)
- [ ] Session limits
- [ ] Security settings
- [ ] Load from YAML

**Files Created**:

- `src/mcp/config.ts` (lines 1-150)

**Tests** (3 tests):

- [ ] Loads config from YAML
- [ ] Validates config schema
- [ ] Applies defaults correctly

---

## Task Group 4: Testing & Polish (1 iteration)

### Task 4.1: Unit Tests

**Description**: Comprehensive unit test coverage  
**Depends On**: All previous tasks  
**Acceptance Criteria**:

- [ ] All tools have unit tests
- [ ] Session manager tests
- [ ] Auth/security tests
- [ ] Transport tests
- [ ] > 80% coverage

**Files Created**:

- `src/mcp/**/*.test.ts` (multiple files)

**Tests** (30+ tests):

- [ ] Full test suite passes
- [ ] Coverage report generated

---

### Task 4.2: Integration Tests

**Description**: End-to-end MCP flow tests  
**Depends On**: Task 4.1  
**Acceptance Criteria**:

- [ ] Full MCP flow via stdio
- [ ] Browser automation e2e
- [ ] Screenshot optimization e2e
- [ ] Session lifecycle e2e

**Files Created**:

- `tests/mcp/integration.test.ts` (lines 1-200)

**Tests** (4 tests):

- [ ] Initialize → tools/list → tools/call flow
- [ ] Navigate → Screenshot → Click flow
- [ ] Session create → use → close flow
- [ ] Auth rejection flow

---

### Task 4.3: Documentation

**Description**: User and developer documentation  
**Depends On**: Task 4.2  
**Acceptance Criteria**:

- [ ] README with setup instructions
- [ ] Claude Desktop integration guide
- [ ] Tool reference documentation
- [ ] Configuration reference
- [ ] Security best practices

**Files Created**:

- `docs/mcp/README.md`
- `docs/mcp/claude-desktop-setup.md`
- `docs/mcp/tool-reference.md`
- `docs/mcp/configuration.md`

---

### Task 4.4: Claude Desktop Example

**Description**: Working example configuration  
**Depends On**: Task 4.3  
**Acceptance Criteria**:

- [ ] `claude_desktop_config.json` example
- [ ] Sample prompts demonstrating tools
- [ ] Troubleshooting guide

**Files Created**:

- `examples/mcp/claude_desktop_config.json`
- `examples/mcp/sample-prompts.md`

---

## Parallelization Strategy

### Can Work in Parallel

- **Group 2 & Group 3**: After Group 1 completes
  - Tool implementations (Group 2)
  - Session/auth/security (Group 3)

### Critical Path

```
Group 1 (1 iter) → Parallel( Group 2 (1 iter), Group 3 (1 iter) ) → Group 4 (1 iter)

Total: 3 iterations
```

---

## Test Summary

| Group     | Tests  | Focus                            |
| --------- | ------ | -------------------------------- |
| Group 1   | 11     | Protocol, transport, base server |
| Group 2   | 23     | Tool functionality               |
| Group 3   | 15     | Session, auth, security          |
| Group 4   | 38     | Unit + integration               |
| **Total** | **87** | Comprehensive coverage           |

---

## Acceptance Criteria (Feature Complete)

- [ ] All 8 browser tools implemented
- [ ] MCP 1.0 protocol compliance
- [ ] Stdio transport working
- [ ] Session management with timeout
- [ ] Token-based authentication
- [ ] URL and script security
- [ ] 87 tests passing
- [ ] Documentation complete
- [ ] Claude Desktop example working
- [ ] Consciousness alignment ≥ 7.0/10

---

_Task breakdown complete. Ready for implementation._
