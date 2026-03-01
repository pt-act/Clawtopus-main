# Context Compaction System - Requirements (OpenClaw Adaptation)

**Feature**: Multi-layered context management for extended agent sessions  
**Status**: Planning  
**Priority**: High (per CONTRIBUTING.md roadmap)  
**Adapted From**: PLIP Context Compaction Specification

---

## 1. Overview

### Problem Statement

Long-running OpenClaw sessions can exceed LLM context windows (128K-200K+ tokens). Current state:

- **Auto-compaction exists** via `session.compact()` in `pi-coding-agent` SDK
- **No boundary rule**: Sessions grow exponentially across compactions
- **No visibility**: Users can't see token usage or compaction history
- **No manual control**: Compaction only triggered programmatically
- **No degradation tracking**: Users unaware of quality loss after multiple compactions

### Proposed Solution

**Layered compaction system** with:

1. **Tool output pruning** (aggressive, minimal loss)
2. **Conversation summarization** (configurable preservation)
3. **Boundary-based loading** (prevents exponential growth)
4. **CLI commands** (visibility and control)

### Success Criteria

1. Sessions run 3-5x longer than context window
2. Quality maintained after 2-3 compactions
3. Users warned before degradation (3+ compactions)
4. Export/import enables resuming with fresh context
5. Full transparency into what's preserved/lost

---

## 2. User Stories

### US-OC-1: Automatic Context Management

**As a** user running extended coding sessions  
**I want** the system to automatically manage context when approaching limits  
**So that** my session doesn't fail mid-task

**Acceptance Criteria:**

- Auto-compaction triggers at 88% of context window
- User notified before compaction occurs
- Session continues seamlessly after compaction
- Token count visible in session output

**OpenClaw Integration:**

- Extend existing `compactEmbeddedPiSession()` in `src/agents/pi-embedded-runner/compact.ts`
- Add threshold checking to `run()` lifecycle

---

### US-OC-2: Manual Compaction Control

**As a** power user  
**I want** to manually trigger compaction with custom focus  
**So that** I can preserve specific information critical to my task

**Acceptance Criteria:**

- `openclaw compact` command available
- Optional `--focus` flag for custom preservation instructions
- Preview of before/after token counts
- Confirmation required before compaction

**OpenClaw Integration:**

- New command in `src/commands/compact.ts`
- Integrate with existing session management

---

### US-OC-3: Context Visibility

**As a** user  
**I want** to see current token usage and compaction state  
**So that** I understand my session's health

**Acceptance Criteria:**

- `openclaw context status` shows token usage
- Shows compaction count
- Shows last compaction time
- Shows degradation risk level

**OpenClaw Integration:**

- New command in `src/commands/context-status.ts`
- Read from session transcript events

---

### US-OC-4: Degradation Warnings

**As a** user  
**I want** to be warned when my session has been compacted multiple times  
**So that** I can decide to export/import before quality degrades

**Acceptance Criteria:**

- Soft warning at 3 compactions (suggest fresh start)
- Hard warning at 5 compactions (strongly recommend fresh start)
- Warning shows in session output
- `openclaw context status` displays degradation risk

**OpenClaw Integration:**

- Track `compactionCount` in session state
- Add warning logic to compaction flow

---

### US-OC-5: Context Inspection

**As a** developer or power user  
**I want** to inspect current context structure  
**So that** I understand what's consuming tokens and what's preserved

**Acceptance Criteria:**

- `openclaw context inspect` shows breakdown
- Shows message count and token distribution
- Shows tool output token usage
- Shows pinned messages (when implemented)

**OpenClaw Integration:**

- New command in `src/commands/context-inspect.ts`
- Leverage existing `estimateMessagesTokens()`

---

### US-OC-6: Session Branching

**As a** user exploring multiple approaches  
**I want** to branch my session at key decision points  
**So that** I can explore alternatives without losing original progress

**Acceptance Criteria:**

- `openclaw session branch` command
- Selector UI shows user messages as branch points
- Raw line copying (preserves exact formatting)
- New session ID generated for branch

**OpenClaw Integration:**

- New command in `src/commands/session-branch.ts`
- Use NDJSON file operations (no re-serialization)

---

### US-OC-7: Export/Import for Fresh Start

