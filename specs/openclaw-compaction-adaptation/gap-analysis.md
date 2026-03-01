# Gap Analysis: OpenClaw Current State vs. PLIP Compaction Spec

## Executive Summary

OpenClaw has a **functional compaction system** but lacks several advanced features proposed in the PLIP specification. This analysis identifies what exists, what's missing, and what needs adaptation.

---

## 1. Current OpenClaw Compaction Architecture

### Files & Responsibilities

| File                                               | Purpose                                                               | Status    |
| -------------------------------------------------- | --------------------------------------------------------------------- | --------- |
| `src/agents/compaction.ts`                         | Core compaction utilities (token estimation, chunking, summarization) | ✅ Exists |
| `src/agents/pi-embedded-runner/compact.ts`         | Session compaction runner with lane queueing                          | ✅ Exists |
| `src/agents/pi-extensions/compaction-safeguard.ts` | Summarization fallbacks, file operation tracking                      | ✅ Exists |
| `src/agents/pi-extensions/context-pruning.ts`      | In-memory context pruning ("microcompact")                            | ✅ Exists |
| `src/agents/context-window-guard.ts`               | Context window size validation                                        | ✅ Exists |
| `src/agents/pi-embedded-runner/history.ts`         | History turn limiting                                                 | ✅ Exists |

### Existing Capabilities

