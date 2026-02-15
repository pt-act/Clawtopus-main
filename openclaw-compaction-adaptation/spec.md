# Context Compaction System - Technical Specification (OpenClaw Adaptation)

**Feature**: Multi-layered context management for extended agent sessions  
**Version**: 1.0.0  
**Date**: 2025-02-13  
**Status**: Specification  
**Based On**: PLIP Context Compaction Specification + OpenClaw Architecture

---

## Overview

This specification defines enhancements to OpenClaw's existing compaction system, enabling sessions to run 3-5x longer than the LLM context window without quality degradation.

**Design Philosophy**:

- **Incremental**: Build on existing `compaction.ts` and `pi-coding-agent` SDK
- **Transparent**: Users always know what's preserved/lost
- **Compatible**: No breaking changes to existing sessions
- **Cost-Effective**: Support OpenRouter free models for compaction

---

## Architecture Overview

### Current vs. Enhanced Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CURRENT OPENCLAW COMPACTION                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User Message → runEmbeddedPiAgent() → [context grows] → session.compact()  │
│                                             ↓                                │
│                                    summarizeInStages()                       │
│                                             ↓                                │
│                                    [new summary replaces old messages]       │
│                                                                              │
│  Problems:                                                                   │
│  - No boundary rule (exponential growth across compactions)                 │
│  - No compaction events (no audit trail)                                    │
│  - No CLI commands (no manual control)                                      │
│  - No degradation tracking                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

                                    ↓ ENHANCED ↓

┌─────────────────────────────────────────────────────────────────────────────┐
│                        ENHANCED OPENCLAW COMPACTION                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐    ┌──────────────────────┐                       │
│  │  CONTEXT MANAGER     │    │  COMPACTION EVENTS   │                       │
│  │  - Threshold checks  │    │  - CompactionEvent   │                       │
│  │  - Layered triggers  │    │  - Boundary rule     │                       │
│  │  - Token tracking    │    │  - Audit trail       │                       │
│  └──────────────────────┘    └──────────────────────┘                       │
│              ↓                          ↓                                    │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                    LAYERED COMPACTION                            │        │
│  │                                                                  │        │
│  │  Layer 1: Tool Output Pruning                                   │        │
│  │    Trigger: tool_outputs > 50K AND total > 80%                  │        │
│  │    Action: Drop verbose logs, keep results                      │        │
│  │    Protected: Recent 40K tokens                                 │        │
│  │                                                                  │        │
│  │  Layer 2: Conversation Summarization                            │        │
│  │    Trigger: total > 88%                                         │        │
│  │    Action: LLM summarization                                    │        │
│  │    Protected: Recent 25K tokens                                 │        │
│  │                                                                  │        │
│  │  Layer 3: Full Compaction                                       │        │
│  │    Trigger: total > 95%                                         │        │
│  │    Action: Full conversation summary                            │        │
│  │    Warning: User notified                                       │        │
│  │    Protected: Pinned messages                                   │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│              ↓                                                               │
│  ┌──────────────────────┐    ┌──────────────────────┐                       │
│  │  SESSION LOADING     │    │  CLI COMMANDS        │                       │
│  │  - Boundary rule     │    │  - compact           │                       │
│  │  - Load after bound  │    │  - context status    │                       │
│  │  - No exponential    │    │  - context history   │                       │
│  └──────────────────────┘    └──────────────────────┘                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Session File Enhancements

### CompactionEvent Type

**Location**: `src/sessions/transcript-events.ts` (extend existing)

```typescript
// Extend existing transcript event types
export interface CompactionEvent {
  id: string;                    // Unique event ID (e.g., 'compact-1707825600000')
  type: 'compaction';            // Discriminator
  timestamp: number;             // Unix timestamp

  // Compaction result
  summary: string;               // Generated summary text

  // Metadata
  messagesCompacted: number;     // Count of messages summarized
  tokensBeforeCompaction: number;
  tokensAfterCompaction: number;
  trigger: 'manual' | 'auto';
  layer: 'prune' | 'summarize' | 'full';
  customInstruction?: string;    // User-provided focus

  // Critical: Boundary marker
  boundaryMessageId: string;     // Messages AFTER this are preserved
}

// Add to existing TranscriptEvent union type
export type TranscriptEvent =
  | MessageEvent
  | ToolResultEvent
  | CompactionEvent  // NEW
  | /* existing types */;
```

