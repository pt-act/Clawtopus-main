# Context Compaction System

Advanced context management that optimizes token usage while preserving critical information, enabling longer conversations without hitting context window limits.

## Overview

As conversations grow, they eventually exceed AI model context windows. Traditional approaches simply truncate or summarize. Clawtopus uses **layered compaction** that intelligently preserves what matters.

## The Problem

**Traditional truncation:**

- Loses important context randomly
- No audit trail of what was removed
- Can't recover compacted information
- Exponential growth continues

**Clawtopus compaction:**

- Layered strategies preserve critical info
- Audit trail via transcript events
- Configurable preservation rules
- Boundary-based loading prevents growth

## Compaction Strategies

### Layer 1: Semantic Chunking

Group related messages before compaction:

```typescript
// Messages grouped by topic
[Auth Discussion]
  - "How should we handle auth?"
  - "JWT tokens vs sessions"
  - "Decision: Use JWT"

[Database Schema]
  - "Design user table"
  - "Add fields: email, password_hash"
  - "Add indexes"
```

### Layer 2: Hierarchical Summarization

Multi-level summary preservation:

```
Level 3 (Highest): Core decisions, key insights
Level 2 (Medium):   Topic summaries, action items
Level 1 (Lowest):   Full conversation (compacted last)
```

### Layer 3: Smart Preservation

Always preserve:

- ✅ User decisions and preferences
- ✅ Code implementations
- ✅ Error messages and solutions
- ✅ TODOs and action items
- ✅ URLs and references

Compact first:

- 💭 Brainstorming discussion
- 🔄 Repetitive explanations
- 📊 Examples (keep representative few)

## Transcript Events

Every compaction is logged:

```ndjson
{"type": "compaction", "timestamp": "2025-03-01T10:00:00Z", "strategy": "semantic_chunking", "tokens_before": 8000, "tokens_after": 6000, "chunks_affected": 3}
{"type": "compaction", "timestamp": "2025-03-01T10:30:00Z", "strategy": "hierarchical_summary", "tokens_before": 6000, "tokens_after": 4000, "level": 2}
```

**Benefits:**

- Full audit trail
- Recover compacted info if needed
- Understand what was lost
- Optimize strategies over time

## Configuration

### Automatic Compaction

```typescript
// Auto-compact when context reaches threshold
autoCompact: {
  enabled: true,
  threshold: 0.8,        // 80% of context window
  strategy: 'layered',   // semantic → hierarchical → boundary
  preserve: ['code', 'decisions', 'todos']
}
```

### Manual Control

```bash
# View context statistics
clawtopus context stats

# Show compaction history
clawtopus context history

# Manually trigger compaction
clawtopus context compact --strategy semantic

# Export context before compaction
clawtopus context export --output session-backup.json

# Import previous context
clawtopus context import session-backup.json
```

## Boundary-Based Session Loading

Prevent exponential growth from the start:

```typescript
// New session only loads boundary, not full history
sessionStart: {
  loadBoundary: true,      // Last 5 messages + all decisions
  loadFullHistory: false,  // Don't load everything
  boundarySize: 5
}
```

**Boundary includes:**

- Last 5 messages (recent context)
- All user decisions
- All code implementations
- All TODOs
- Session summary (auto-generated)

## Degradation Warnings

Users are informed when compaction affects quality:

```
⚠️  Context Compacted
   Strategy: Hierarchical summarization
   Tokens: 8000 → 4000 (50% reduction)

   Preserved: 12 decisions, 8 code blocks, 5 TODOs
   Compacted: 23 discussion messages

   Some context may be less detailed.
   Type 'context history' to see what was compacted.
```

## Export/Import System

**Fresh start without losing knowledge:**

```bash
# Export compacted context
clawtopus context export --format json --output my-session.json

# Start fresh session
clawtopus session new

# Import key decisions only
clawtopus context import my-session.json --filter decisions,code
```

**Use cases:**

- Archive old sessions
- Share context with team
- Migrate between devices
- Backup before major changes

## Performance Impact

**Without compaction:**

- Context growth: Linear → Exponential
- Cost: Increases with every message
- Quality: Degrades when truncated
- Latency: Increases with context size

**With compaction:**

- Context growth: Controlled, bounded
- Cost: Stable after initial threshold
- Quality: Preserved via smart strategies
- Latency: Consistent regardless of session length

## Integration with OpenRouter

Optimized for cost-effective models:

```typescript
// Use cheaper models for compaction
compactionModel: {
  provider: 'openrouter',
  model: 'anthropic/claude-3-haiku',  // Cheap, fast
  // vs claude-3-opus for main work
}

// Only summarize with smart models
summaryModel: {
  provider: 'openrouter',
  model: 'anthropic/claude-3-sonnet'
}
```

## CLI Commands

```bash
# Context management
clawtopus context stats                    # Show token usage
clawtopus context history                  # Show compaction events
clawtopus context compact                  # Manual compaction
clawtopus context export [file]            # Export context
clawtopus context import [file]            # Import context
clawtopus context config                   # Show/edit configuration

# Session boundaries
clawtopus session new --with-boundary      # Start with boundary only
clawtopus session resume --full-history    # Resume with everything
```

## Implementation Details

**Core modules:**

- `src/compaction/layered-strategy.ts` — Multi-level compaction
- `src/compaction/transcript-events.ts` — Event logging
- `src/compaction/boundary-loader.ts` — Session boundaries
- `src/commands/context.ts` — CLI commands

**Storage:**

- Compaction events: Session NDJSON file
- Boundaries: `~/.clawtopus/boundaries/`
- Exports: User-specified location

## Consciousness Alignment

**Score**: 8.8/10

- **Glass-box transparency**: Every compaction logged and auditable
- **Truth over theater**: Genuine preservation of what matters
- **Elegant systems**: Layered approach (simple components, complex behavior)
- **Consciousness expansion**: Enables longer, deeper conversations

## See Also

- [Memory Bank](./memory-bank.md) — Persistent project memory
- [Session Brain](./session-brain.md) — Cross-session persistence
- [Dual-Memory Architecture](./dual-memory-architecture.md) — Platform vs project memory
- [OpenClaw Compaction Spec](../specs/openclaw-compaction-adaptation/spec.md) — Technical specification
