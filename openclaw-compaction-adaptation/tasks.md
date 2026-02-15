# Context Compaction - Implementation Tasks (OpenClaw)

**Feature**: Multi-layered context management  
**Total Estimated Effort**: 10-14 iterations  
**Dependencies**: None (builds on existing OpenClaw foundation)

---

## Phase 1: Foundation (Iterations 1-4)

### Iteration 1: CompactionEvent Type & Transcript Integration

**Goal**: Define compaction event structure and integrate with session transcripts

**Files to Create/Modify:**

- `src/sessions/transcript-events.ts` - Extend with CompactionEvent type
- `src/agents/compaction-events.ts` - NEW: Event creation utilities

**Tasks:**

1. Define `CompactionEvent` interface in transcript-events.ts
2. Create helper functions for creating CompactionEvent
3. Add CompactionEvent to TranscriptEvent union type
4. Write serialization/deserialization tests

**Acceptance Criteria:**

- CompactionEvent can be serialized to NDJSON
- CompactionEvent can be parsed from NDJSON
- Type guards work correctly
- Tests: 3 tests (serialization, parsing, type guards)

**Code Snippet:**

```typescript
// src/sessions/transcript-events.ts
export interface CompactionEvent {
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
  boundaryMessageId: string;
}

export function isCompactionEvent(event: unknown): event is CompactionEvent {
  return (
    typeof event === "object" &&
    event !== null &&
    (event as { type?: unknown }).type === "compaction"
  );
}
```

---

### Iteration 2: Boundary-Based Session Loading

**Goal**: Implement boundary rule to prevent exponential context growth

**Files to Create/Modify:**

- `src/agents/compaction-boundary.ts` - NEW: Boundary loading logic
- `src/agents/compaction-boundary.test.ts` - NEW: Tests

**Tasks:**

1. Create `findLatestCompactionEvent()` function
2. Create `countCompactionEvents()` function
3. Create `loadSessionWithBoundary()` function
4. Write comprehensive tests for edge cases

**Acceptance Criteria:**

- Boundary loading works with 0 compactions (full history)
- Boundary loading works with 1 compaction (summary + recent)
- Boundary loading works with N compactions (only latest used)
- Context doesn't grow exponentially across compactions
- Tests: 5 tests (no compaction, single, multiple, edge cases)

**Critical Test:**

```typescript
it("prevents exponential context growth", () => {
  // Simulate 5 compactions
  const events = createEventsWithCompactions(5);
  const result = loadSessionWithBoundary(events);

  // Should only have summary from LAST compaction + recent messages
  // Not cumulative summaries from all 5 compactions
  expect(result.messagesAfterBoundary.length).toBeLessThan(100);
});
```

---

### Iteration 3: Compaction Count Tracking & Degradation Detection

**Goal**: Track compaction count and detect quality degradation

**Files to Create/Modify:**

- `src/agents/compaction-guard.ts` - NEW: Degradation tracking
- `src/agents/compaction-guard.test.ts` - NEW: Tests

**Tasks:**

1. Create `evaluateDegradation()` function
2. Create `shouldBlockFurtherCompaction()` function
3. Define risk levels (low/medium/high/critical)
4. Create recommendation generator

**Acceptance Criteria:**

- Compaction count tracked correctly
- Risk levels calculated correctly
- Recommendations actionable
- Tests: 4 tests (risk levels, recommendations, blocking)

---

### Iteration 4: Basic `compact` Command

**Goal**: Implement manual compaction CLI command

**Files to Create/Modify:**

- `src/commands/compact.ts` - NEW: CLI command
- `src/cli/index.ts` - Register command

**Tasks:**

1. Create compact command with --focus and --dry-run options
2. Integrate with existing `compactEmbeddedPiSession()`
3. Add confirmation prompt
4. Display before/after token counts
5. Append CompactionEvent to session transcript

**Acceptance Criteria:**

- `openclaw compact` triggers compaction
- `--dry-run` shows preview without compacting
- `--focus` passes custom instructions
- CompactionEvent written to session file
- Tests: 4 tests (basic, dry-run, focus, event writing)

**CLI Output:**

```
$ openclaw compact
Current context: 187,450 tokens (94% of limit)

Proceed with compaction? [y/N] y

Compacting...
✓ Compacted 142 messages
  187,450 → 48,320 tokens (saved 139,130 tokens)
```

---

## Phase 2: Visibility (Iterations 5-6)

### Iteration 5: `context status` Command

**Goal**: Implement context status visibility command

**Files to Create/Modify:**

- `src/commands/context-status.ts` - NEW: Status command
- `src/cli/index.ts` - Register command

**Tasks:**

1. Create context status command
2. Show total tokens and usage percentage
3. Show compaction count and last compaction time
4. Show degradation risk level
5. Show actionable recommendations

**Acceptance Criteria:**

- Token count displayed accurately
- Compaction history summarized
- Risk level shown
- Tests: 3 tests (display, calculations, recommendations)

**CLI Output:**