### Session File Format (NDJSON)

Each line is a JSON object. CompactionEvent appears inline:

```jsonl
{"id":"msg-001","type":"message","role":"user","content":"Help me refactor...","timestamp":1707820000}
{"id":"msg-002","type":"message","role":"assistant","content":"I'll help...","timestamp":1707820001}
... (many more messages)
{"id":"compact-001","type":"compaction","summary":"Session covered refactoring...","messagesCompacted":142,"tokensBeforeCompaction":187450,"tokensAfterCompaction":48320,"trigger":"auto","layer":"summarize","boundaryMessageId":"msg-142","timestamp":1707825600}
{"id":"msg-143","type":"message","role":"user","content":"Now let's add tests","timestamp":1707825700}
```

---

## Boundary-Based Session Loading

### The Problem

Without boundaries, session files grow exponentially:

```
Session Start:     0 messages
After work:        200 messages (175K tokens)
After compact 1:   Summary + 50 recent = 51 items
After compact 2:   Load 51, compact → Summary + 51 = 52 items
After compact 3:   Load 52, compact → Summary + 52 = 53 items
...
After compact N:   Context keeps growing!
```

### The Solution

**Location**: `src/agents/compaction-boundary.ts` (NEW)

```typescript
import type { SessionManager } from "@mariozechner/pi-coding-agent";
import type { CompactionEvent, TranscriptEvent } from "../sessions/transcript-events.js";

export interface BoundaryLoadResult {
  /** The compaction summary to use as history preamble */
  compactionSummary: string | null;

  /** Only messages AFTER the boundary */
  messagesAfterBoundary: TranscriptEvent[];

  /** Compaction count for degradation tracking */
  compactionCount: number;

  /** Timestamp of last compaction (if any) */
  lastCompactionAt: number | null;
}

export function findLatestCompactionEvent(
  events: TranscriptEvent[],
): { event: CompactionEvent; index: number } | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (event && typeof event === "object" && event.type === "compaction") {
      return { event: event as CompactionEvent, index: i };
    }
  }
  return null;
}

export function countCompactionEvents(events: TranscriptEvent[]): number {
  return events.filter((e) => e?.type === "compaction").length;
}

export function loadSessionWithBoundary(events: TranscriptEvent[]): BoundaryLoadResult {
  const compactionCount = countCompactionEvents(events);
  const latest = findLatestCompactionEvent(events);

  if (!latest) {
    // No compaction - load full history
    return {
      compactionSummary: null,
      messagesAfterBoundary: events,
      compactionCount: 0,
      lastCompactionAt: null,
    };
  }

  // Apply boundary rule: only load events AFTER the compaction event
  const eventsAfterBoundary = events.slice(latest.index + 1);

  return {
    compactionSummary: latest.event.summary,
    messagesAfterBoundary: eventsAfterBoundary,
    compactionCount,
    lastCompactionAt: latest.event.timestamp,
  };
}
```

### Integration with Session Loading

**Location**: Extend `src/agents/pi-embedded-runner/run.ts`

```typescript
// In runEmbeddedPiAgent() or equivalent

// Before building message history:
import { loadSessionWithBoundary } from "../compaction-boundary.js";

const allEvents = sessionManager.getEvents();
const boundaryResult = loadSessionWithBoundary(allEvents);

// Build context using boundary result
let contextMessages: AgentMessage[] = [];

if (boundaryResult.compactionSummary) {
  // Add compaction summary as history preamble
  contextMessages.push({
    role: "user",
    content: `[Previous Context Summary]\n${boundaryResult.compactionSummary}`,
    timestamp: boundaryResult.lastCompactionAt ?? Date.now(),
  });
}

// Add only messages after boundary
for (const event of boundaryResult.messagesAfterBoundary) {
  if (event.type === "message") {
    contextMessages.push(eventToMessage(event));
  }
}

// Track compaction count for degradation warnings
const compactionCount = boundaryResult.compactionCount;
if (compactionCount >= 3) {
  emitWarning("Session has been compacted 3+ times. Consider fresh start.");
}
```

---

## Layered Compaction Implementation

### Layer Configuration

**Location**: `src/agents/compaction-config.ts` (NEW)

