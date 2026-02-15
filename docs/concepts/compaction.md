---
summary: "Context window + compaction: how OpenClaw keeps sessions under model limits"
read_when:
  - You want to understand auto-compaction and /compact
  - You are debugging long sessions hitting context limits
  - You want to monitor session health and degradation
title: "Compaction"
---

# Context Window & Compaction

Every model has a **context window** (max tokens it can see). Long-running chats accumulate messages and tool results; once the window is tight, OpenClaw **compacts** older history to stay within limits.

## What compaction is

Compaction **summarizes older conversation** into a compact summary entry and keeps recent messages intact. The summary is stored in the session history, so future requests use:

- The compaction summary
- Recent messages after the compaction point

Compaction **persists** in the session's JSONL history.

## Configuration

See [Compaction config & modes](/gateway/configuration#agentsdefaultscompaction) for the `agents.defaults.compaction` settings:

```json5
{
  agents: {
    defaults: {
      compaction: {
        // Compaction mode: "safeguard" (default) | "aggressive"
        mode: "safeguard",
        // Enable auto-compaction (default: true)
        auto: true,
        // Reserve tokens floor (default: 9000)
        reserveTokensFloor: 9000,
        // Max auto-compactions before blocking (default: 3)
        maxAutoCompactions: 3,
        // Warn at this many compactions (default: 2)
        warnAtCompaction: 2,
        // Pre-compaction memory flush settings
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 10000,
          prompt: "Write concise notes.",
        },
      },
    },
  },
}
```

## Auto-compaction (default on)

When a session nears or exceeds the model's context window, OpenClaw triggers auto-compaction and may retry the original request using the compacted context.

You'll see:

- `🧹 Auto-compaction complete` in verbose mode
- `/status` showing `🧹 Compactions: <count>`

Before compaction, OpenClaw can run a **silent memory flush** turn to store
durable notes to disk. See [Memory](/concepts/memory) for details and config.

### Layered auto-compaction

Auto-compaction uses **layered triggers** that activate at different context usage levels:

| Layer                  | Trigger                                   | Action                          | Protected         |
| ---------------------- | ----------------------------------------- | ------------------------------- | ----------------- |
| **Layer 1: Prune**     | Tool outputs > 50K tokens AND total > 80% | Drop verbose logs, keep results | Recent 40K tokens |
| **Layer 2: Summarize** | Total > 88%                               | LLM summarization               | Recent 25K tokens |
| **Layer 3: Full**      | Total > 95%                               | Full conversation summary       | Pinned messages   |

You can configure threshold percentages in `agents.defaults.compaction.layers`.

## Manual compaction

Use `/compact` (optionally with instructions) to force a compaction pass:

```
/compact Focus on decisions and open questions
```

Or use the CLI command:

```bash
openclaw compact --session agent:main:1 --focus "Preserve technical details"
```

## Context management commands

OpenClaw provides several CLI commands for visibility and control:

### `openclaw context status`

Show session context health and recommendations:

```bash
openclaw context status --session agent:main:1
```

Output includes:

- Current tokens vs context window
- Compaction count and degradation risk
- Recommendations (e.g., "Consider compacting soon")

### `openclaw context history`

View compaction history for a session:

```bash
openclaw context history --session agent:main:1
```

Shows all past compactions with timestamps, tokens before/after, and triggers.

### `openclaw context inspect`

Deep-dive into session context breakdown:

```bash
openclaw context inspect --session agent:main:1
```

Shows:

- Messages count and token distribution
- Compaction events and boundaries
- Token usage by message type

### `openclaw context export`

Export session context for backup or fresh start:

```bash
openclaw context export --session agent:main:1 --output backup.json
```

Exports in `structured` (default) or `raw` format. The export includes all messages and compaction events.

### `openclaw context import`

Import previously exported context into a new session:

```bash
openclaw context import --input backup.json --session agent:main:2
```

### `openclaw autocompact`

Toggle auto-compaction on/off:

```bash
openclaw autocompact on
openclaw autocompact off
openclaw autocompact  # shows status
```

## Degradation detection

After multiple compactions, sessions may degrade in quality. OpenClaw tracks:

- **Compaction count**: Total compactions for the session
- **Degradation warning**: Shown in `/status` when exceeding `warnAtCompaction` threshold
- **Auto-compaction blocking**: After `maxAutoCompactions`, further auto-compaction is blocked to prevent quality degradation

Use `/new` or `/reset` to start fresh when degradation is detected.

## Boundary-based session loading

Compaction creates **boundaries** in session history. When loading sessions:

- Messages **before** the boundary are summarized in the compaction event
- Messages **after** the boundary are loaded as recent context
- This prevents exponential context growth across multiple compactions

## Session branching

Create decision-point forks using session branching:

```bash
openclaw sessions branch --session agent:main:1 --name "experiment"
```

Branching creates a new session that continues from the current state, allowing you to explore different paths without affecting the original session.

## Message pinning (preview)

Pin important messages to protect them from compaction:

```bash
openclaw context pin --session agent:main:1 --message-id <id>
openclaw context unpin --session agent:main:1 --message-id <id>
```

Pinned messages are preserved through compactions. This feature is in preview; see [configuration](/gateway/configuration#agentsdefaultscompaction) for details.

## Context window source

Context window is model-specific. OpenClaw uses the model definition from the configured provider catalog to determine limits.

## Compaction vs pruning

- **Compaction**: summarises and **persists** in JSONL.
- **Session pruning**: trims old **tool results** only, **in-memory**, per request.

See [/concepts/session-pruning](/concepts/session-pruning) for pruning details.

## Tips

- Use `/compact` when sessions feel stale or context is bloated.
- Monitor degradation with `/status` — if compaction count is high, consider `/new`.
- Large tool outputs are already truncated; pruning can further reduce tool-result buildup.
- Export context before `/reset` if you need to preserve knowledge.
- If you need a fresh slate, `/new` or `/reset` starts a new session id.
- Use message pinning for critical information you can't lose.