```
$ openclaw context status
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

### Iteration 6: `context history` Command & Degradation Warnings

**Goal**: Implement compaction history view and warning system

**Files to Create/Modify:**

- `src/commands/context-history.ts` - NEW: History command
- `src/agents/pi-embedded-runner/run.ts` - Add warning emissions

**Tasks:**

1. Create context history command
2. Display chronological compaction events
3. Show trigger type, layer, and token savings
4. Add warning emissions to run loop
5. Display warnings in session output

**Acceptance Criteria:**

- History shows all compaction events
- Events sorted by time (newest first)
- Warnings emitted at 3+ compactions
- Strong warnings at 5+ compactions
- Tests: 4 tests (history display, sorting, warnings)

**CLI Output:**

```
$ openclaw context history
Compaction History
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[2 hours ago] AUTO - Layer: summarize
  187,450 → 48,320 tokens
  Compacted: 142 messages
  Trigger:   88% threshold reached

[5 hours ago] MANUAL - Layer: summarize
  165,230 → 52,140 tokens
  Compacted: 118 messages
  Focus:     "Preserve API design decisions"

Total Compactions: 2
Risk Level:        Low
```

---

## Phase 3: Control (Iterations 7-9)

### Iteration 7: Configuration Schema

**Goal**: Add compaction configuration to OpenClaw config

**Files to Create/Modify:**

- `src/config/config.ts` - Extend with CompactionConfig
- `src/config/schema.ts` - Add validation schema
- `src/agents/compaction-config.ts` - NEW: Config helpers

**Tasks:**

1. Define CompactionConfig interface
2. Add to OpenClawConfig
3. Create config validation
4. Create config resolution with defaults
5. Document config options

**Acceptance Criteria:**

- Config schema validates correctly
- Defaults applied for missing values
- Invalid configs rejected with helpful errors
- Tests: 4 tests (validation, defaults, resolution)

**Config Example:**

```yaml
compaction:
  autoEnabled: true
  autoThresholdPercent: 88
  preserveRecentTokens: 25000
  warnAtCompaction: 3
  model:
    provider: openrouter
    modelName: google/gemini-2.0-flash-exp:free
```

---

### Iteration 8: Layered Triggers & Auto-Compaction

**Goal**: Implement layered compaction triggers

**Files to Create/Modify:**

- `src/agents/compaction-layers.ts` - NEW: Layer logic
- `src/agents/pi-embedded-runner/run.ts` - Add threshold checks

**Tasks:**

1. Create layer configuration (prune/summarize/full)
2. Implement `selectCompactionLayer()` function
3. Add threshold checks to message handling loop
4. Trigger appropriate layer based on context state

**Acceptance Criteria:**

- Layer 1 (prune) triggers at 80% with high tool output
- Layer 2 (summarize) triggers at 88%
- Layer 3 (full) triggers at 95%
- Correct layer selected based on conditions
- Tests: 5 tests (layer selection, triggers, conditions)

---

### Iteration 9: `autocompact` Toggle & OpenRouter Support

**Goal**: Implement auto-compaction toggle and OpenRouter model support

**Files to Create/Modify:**

- `src/commands/autocompact.ts` - NEW: Toggle command
- `src/agents/pi-embedded-runner/compact.ts` - Add model resolution

**Tasks:**

1. Create autocompact toggle command
2. Persist setting to config
3. Implement OpenRouter model resolution for compaction
4. Fall back to session model if OpenRouter unavailable

**Acceptance Criteria:**

- `openclaw autocompact on/off` works
- Setting persists across sessions
- OpenRouter free model used when configured
- Graceful fallback when unavailable
- Tests: 3 tests (toggle, persistence, model resolution)

**CLI Output:**

```
$ openclaw autocompact
Auto-compaction setting:

  ◉ Enabled (triggers at 176,000 tokens / 88%)
  ◯ Disabled (manual /compact only)

$ openclaw autocompact off
✓ Auto-compaction disabled