```typescript
export interface CompactionLayerConfig {
  layer: "prune" | "summarize" | "full";
  triggerPercent: number;
  protectRecentTokens: number;
  condition?: (context: CompactionContext) => boolean;
}

export interface CompactionConfig {
  autoEnabled: boolean;
  layers: CompactionLayerConfig[];
  warnAtCompaction: number;
  maxAutoCompactions: number;

  model?: {
    provider: string;
    modelName: string;
    temperature: number;
    maxTokens: number;
  };
}

export const DEFAULT_COMPACTION_CONFIG: CompactionConfig = {
  autoEnabled: true,
  layers: [
    {
      layer: "prune",
      triggerPercent: 80,
      protectRecentTokens: 40_000,
      condition: (ctx) => ctx.toolOutputTokens > 50_000,
    },
    {
      layer: "summarize",
      triggerPercent: 88,
      protectRecentTokens: 25_000,
    },
    {
      layer: "full",
      triggerPercent: 95,
      protectRecentTokens: 15_000,
    },
  ],
  warnAtCompaction: 3,
  maxAutoCompactions: 5,
};
```

### Layered Compaction Logic

**Location**: `src/agents/compaction-layers.ts` (NEW)

```typescript
import type { AgentMessage } from "@mariozechner/pi-agent-core";
import {
  estimateMessagesTokens,
  pruneHistoryForContextShare,
  summarizeInStages,
} from "./compaction.js";
import type { CompactionConfig, CompactionLayerConfig } from "./compaction-config.js";

export interface CompactionContext {
  messages: AgentMessage[];
  totalTokens: number;
  toolOutputTokens: number;
  contextWindowTokens: number;
}

export function selectCompactionLayer(
  context: CompactionContext,
  config: CompactionConfig,
): CompactionLayerConfig | null {
  const usagePercent = (context.totalTokens / context.contextWindowTokens) * 100;

  // Evaluate layers in order (prune → summarize → full)
  for (const layer of config.layers) {
    if (usagePercent >= layer.triggerPercent) {
      // Check additional condition if defined
      if (layer.condition && !layer.condition(context)) {
        continue;
      }
      return layer;
    }
  }

  return null; // No compaction needed
}

export async function executeCompactionLayer(
  layer: CompactionLayerConfig,
  context: CompactionContext,
  params: {
    model: ExtensionContext["model"];
    apiKey: string;
    signal: AbortSignal;
    customInstructions?: string;
  },
): Promise<{
  summary: string;
  tokensAfter: number;
  messagesCompacted: number;
}> {
  const { messages, contextWindowTokens } = context;
  const { protectRecentTokens } = layer;

  // Separate protected recent messages from compactable
  const recentTokenBudget = Math.min(protectRecentTokens, contextWindowTokens * 0.5);
  let protectedMessages: AgentMessage[] = [];
  let compactableMessages: AgentMessage[] = [];
  let recentTokens = 0;

  // Walk backwards to find protected messages
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const msgTokens = estimateMessagesTokens([msg]);

    if (recentTokens + msgTokens <= recentTokenBudget) {
      protectedMessages.unshift(msg);
      recentTokens += msgTokens;
    } else {
      compactableMessages = messages.slice(0, i + 1);
      break;
    }
  }

  if (compactableMessages.length === 0) {
    // Nothing to compact
    return {
      summary: "",
      tokensAfter: context.totalTokens,
      messagesCompacted: 0,
    };
  }

  // Execute layer-specific logic
  if (layer.layer === "prune") {
    // Prune tool outputs only
    const pruned = pruneHistoryForContextShare({
      messages: compactableMessages,
      maxContextTokens: contextWindowTokens,
      maxHistoryShare: 0.3, // More aggressive for prune layer
    });

    // For prune layer, return minimal summary
    const summary = `[Tool outputs pruned. Dropped ${pruned.droppedMessages} outputs (${pruned.droppedTokens} tokens).]`;
    const tokensAfter = pruned.keptTokens + recentTokens;

    return {
      summary,
      tokensAfter,
      messagesCompacted: pruned.droppedMessages,
    };
  }

  // Summarize layer or full compaction
  const summary = await summarizeInStages({
    messages: compactableMessages,
    model: params.model,
    apiKey: params.apiKey,
    signal: params.signal,
    reserveTokens: 4000,
    maxChunkTokens: Math.floor(contextWindowTokens * 0.4),
    contextWindow: contextWindowTokens,
    customInstructions: params.customInstructions,
  });

  const summaryTokens = estimateMessagesTokens([
    {
      role: "user",
      content: summary,
      timestamp: Date.now(),
    },
  ]);

  return {
    summary,
    tokensAfter: summaryTokens + recentTokens,
    messagesCompacted: compactableMessages.length,
  };
}
```