**As a** user with heavily compacted session  
**I want** to export structured state and import to fresh session  
**So that** I can continue work without quality degradation

**Acceptance Criteria:**

- `openclaw context export <filename>` creates structured JSON
- Export includes entities, findings, tool operations, next steps
- `openclaw context import <filename>` loads into new session
- Import works with different model/provider

**OpenClaw Integration:**

- New commands in `src/commands/context-export.ts` and `context-import.ts`
- Design JSON schema for exported state

---

### US-OC-8: Compaction History

**As a** user  
**I want** to view compaction event timeline  
**So that** I can understand context evolution

**Acceptance Criteria:**

- `openclaw context history` shows compaction events
- Shows timestamps, token savings, trigger type
- Shows degradation warnings
- Optional `--depth=N` for history limit

**OpenClaw Integration:**

- New command in `src/commands/context-history.ts`
- Read CompactionEvent entries from session transcript

---

## 3. Functional Requirements

### FR-OC-1: Layered Compaction Architecture

**Layer 1: Tool Output Pruning**

- Trigger: Tool output tokens > 50K AND total > 80% of limit
- Action: Aggressive pruning of tool outputs (keep results, drop verbose logs)
- Preservation: Recent 40K tokens protected
- OpenClaw: Extend `pruneHistoryForContextShare()` in `compaction.ts`

**Layer 2: Conversation Summarization**

- Trigger: Total tokens > 88% of limit
- Action: Summarize older messages using LLM
- Preservation: Recent 25K tokens protected
- OpenClaw: Leverage existing `summarizeInStages()`

**Layer 3: Full Compaction**

- Trigger: Total tokens > 95% of limit
- Action: Full conversation summarization
- Warning: User notified
- Protection: Pinned messages never compacted
- OpenClaw: Extend existing `session.compact()` flow

---

### FR-OC-2: Compaction Events in Session Transcript

**Event Structure:**

```typescript
interface CompactionEvent {
  id: string;
  type: "compaction";
  timestamp: number;
  summary: string;
  messagesCompacted: number;
  tokensBeforeCompaction: number;
  tokensAfterCompaction: number;
  trigger: "manual" | "auto";
  layer: "prune" | "summarize" | "full";
  customInstruction?: string;
  boundaryMessageId: string; // Messages AFTER this are preserved
}
```

**Integration:**

- Extend `src/sessions/transcript-events.ts`
- Write events to session JSONL file
- Use existing SessionManager APIs

---

### FR-OC-3: Boundary-Based Session Loading

**Problem**: Without boundaries, context grows exponentially:

- 1st compaction: 200 messages → 1 summary + 50 recent = 51 items
- 2nd compaction: 51 items → compact → 52 items
- Result: Context keeps growing, defeats compaction purpose

**Solution**: When loading session:

1. Find LATEST compaction event
2. Load only: compaction summary + events AFTER boundary
3. Don't reload pre-compaction messages

**OpenClaw Integration:**

- Extend `SessionManager.open()` or create wrapper
- Apply boundary rule when building message history

---

### FR-OC-4: Auto-Compaction Lifecycle

**Critical Sequence:**

1. CHECK token count after each message
2. If > threshold, PAUSE message processing
3. COMPACT with appropriate layer
4. APPEND compaction event to transcript
5. RELOAD session with boundary rule
6. RESUME message processing

**OpenClaw Integration:**

- Extend `runEmbeddedPiAgent()` in `pi-embedded-runner/run.ts`
- Add threshold checks to message handling loop

---

### FR-OC-5: Configuration

```yaml
# ~/.openclaw/config.yaml additions
compaction:
  auto_enabled: true
  auto_threshold_percent: 88
  preserve_recent_tokens: 25_000

  prune:
    enabled: true
    protect_recent_tokens: 40_000
    prune_minimum_tokens: 20_000

  notify_before_auto: true
  max_auto_compactions: 4
  warn_at_compaction: 3

  model:
    # Use OpenRouter free model for compaction
    provider: "openrouter"
    model_name: "google/gemini-2.0-flash-exp:free"
    temperature: 0.3
    max_tokens: 4000
```

**OpenClaw Integration:**

- Extend `OpenClawConfig` type in `src/config/config.ts`
- Add schema validation