```
┌─────────────────────────────────────────────────────────────┐
│              OPENCLAW CURRENT COMPACTION                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ✅ Token Estimation                                         │
│    - estimateTokens(), estimateMessagesTokens()            │
│    - stripToolResultDetails() for security                  │
│                                                             │
│ ✅ Chunking                                                  │
│    - splitMessagesByTokenShare() - equal parts             │
│    - chunkMessagesByMaxTokens() - max size chunks          │
│    - computeAdaptiveChunkRatio() - dynamic sizing          │
│                                                             │
│ ✅ Summarization                                             │
│    - generateSummary() from pi-coding-agent SDK            │
│    - summarizeInStages() - multi-pass summarization        │
│    - summarizeWithFallback() - graceful degradation        │
│                                                             │
│ ✅ History Pruning                                           │
│    - pruneHistoryForContextShare() - budget-based          │
│    - limitHistoryTurns() - turn count limiting             │
│    - repairToolUseResultPairing() - orphan cleanup         │
│                                                             │
│ ✅ Context Window Guard                                      │
│    - resolveContextWindowInfo() - window size detection    │
│    - evaluateContextWindowGuard() - warn/block thresholds  │
│                                                             │
│ ✅ Compaction Safeguards                                     │
│    - Tool failure collection and formatting                │
│    - File operation tracking (read/modified lists)         │
│    - Fallback summaries when LLM unavailable               │
│                                                             │
│ ✅ Context Pruning Extension                                 │
│    - In-memory pruning for current request                 │
│    - Configurable via ContextPruningConfig                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. PLIP Spec Features vs. OpenClaw Status

### Layer 1: Tool Output Pruning

| Feature                    | OpenClaw                                     | PLIP              | Gap                      |
| -------------------------- | -------------------------------------------- | ----------------- | ------------------------ |
| Strip verbose tool outputs | ✅ `stripToolResultDetails()`                | ✅                | None                     |
| Protect recent N tokens    | ⚠️ Partial (via pruneHistoryForContextShare) | ✅ 40K protection | Needs explicit threshold |
| Configurable prune minimum | ❌                                           | ✅ 20K minimum    | **Missing**              |
| Trigger at 80% context     | ❌                                           | ✅                | **Missing**              |

**Gap**: OpenClaw has the pruning functions but lacks the **trigger thresholds** and **explicit protection windows**.

---

### Layer 2: Agent Memory Summarization

| Feature                   | OpenClaw                         | PLIP                              | Gap         |
| ------------------------- | -------------------------------- | --------------------------------- | ----------- |
| Multi-stage summarization | ✅ `summarizeInStages()`         | ✅                                | None        |
| Agent-specific prompts    | ❌                               | ✅ (Strategist, Pulse, Quant)     | **Missing** |
| Per-agent token budgets   | ❌                               | ✅ (35K for Quant, 15K for Pulse) | **Missing** |
| Adaptive chunk ratio      | ✅ `computeAdaptiveChunkRatio()` | ✅                                | None        |

**Gap**: OpenClaw uses generic summarization. PLIP proposes **agent-specific prompts** that preserve domain-critical information (e.g., "never round numbers" for Quant).

---

### Layer 3: Cross-Agent Handoff

| Feature                               | OpenClaw | PLIP                 | Gap         |
| ------------------------------------- | -------- | -------------------- | ----------- |
| Context transformation between agents | ❌       | ✅ YAML handoff docs | **Missing** |
| Inherited constraints                 | ❌       | ✅                   | **Missing** |
| Open questions flagging               | ❌       | ✅                   | **Missing** |

**Gap**: OpenClaw doesn't have explicit cross-agent handoff. This is a **new feature**.

---

### Layer 4: Full Compaction

| Feature                         | OpenClaw                      | PLIP | Gap         |
| ------------------------------- | ----------------------------- | ---- | ----------- |
| Full conversation summarization | ✅ `session.compact()`        | ✅   | None        |
| Pinned messages protection      | ❌                            | ✅   | **Missing** |
| User cancellation               | ❌                            | ✅   | **Missing** |
| Custom instructions             | ✅ `customInstructions` param | ✅   | None        |

**Gap**: OpenClaw lacks **message pinning** and **user cancellation** flows.

---

### Session Management

| Feature                      | OpenClaw | PLIP                    | Gap              |
| ---------------------------- | -------- | ----------------------- | ---------------- |
| Compaction events in session | ❌       | ✅ CompactionEvent type | **Missing**      |
| Boundary-based loading       | ❌       | ✅                      | **Critical Gap** |
| Compaction count tracking    | ❌       | ✅                      | **Missing**      |
| Session branching            | ❌       | ✅ Raw line copying     | **Missing**      |
| Export/Import                | ❌       | ✅ Structured JSON      | **Missing**      |

**Critical Gap**: Without **boundary-based loading**, sessions grow exponentially across compactions. This is the **most important gap** to address.

---

### CLI Commands

| Command             | OpenClaw | PLIP                        | Gap         |
| ------------------- | -------- | --------------------------- | ----------- |
| `compact`           | ❌       | ✅ Manual compaction        | **Missing** |
| `context status`    | ❌       | ✅ Token usage view         | **Missing** |
| `context inspect`   | ❌       | ✅ Detailed breakdown       | **Missing** |
| `context history`   | ❌       | ✅ Compaction timeline      | **Missing** |
| `context pin/unpin` | ❌       | ✅ Message protection       | **Missing** |
| `context export`    | ❌       | ✅ Knowledge extraction     | **Missing** |
| `context import`    | ❌       | ✅ Fresh session start      | **Missing** |
| `session branch`    | ❌       | ✅ Branch at decision point | **Missing** |
| `autocompact`       | ❌       | ✅ Toggle setting           | **Missing** |

**Gap**: All CLI commands are **missing**. OpenClaw compaction is currently only triggered programmatically.

---

### Auto-Compaction Lifecycle

| Feature                   | OpenClaw                         | PLIP                                                 | Gap                      |
| ------------------------- | -------------------------------- | ---------------------------------------------------- | ------------------------ |
| Trigger at threshold      | ⚠️ Partial (via pi-coding-agent) | ✅ 88% trigger                                       | Needs explicit threshold |
| 6-step lifecycle          | ❌                               | ✅ Unsubscribe→Abort→Wait→Compact→Reload→Resubscribe | **Missing**              |
| Race condition prevention | ⚠️ Via session write lock        | ✅ Full lifecycle                                    | Partial coverage         |

**Gap**: OpenClaw has locking but lacks the **full auto-compaction lifecycle** with explicit stream management.

---

### Degradation Protection

| Feature                       | OpenClaw | PLIP | Gap         |
| ----------------------------- | -------- | ---- | ----------- |
| Compaction count tracking     | ❌       | ✅   | **Missing** |
| Soft warning at 3 compactions | ❌       | ✅   | **Missing** |
| Hard warning at 5 compactions | ❌       | ✅   | **Missing** |
| Export recommendation         | ❌       | ✅   | **Missing** |

**Gap**: OpenClaw doesn't track compaction count or warn about quality degradation.

---

### Configuration

| Feature                        | OpenClaw               | PLIP                         | Gap             |
| ------------------------------ | ---------------------- | ---------------------------- | --------------- |
| Compaction settings            | ⚠️ Via SettingsManager | ✅ Full YAML config          | Needs extension |
| Agent overrides                | ❌                     | ✅ Per-agent thresholds      | **Missing**     |
| Model selection for compaction | ⚠️ Uses session model  | ✅ Separate compaction model | Partial         |

**Gap**: OpenClaw needs **compaction-specific configuration section** with agent overrides.

---

## 3. Integration Points

### Where to Add New Code

```
src/
├── agents/
│   ├── compaction.ts                    # Extend with layers
│   ├── compaction-config.ts             # NEW: Configuration
│   ├── compaction-events.ts             # NEW: Event types
│   ├── compaction-boundary.ts           # NEW: Boundary logic
│   ├── compaction-prompts/              # NEW: Agent-specific prompts
│   │   ├── default.md
│   │   ├── strategist.md
│   │   ├── pulse.md
│   │   └── quant.md
│   ├── pi-embedded-runner/
│   │   ├── compact.ts                   # Extend lifecycle
│   │   └── auto-compact.ts              # NEW: Auto-compaction manager
│   └── pi-extensions/
│       ├── compaction-safeguard.ts      # Extend with pinning
│       └── context-pruning.ts           # Extend with thresholds
├── commands/
│   ├── compact.ts                       # NEW: Manual compact command
│   ├── context-status.ts                # NEW: Status command
│   ├── context-inspect.ts               # NEW: Inspect command
│   ├── context-history.ts               # NEW: History command
│   ├── context-pin.ts                   # NEW: Pin/unpin commands
│   ├── context-export.ts                # NEW: Export command
│   ├── context-import.ts                # NEW: Import command
│   ├── session-branch.ts                # NEW: Branch command
│   └── autocompact.ts                   # NEW: Toggle command
└── sessions/
    └── transcript-events.ts             # Extend with CompactionEvent