---

## CLI Commands Implementation

### `openclaw compact` Command

**Location**: `src/commands/compact.ts` (NEW)

```typescript
import { Command } from "commander";
import { resolveSessionFile } from "../agents/pi-embedded-runner/session-manager-init.js";
import { compactEmbeddedPiSession } from "../agents/pi-embedded-runner/compact.js";
import { estimateMessagesTokens } from "../agents/compaction.js";

export const compactCommand = new Command("compact")
  .description("Manually compact session context")
  .option("--focus <instruction>", "Custom preservation instruction")
  .option("--dry-run", "Preview savings without compacting")
  .option("--session <id>", "Target session ID")
  .action(async (options) => {
    const sessionFile = await resolveSessionFile(options.session);

    if (options.dryRun) {
      // Load and estimate without compacting
      const events = await loadSessionEvents(sessionFile);
      const messages = eventsToMessages(events);
      const currentTokens = estimateMessagesTokens(messages);
      const estimatedAfter = estimatePostCompactionTokens(messages);

      console.log(`Current context: ${currentTokens.toLocaleString()} tokens`);
      console.log(`Estimated after compaction: ${estimatedAfter.toLocaleString()} tokens`);
      console.log(`Potential savings: ${(currentTokens - estimatedAfter).toLocaleString()} tokens`);
      return;
    }

    // Confirm before compacting
    const confirmed = await confirm("Proceed with compaction?");
    if (!confirmed) {
      console.log("Compaction cancelled.");
      return;
    }

    const result = await compactEmbeddedPiSession({
      sessionFile,
      customInstructions: options.focus,
      // ... other params
    });

    if (result.ok && result.compacted) {
      console.log(`✓ Compacted ${result.result.messagesCompacted} messages`);
      console.log(`  ${result.result.tokensBefore} → ${result.result.tokensAfter} tokens`);
    } else {
      console.error(`Compaction failed: ${result.reason}`);
    }
  });
```

### `openclaw context status` Command

**Location**: `src/commands/context-status.ts` (NEW)

```typescript
import { Command } from "commander";
import { loadSessionWithBoundary, countCompactionEvents } from "../agents/compaction-boundary.js";
import { estimateMessagesTokens, resolveContextWindowTokens } from "../agents/compaction.js";

export const contextStatusCommand = new Command("status")
  .description("Show context usage and compaction state")
  .option("--session <id>", "Target session ID")
  .action(async (options) => {
    const sessionFile = await resolveSessionFile(options.session);
    const events = await loadSessionEvents(sessionFile);
    const boundaryResult = loadSessionWithBoundary(events);

    const messages = eventsToMessages(boundaryResult.messagesAfterBoundary);
    const totalTokens = estimateMessagesTokens(messages);
    const contextWindow = resolveContextWindowTokens(/* model */);
    const usagePercent = (totalTokens / contextWindow) * 100;

    const compactionCount = boundaryResult.compactionCount;
    const riskLevel =
      compactionCount >= 5
        ? "Critical"
        : compactionCount >= 3
          ? "High"
          : compactionCount >= 1
            ? "Medium"
            : "Low";

    console.log("Context Status");
    console.log("━".repeat(50));
    console.log(
      `Total Tokens:        ${totalTokens.toLocaleString()} / ${contextWindow.toLocaleString()} (${usagePercent.toFixed(1)}%)`,
    );
    console.log(`Compaction Count:    ${compactionCount}`);
    if (boundaryResult.lastCompactionAt) {
      const ago = formatRelativeTime(boundaryResult.lastCompactionAt);
      console.log(`Last Compaction:     ${ago}`);
    }
    console.log(`Degradation Risk:    ${riskLevel}`);

    if (compactionCount >= 3) {
      console.log("");
      console.log("⚠️  Recommendation: Consider exporting and starting fresh session");
      console.log("   Run: openclaw context export backup.json");
    }
  });
```

### Command Registration

**Location**: Extend `src/cli/index.ts`