---

## 4. Non-Functional Requirements

### NFR-OC-1: Performance

- Compaction completes in < 10 seconds (for 100K token context)
- No UI blocking during compaction
- Session reload < 2 seconds

### NFR-OC-2: Reliability

- Session file never corrupted by failed compaction
- Atomic writes (temp file → rename pattern)
- Recovery from interrupted compaction

### NFR-OC-3: Transparency

- Every compaction logged with full metadata
- Token counts accurate (±5%)
- Degradation warnings actionable

### NFR-OC-4: Compatibility

- Works with all providers (OpenAI, Anthropic, Google, OpenRouter)
- Works with existing sessions (migration path)
- No breaking changes to session file format

---

## 5. Commands Specification

### `openclaw compact`

**Syntax:**

```bash
openclaw compact [--focus=<instruction>] [--dry-run] [--session=<id>]
```

**Options:**

- `--focus`: Custom preservation instruction
- `--dry-run`: Preview savings without compacting
- `--session`: Target specific session (default: current)

---

### `openclaw context status`

**Syntax:**

```bash
openclaw context status [--session=<id>]
```

**Output:**

```
Context Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Tokens:        145,230 / 200,000 (73%)
Auto-Compaction:     Enabled (triggers at 88%)
Compaction Count:    2
Last Compaction:     2 hours ago
Degradation Risk:    Low

Recommendations:
  ✓ Context healthy
  💡 Consider manual compaction at 80% to preserve more detail
```

---

### `openclaw context inspect`

**Syntax:**

```bash
openclaw context inspect [--session=<id>]
```

**Output:**

```
Context Inspection
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total:               145,230 tokens

Breakdown:
  Conversation:      98,340 tokens (142 messages)
  Tool Outputs:      32,530 tokens (24 outputs)
  System Prompt:     14,360 tokens

Protected:           25,000 tokens (recent messages)
Compactable:         106,870 tokens

Potential Savings:
  Layer 1 (prune):   ~12,200 tokens
  Layer 2 (summarize): ~85,000 tokens
```

---

### `openclaw context history`

**Syntax:**

```bash
openclaw context history [--depth=<n>] [--session=<id>]
```

**Output:**

```
Compaction History
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[2 hours ago] AUTO - Layer 2 (summarize)
  187,450 → 48,320 tokens
  Compacted: 142 messages
  Trigger:   88% threshold reached

[5 hours ago] MANUAL - Layer 2 (summarize)
  165,230 → 52,140 tokens
  Compacted: 118 messages
  Focus:     "Preserve API design decisions"

Total Compactions: 2
Risk Level:        Low (recommend fresh start at 3)
```

---

### `openclaw context export`

**Syntax:**

```bash
openclaw context export <filename> [--session=<id>]
```

---

### `openclaw context import`

**Syntax:**

```bash
openclaw context import <filename>
```

---

### `openclaw session branch`

**Syntax:**

```bash
openclaw session branch [--at=<message-id>] [--session=<id>]
```

---

### `openclaw autocompact`

**Syntax:**

```bash
openclaw autocompact [on|off]
```

---

## 6. Constraints

### Technical Constraints

- Session file format: NDJSON (preserve compatibility)
- Token counting: Use existing `estimateTokens()` from SDK
- Must work with `pi-coding-agent` SDK patterns

### Business Constraints

- Compaction cost: Must support free/cheap models via OpenRouter
- Time: Manual compaction must complete in < 10s
- Storage: Export files must be < 100 MB

### Compatibility Constraints

- Existing sessions must work (no migration required)
- All existing CLI commands continue to work
- No breaking changes to config file format

---

## 7. Dependencies

**Requires:**

- OpenClaw CLI foundation (existing)
- `pi-coding-agent` SDK (existing)
- Session management (existing)

**Blocks:**

- None (optional enhancement)

---

## 8. Success Metrics

### Quantitative

- Sessions run 3-5x longer than context window
- Compaction time < 10s for 100K token context
- Auto-compaction success rate > 99.5%

### Qualitative

- Users report confidence in long-running sessions
- No surprise session failures due to context limits
- Degradation warnings actionable and trusted

---

**Document Status**: ✅ Complete  
**Next Step**: See spec.md for technical specification
