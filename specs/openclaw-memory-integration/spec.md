# OpenClaw Memory Integration - Specification

## Goal

Add lifelong memory capabilities to OpenClaw by integrating Code-Voyager and SimpleMem, enabling session continuity, semantic retrieval, and automated skill generation.

## User Stories

1. **Session Continuity**: User can resume a session and ask "what were we working on?" - agent retrieves goals, decisions, and progress from previous sessions
2. **Semantic Recall**: User can search past sessions with natural language queries - agent finds relevant context even in compacted sessions
3. **Smart Compaction**: Agent extracts atomic facts during compaction - preserves factual information rather than flat summaries
4. **Skill Automation**: Agent observes workflows and auto-generates skills - reduces repetitive prompting

## Requirements

### 1. Session Brain (Code-Voyager)

| Requirement | Description                                                                      |
| ----------- | -------------------------------------------------------------------------------- |
| BR-1        | Store session state (goals, decisions, progress) to `.claude/voyager/brain.json` |
| BR-2        | Load brain context on session start via pre-session hook                         |
| BR-3        | Update brain on session end and before compaction                                |
| BR-4        | Support `openclaw memory brain update` and `openclaw memory brain inject`        |
| BR-5        | Track: current goal, recent decisions, next steps, blocked items                 |

### 2. Enhanced Compaction (SimpleMem)

| Requirement | Description                                                                         |
| ----------- | ----------------------------------------------------------------------------------- |
| CR-1        | Transform dialogue into atomic facts with absolute timestamps                       |
| CR-2        | Create multi-view index: semantic (embeddings), lexical (BM25), symbolic (metadata) |
| CR-3        | Store atomic facts in session alongside summaries                                   |
| CR-4        | Implement adaptive retrieval based on query complexity                              |
| CR-5        | Maintain backward compatibility with existing compaction                            |

### 3. Memory CLI Commands

| Requirement | Description                                                               |
| ----------- | ------------------------------------------------------------------------- |
| MR-1        | `openclaw memory status` - Show memory health, session count, last update |
| MR-2        | `openclaw memory recall <query>` - Semantic search over session history   |
| MR-3        | `openclaw memory export` - Export all memory to JSON                      |
| MR-4        | `openclaw memory import` - Import memory snapshot                         |
| MR-5        | Chat commands: `/memory status`, `/memory recall`, `/memory flush`        |

### 4. Skill Intelligence

| Requirement | Description                                                   |
| ----------- | ------------------------------------------------------------- |
| SR-1        | Detect recurring workflow patterns from tool usage            |
| SR-2        | Generate skill proposal from observed patterns                |
| SR-3        | Semantic search over skill library using embeddings           |
| SR-4        | Integrate with OpenClaw skills platform (`.openclaw/skills/`) |

### 5. Curriculum Planner

| Requirement | Description                                             |
| ----------- | ------------------------------------------------------- |
| PR-1        | Generate repo onboarding roadmap from codebase analysis |
| PR-2        | Create curriculum from session history and goals        |
| PR-3        | Integrate with wizard onboarding flow                   |
| PR-4        | Output to `.openclaw/curriculum/`                       |

## Visual Design

N/A - CLI and chat interface only

## Existing Code to Leverage

- `src/agents/memory.ts` - Existing memory system (extend, not replace)
- `src/commands/autocompact.ts` - Compaction commands
- `src/config/defaults.ts` - Configuration defaults
- `src/sessions/transcript-events.ts` - Session event types
- `docs/concepts/memory.md` - Existing memory documentation

## Out of Scope

- Cloud sync / backup
- Cross-workspace memory sharing
- Real-time collaborative features
- Mobile node memory sync
- Multi-agent shared memory

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      OpenClaw Gateway                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Existing Memory System                  │   │
│  │  ┌─────────────────┐  ┌────────────────┐  ┌─────────────┐  │   │
│  │  │ Memory CLI      │  │ Vector Search │  │ SQLite     │  │   │
│  │  │ (memory-cli.ts) │  │ (embeddings)  │  │ Storage    │  │   │
│  │  └─────────────────┘  └────────────────┘  └─────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              New Memory Features (This Spec)               │   │
│  │                                                              │   │
│  │  ┌──────────────────┐  ┌──────────────────────────────┐   │   │
│  │  │ Session Brain    │  │ Atomic Facts + Index        │   │   │
│  │  │ (goals/decisions)│  │ (from SimpleMem)            │   │   │
│  │  └──────────────────┘  └──────────────────────────────┘   │   │
│  │           │                         │                     │   │
│  │           ▼                         ▼                     │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │ Skill Intelligence (Factory + Retrieval)           │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

Storage:
- Session Brain: .openclaw/voyager/brain.json
- Atomic Facts: SQLite (new table, reuse existing embeddings)
- Skills: .openclaw/skills/generated/
- Curriculum: .openclaw/curriculum/
```

## Configuration

```json5
{
  agents: {
    defaults: {
      memory: {
        // Enable session brain (default: true)
        sessionBrain: true,
        // Enable atomic fact compaction (default: true)
        atomicCompaction: true,
        // Enable skill factory (default: false)
        skillFactory: false,
        // Max brain entries to retain (default: 100)
        maxBrainEntries: 100,
        // Embedding model for semantic search
        embeddingModel: "openai/text-embedding-3-small",
      },
    },
  },
}
```

## Data Models

### BrainEntry

```typescript
interface BrainEntry {
  id: string;
  timestamp: number;
  type: "goal" | "decision" | "progress" | "blocked" | "note";
  content: string;
  sessionId?: string;
  tags: string[];
}
```

### AtomicFact

```typescript
interface AtomicFact {
  id: string;
  timestamp: number; // Absolute, not relative
  subject: string;
  predicate: string;
  object: string;
  context: string; // Supporting detail
  sessionId: string;
  importance: number; // 0-1
}
```

## CLI Commands

| Command                          | Description            |
| -------------------------------- | ---------------------- |
| `openclaw memory status`         | Show memory health     |
| `openclaw memory recall <query>` | Semantic search        |
| `openclaw memory export`         | Export to file         |
| `openclaw memory import`         | Import from file       |
| `openclaw memory brain update`   | Force brain update     |
| `openclaw memory brain inject`   | Show inject output     |
| `openclaw memory index rebuild`  | Rebuild semantic index |

## Chat Commands

| Command                  | Description                      |
| ------------------------ | -------------------------------- |
| `/memory status`         | Show memory health               |
| `/memory recall <query>` | Search past sessions             |
| `/memory flush`          | Clear memory (with confirmation) |