```typescript
import { compactCommand } from "../commands/compact.js";
import { contextStatusCommand } from "../commands/context-status.js";
import { contextInspectCommand } from "../commands/context-inspect.js";
import { contextHistoryCommand } from "../commands/context-history.js";

// Add to CLI
const contextCommand = new Command("context")
  .description("Context management commands")
  .addCommand(contextStatusCommand)
  .addCommand(contextInspectCommand)
  .addCommand(contextHistoryCommand);

program.addCommand(compactCommand);
program.addCommand(contextCommand);
```

---

## Configuration Integration

### Config Schema Extension

**Location**: Extend `src/config/config.ts`

```typescript
export interface CompactionModelConfig {
  provider?: string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CompactionConfig {
  autoEnabled?: boolean;
  autoThresholdPercent?: number;
  preserveRecentTokens?: number;

  prune?: {
    enabled?: boolean;
    protectRecentTokens?: number;
    pruneMinimumTokens?: number;
  };

  notifyBeforeAuto?: boolean;
  maxAutoCompactions?: number;
  warnAtCompaction?: number;

  model?: CompactionModelConfig;
}

// Add to OpenClawConfig
export interface OpenClawConfig {
  // ... existing fields
  compaction?: CompactionConfig;
}
```

### Config Example

```yaml
# ~/.openclaw/config.yaml
compaction:
  autoEnabled: true
  autoThresholdPercent: 88
  preserveRecentTokens: 25000

  prune:
    enabled: true
    protectRecentTokens: 40000
    pruneMinimumTokens: 20000

  notifyBeforeAuto: true
  maxAutoCompactions: 4
  warnAtCompaction: 3

  model:
    # Use OpenRouter free model for cost-effective compaction
    provider: openrouter
    modelName: google/gemini-2.0-flash-exp:free
    temperature: 0.3
    maxTokens: 4000
```

---

## Degradation Protection

### Compaction Guard

**Location**: `src/agents/compaction-guard.ts` (NEW)

```typescript
export interface DegradationReport {
  compactionCount: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  informationLossEstimate: number; // Percentage
  recommendation: string;
}

export function evaluateDegradation(compactionCount: number): DegradationReport {
  const SOFT_LIMIT = 3;
  const HARD_LIMIT = 5;

  const riskLevel =
    compactionCount >= HARD_LIMIT
      ? "critical"
      : compactionCount >= SOFT_LIMIT
        ? "high"
        : compactionCount >= 2
          ? "medium"
          : "low";

  // Rough heuristic: each compaction loses ~10% information
  const informationLossEstimate = Math.min(90, compactionCount * 10);

  let recommendation: string;

  if (compactionCount >= HARD_LIMIT) {
    recommendation =
      `CRITICAL: ${compactionCount} compactions. Context quality significantly degraded.\n` +
      `Strongly recommend:\n` +
      `  1. openclaw context export backup.json\n` +
      `  2. Start fresh session\n` +
      `  3. openclaw context import backup.json`;
  } else if (compactionCount >= SOFT_LIMIT) {
    recommendation =
      `Session compacted ${compactionCount} times. Quality may be degrading.\n` +
      `Consider: openclaw context export → fresh session → import`;
  } else {
    recommendation = "Context quality is healthy.";
  }

  return {
    compactionCount,
    riskLevel,
    informationLossEstimate,
    recommendation,
  };
}

export function shouldBlockFurtherCompaction(
  compactionCount: number,
  config: { maxAutoCompactions: number },
): boolean {
  return compactionCount >= config.maxAutoCompactions;
}
```

---

## OpenRouter Integration

### Compaction Model Resolution

**Location**: Extend `src/agents/pi-embedded-runner/compact.ts`

```typescript
import type { OpenClawConfig } from "../../config/config.js";

function resolveCompactionModel(config?: OpenClawConfig): {
  provider: string;
  modelId: string;
} {
  const compactionConfig = config?.compaction?.model;

  if (compactionConfig?.provider && compactionConfig?.modelName) {
    return {
      provider: compactionConfig.provider,
      modelId: compactionConfig.modelName,
    };
  }

  // Default to OpenRouter free model if available
  if (hasOpenRouterKey(config)) {
    return {
      provider: "openrouter",
      modelId: "google/gemini-2.0-flash-exp:free",
    };
  }

  // Fall back to session model
  return {
    provider: DEFAULT_PROVIDER,
    modelId: DEFAULT_MODEL,
  };
}
```