⚠️  Warning: You must manually compact when approaching context limit
Use: openclaw compact
```

---

## Phase 4: Advanced (Iterations 10-14)

### Iteration 10: `context inspect` Command

**Goal**: Implement detailed context inspection

**Files to Create/Modify:**

- `src/commands/context-inspect.ts` - NEW: Inspect command

**Tasks:**

1. Create context inspect command
2. Show breakdown by category (messages, tool outputs, system)
3. Show potential savings per layer
4. Show pinned messages (stub for future)

**Acceptance Criteria:**

- Breakdown shown correctly
- Potential savings calculated
- Tests: 3 tests (breakdown, savings calculation)

---

### Iteration 11: Export System

**Goal**: Implement context export for fresh start

**Files to Create/Modify:**

- `src/commands/context-export.ts` - NEW: Export command
- `src/agents/context-export.ts` - NEW: Export logic

**Tasks:**

1. Define export JSON schema
2. Extract key information from session
3. Create structured export file
4. Support --format option (structured/raw)

**Acceptance Criteria:**

- Export creates valid JSON
- Key information extracted correctly
- File size reasonable
- Tests: 4 tests (schema, extraction, formats)

**Export Schema:**

```json
{
  "version": "1.0",
  "exportedAt": 1707825600,
  "sessionId": "session-abc",
  "summary": "Session worked on refactoring...",
  "keyFiles": {
    "read": ["src/index.ts", "src/config.ts"],
    "modified": ["src/utils.ts"]
  },
  "openQuestions": ["How to handle edge case X?"],
  "nextSteps": ["Add tests for utils.ts"],
  "metadata": {
    "totalMessages": 142,
    "compactionCount": 2,
    "durationHours": 6.5
  }
}
```

---

### Iteration 12: Import System

**Goal**: Implement context import for fresh start

**Files to Create/Modify:**

- `src/commands/context-import.ts` - NEW: Import command
- `src/agents/context-import.ts` - NEW: Import logic

**Tasks:**

1. Parse export JSON
2. Create new session
3. Inject context as initial system message
4. Set up fresh session state (0 compactions)

**Acceptance Criteria:**

- Import creates new session
- Context loaded correctly
- Session starts fresh (no compaction count)
- Tests: 3 tests (parsing, session creation, context injection)

---

### Iteration 13: Session Branching

**Goal**: Implement session branching at decision points

**Files to Create/Modify:**

- `src/commands/session-branch.ts` - NEW: Branch command
- `src/agents/session-branch.ts` - NEW: Branch logic

**Tasks:**

1. Create session branch command
2. Implement interactive branch point selector
3. Use raw line copying (no re-serialization)
4. Generate new session ID

**Acceptance Criteria:**

- Branch creates new session file
- Raw lines preserved exactly
- Interactive selector works
- Tests: 4 tests (copying, formatting preservation, selection)

---

### Iteration 14: Message Pinning (Stub)

**Goal**: Stub out message pinning for future implementation

**Files to Create/Modify:**

- `src/commands/context-pin.ts` - NEW: Pin commands (stub)
- `src/sessions/transcript-events.ts` - Add PinEvent type (stub)

**Tasks:**

1. Add pin/unpin commands (return "coming soon")
2. Define PinEvent type (for future)
3. Document planned behavior

**Acceptance Criteria:**

- Commands exist and provide helpful message
- Types defined for future implementation

---

## Testing Summary

**Total Tests**: ~45 tests

**By Phase:**

- Phase 1 (Foundation): 16 tests
- Phase 2 (Visibility): 7 tests
- Phase 3 (Control): 12 tests
- Phase 4 (Advanced): 10 tests

**Test Categories:**

1. CompactionEvent serialization: 3 tests
2. Boundary loading: 5 tests
3. Degradation tracking: 4 tests
4. CLI commands: 12 tests
5. Configuration: 4 tests
6. Layered triggers: 5 tests
7. Export/Import: 7 tests
8. Session branching: 4 tests

---

## Risk Mitigation

### Risk 1: Breaking existing sessions

- **Mitigation**: CompactionEvent is additive, existing sessions work unchanged
- **Tests**: Load sessions without CompactionEvent, verify full history loads

### Risk 2: Compaction corrupts session

- **Mitigation**: Atomic writes (temp file → rename), session locking
- **Tests**: Simulate interruption during compaction

### Risk 3: Performance degradation

- **Mitigation**: Use fast/free models via OpenRouter, async operations
- **Tests**: Performance benchmarks

### Risk 4: SDK compatibility

- **Mitigation**: Work with existing `pi-coding-agent` patterns
- **Tests**: Integration tests with SDK

---

## Contribution Guidelines

### Getting Started

```bash
# Clone and setup
git clone https://github.com/YOUR_FORK/openclaw.git
cd openclaw
pnpm install

# Create feature branch
git checkout -b feat/context-compaction-phase1

# Make changes following task breakdown

# Test
pnpm build && pnpm check && pnpm test

# Commit using OpenClaw convention
scripts/committer "compaction: add CompactionEvent type" src/sessions/transcript-events.ts
```

### PR Structure

**Recommended PR per phase:**

- PR 1: Phase 1 (Foundation) - CompactionEvent, boundary loading, basic compact
- PR 2: Phase 2 (Visibility) - status, history commands, warnings
- PR 3: Phase 3 (Control) - config, layers, auto-compaction
- PR 4: Phase 4 (Advanced) - inspect, export/import, branching

### Review Checklist

- [ ] Tests pass: `pnpm test`
- [ ] Types check: `pnpm build`
- [ ] Lint passes: `pnpm check`
- [ ] Existing commands still work
- [ ] Documentation updated (if user-facing)
- [ ] Changelog entry added

---

## Post-Implementation

### Future Enhancements (Not in Scope)

1. Agent-specific compaction prompts
2. Per-agent token budgets
3. Cross-agent handoff (multi-agent scenarios)
4. Visual compaction timeline
5. Compaction quality metrics

### Success Metrics

- Sessions run 3-5x longer than context window
- Compaction time < 10s for 100K tokens
- Zero session corruption incidents
- Positive user feedback on visibility

---

**Status**: ✅ Ready for Implementation  
**Estimated Duration**: 2-3 weeks (at 1-2 iterations/day)
