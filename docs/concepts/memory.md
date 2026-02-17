---
title: "Memory"
summary: "How Clawtopus memory works (workspace files + automatic memory flush + Session Brain)"
read_when:
  - You want the memory file layout and workflow
  - You want to tune the automatic pre-compaction memory flush
  - You're using Clawtopus Session Brain for persistent cross-session memory
---

# Memory 🧠

Clawtopus memory has multiple layers working together:

1. **Workspace Memory**: Plain Markdown files in the agent workspace (inherited from OpenClaw)
2. **Session Brain**: Persistent memory across sessions (unique to Clawtopus)
3. **Atomic Facts**: Structured fact extraction from conversations (unique to Clawtopus)
4. **Skill Factory**: Auto-generate skills from workflow patterns (unique to Clawtopus)
5. **Curriculum Planner**: Generate learning paths for new technologies (unique to Clawtopus)

---

## Workspace Memory

Inherited from OpenClaw - plain Markdown files in your project:

| File        | Purpose                                     |
| ----------- | ------------------------------------------- |
| `AGENTS.md` | Agent system prompt and capabilities        |
| `SOUL.md`   | Agent identity and personality              |
| `TOOLS.md`  | Available tools and their descriptions      |
| `MEMORY.md` | Additional context loaded for every session |
| `SKILLS.md` | Custom skills and automation                |

---

## Session Brain

Session Brain provides **persistent memory across sessions** - what makes Clawtopus truly self-evolving.

### How It Works

1. **Observation**: Clawtopus observes your interactions and preferences
2. **Extraction**: Key facts and patterns are extracted from conversations
3. **Storage**: Facts are stored in `brain.json` with semantic embeddings
4. **Retrieval**: Relevant facts are retrieved and injected into new sessions

### Storage

- Brain data: `~/.clawtopus/voyager/brain.json`
- Embeddings cache: `~/.clawtopus/voyager/embeddings/`

### Configuration

```json5
{
  agents: {
    defaults: {
      sessionBrain: {
        enabled: true,
        maxEntries: 1000,
        patternExtraction: true,
        decayEnabled: true, // older entries have less weight
        decayFactor: 0.95,
        retrievalTopK: 10, // retrieve top 10 facts per session
      },
    },
  },
}
```

### CLI Commands

```bash
# View brain status
clawtopus memory brain status

# List all entries
clawtopus memory brain list

# Add a fact manually
clawtopus memory brain add "User prefers TypeScript over JavaScript"

# Clear brain
clawtopus memory brain clear
```

---

## Atomic Facts

Atomic Facts extract **structured information** from conversations into retrievable units.

### Example

Instead of remembering entire conversations, Clawtopus extracts facts like:

| Fact                           | Source                               |
| ------------------------------ | ------------------------------------ |
| "User prefers dark mode"       | User said "I always use dark theme"  |
| "Main project uses TypeScript" | Project has tsconfig.json            |
| "User works on weekends"       | Multiple sessions on Saturday/Sunday |
| "API endpoint: /api/v2/users"  | User mentioned in context            |

### Storage

- Facts: `~/.clawtopus/voyager/atomic-facts.json`

### Configuration

```json5
{
  agents: {
    defaults: {
      atomicFacts: {
        enabled: true,
        extractionPrompt: "Extract key facts about user preferences, project details, and important context",
        maxFactsPerSession: 50,
        deduplicate: true,
      },
    },
  },
}
```

---

## Skill Factory

Auto-generates skills from your workflow patterns. See [Skill Factory](/docs/concepts/skill-factory) for details.

---

## Curriculum Planner

Generates learning paths to help Clawtopus understand new technologies. See [Curriculum Planner](/docs/concepts/curriculum-planner) for details.

---

## Memory Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interaction                          │
└──────────────────────────┬──────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Current Session                            │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐    │
│  │ Workspace   │  │ Session      │  │ Atomic Facts │    │
│  │ Files      │  │ Context      │  │ Extraction   │    │
│  └─────────────┘  └──────────────┘  └───────────────┘    │
└──────────────────────────┬──────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Persistent Storage                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐    │
│  │ ~/.clawtopus│  │ brain.json   │  │ skills/      │    │
│  │ /workspace  │  │ (Session    │  │ patterns.json │    │
│  │             │  │  Brain)     │  │               │    │
│  └─────────────┘  └──────────────┘  └───────────────┘    │
│                    ┌──────────────┐  ┌───────────────┐    │
│                    │ atomic-     │  │ curriculum/  │    │
│                    │ facts.json  │  │               │    │
│                    └──────────────┘  └───────────────┘    │
└─────────────────────────────────────────────────────────────┘
```