---

## Testing Strategy

### Unit Tests

**Location**: Colocated with source files as `*.test.ts`

```typescript
// src/agents/compaction-boundary.test.ts
import { describe, it, expect } from "vitest";
import {
  loadSessionWithBoundary,
  findLatestCompactionEvent,
  countCompactionEvents,
} from "./compaction-boundary.js";

describe("loadSessionWithBoundary", () => {
  it("loads full history when no compaction exists", () => {
    const events = [
      { id: "msg-1", type: "message", role: "user", content: "Hello" },
      { id: "msg-2", type: "message", role: "assistant", content: "Hi" },
    ];

    const result = loadSessionWithBoundary(events);

    expect(result.compactionSummary).toBeNull();
    expect(result.messagesAfterBoundary).toHaveLength(2);
    expect(result.compactionCount).toBe(0);
  });

  it("loads only messages after boundary when compaction exists", () => {
    const events = [
      { id: "msg-1", type: "message", role: "user", content: "Old msg" },
      { id: "msg-2", type: "message", role: "assistant", content: "Old reply" },
      {
        id: "compact-1",
        type: "compaction",
        summary: "Previous context summary...",
        boundaryMessageId: "msg-2",
        timestamp: Date.now(),
      },
      { id: "msg-3", type: "message", role: "user", content: "New msg" },
    ];

    const result = loadSessionWithBoundary(events);

    expect(result.compactionSummary).toBe("Previous context summary...");
    expect(result.messagesAfterBoundary).toHaveLength(1);
    expect(result.messagesAfterBoundary[0].id).toBe("msg-3");
    expect(result.compactionCount).toBe(1);
  });

  it("handles multiple compactions correctly", () => {
    const events = [
      { id: "msg-1", type: "message", content: "Very old" },
      { id: "compact-1", type: "compaction", summary: "First summary" },
      { id: "msg-2", type: "message", content: "Old" },
      { id: "compact-2", type: "compaction", summary: "Second summary" },
      { id: "msg-3", type: "message", content: "Recent" },
    ];

    const result = loadSessionWithBoundary(events);

    // Should only use LATEST compaction
    expect(result.compactionSummary).toBe("Second summary");
    expect(result.messagesAfterBoundary).toHaveLength(1);
    expect(result.compactionCount).toBe(2);
  });
});
```

### Test Coverage Targets

- Boundary rule: 4 tests
- Compaction layers: 6 tests
- CLI commands: 8 tests
- Configuration: 3 tests
- Degradation tracking: 3 tests

**Total**: ~24 focused tests

---

## Performance Requirements

| Operation                  | Target | Max Acceptable |
| -------------------------- | ------ | -------------- |
| `openclaw compact`         | <10s   | 20s            |
| `openclaw context status`  | <1s    | 2s             |
| `openclaw context history` | <2s    | 5s             |
| Boundary-based loading     | <1s    | 3s             |
| Token counting             | <500ms | 1s             |

---

## Migration & Compatibility

### Backward Compatibility

- Existing sessions work without modification
- Sessions without CompactionEvent entries load full history
- No config migration required (new fields are optional)

### Forward Compatibility

- CompactionEvent has version field for future extensions
- Unknown event types ignored when loading

---

## Implementation Phases

### Phase 1: Foundation (3-4 days)

- CompactionEvent type
- Boundary-based loading
- Compaction count tracking
- Basic `compact` command

### Phase 2: Visibility (2-3 days)

- `context status` command
- `context history` command
- Degradation warnings

### Phase 3: Control (3-4 days)

- Configuration schema
- Layered triggers
- `autocompact` toggle
- OpenRouter model support

### Phase 4: Advanced (4-5 days)

- `context inspect` command
- Export/Import system
- Session branching

---

## References

### OpenClaw Source Files

- `src/agents/compaction.ts` - Core compaction utilities
- `src/agents/pi-embedded-runner/compact.ts` - Session compaction
- `src/agents/pi-extensions/compaction-safeguard.ts` - Safeguard extension
- `src/sessions/transcript-events.ts` - Event types

### External

- PLIP Context Compaction Specification (source spec)
- `@mariozechner/pi-coding-agent` SDK documentation

---

**Document Status**: ✅ Complete  
**Next Step**: See tasks.md for implementation breakdown