```

### SDK Integration

OpenClaw uses `@mariozechner/pi-coding-agent` which provides:

- `SessionManager` - session file read/write
- `SettingsManager` - configuration management
- `generateSummary()` - LLM summarization
- `estimateTokens()` - token counting

New features should integrate with these existing APIs.

---

## 4. Priority Ranking

### Critical (Must Have)

1. **Boundary-based session loading** - Prevents exponential growth
2. **Compaction events in transcript** - Audit trail
3. **Compaction count tracking** - Degradation awareness
4. **CLI `compact` command** - Manual control

### High (Should Have)

5. **CLI `context status`** - Visibility
6. **Degradation warnings** - User transparency
7. **Layered triggers (80%/88%/95%)** - Proactive compaction
8. **Configuration section** - User customization

### Medium (Nice to Have)

9. **Agent-specific prompts** - Domain preservation
10. **Message pinning** - Protection
11. **Export/Import** - Fresh start
12. **Session branching** - Exploration

### Low (Future)

13. **Cross-agent handoff** - Multi-agent scenarios
14. **Per-agent token budgets** - Fine-tuning
15. **Compaction quality metrics** - Measurement

---

## 5. OpenRouter Integration Note

The user's fork includes OpenRouter free models support. For compaction:

```yaml
compaction:
  model:
    provider: "openrouter"
    model_name: "google/gemini-2.0-flash-exp:free" # Free tier
    temperature: 0.3
    max_tokens: 4000
```

This allows cost-effective compaction using free models while preserving session quality.

---

## 6. Recommended Approach

### Phase 1: Foundation (Iterations 1-3)

- CompactionEvent type
- Boundary-based loading
- Compaction count tracking
- Basic `compact` command

### Phase 2: Visibility (Iterations 4-5)

- `context status` command
- Degradation warnings
- Footer UI updates

### Phase 3: Control (Iterations 6-8)

- Configuration section
- Layered triggers
- `autocompact` toggle
- `context history` command

### Phase 4: Advanced (Iterations 9-12)

- Message pinning
- Export/Import
- Session branching
- Agent-specific prompts

---

**Next Step**: See `spec.md` for detailed technical specification and `tasks.md` for implementation breakdown.
