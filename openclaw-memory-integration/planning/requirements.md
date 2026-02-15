# OpenClaw Memory Integration - Requirements

## Project Overview

Integrate Code-Voyager and SimpleMem memory systems into OpenClaw to enhance session continuity, improve compaction quality, and enable lifelong learning capabilities.

## Source Projects

- **Code-Voyager** (`/Users/rna/Desktop/openclaw-main/code-voyager/`): Claude Code memory extension with Session Brain, Curriculum Planner, Skill Factory, Skill Retrieval, Skill Refinement
- **SimpleMem** (`/Users/rna/Desktop/openclaw-main/code-voyager/SimpleMem-main/`): Efficient lifelong memory with semantic compression, multi-view indexing, adaptive retrieval

## Problem Statement

OpenClaw currently lacks:
1. **Session continuity**: Users lose context between sessions; no "what were we working on?" capability
2. **Smart memory retrieval**: Compacted sessions lose discoverability; can't find relevant past context
3. **Skill automation**: No way to auto-generate skills from observed workflows
4. **Semantic memory**: Flat compaction summaries; no structured fact extraction

## Core Requirements

### 1. Session Brain (Priority: High)
- Track goals, decisions, and progress across sessions
- Persist in workspace (`~/.openclaw/workspace/.claude/voyager/`)
- Inject context on session start via hooks
- CLI: `openclaw memory brain update`, `openclaw memory brain inject`

### 2. Enhanced Compaction (Priority: High)
- Replace simple summarization with atomic fact extraction
- Add multi-view indexing (semantic + lexical + symbolic)
- Store in session as structured memory entries
- Enable retrieval from compacted sessions

### 3. Memory CLI Commands (Priority: High)
- `openclaw memory status` - Show memory health
- `openclaw memory recall <query>` - Query past sessions
- `openclaw memory export` - Export memory for backup
- `openclaw memory import` - Import memory snapshot

### 4. Skill Intelligence (Priority: Medium)
- Skill Factory: Auto-generate skills from workflows
- Skill Retrieval: Semantic search over skill library
- Integration with existing OpenClaw skills platform

### 5. Curriculum Planner (Priority: Low)
- Generate onboarding roadmaps for new codebases
- Integrate with wizard onboarding flow

## User Stories

1. **As a user**, I want to resume a session and ask "what were we working on?" so I can continue seamlessly
2. **As a user**, I want the agent to remember important decisions across sessions so I don't repeat discussions
3. **As a user**, I want to search my session history semantically so I can find relevant past context
4. **As a user**, I want the agent to auto-generate skills from my workflows so I don't repeat myself
5. **As a user**, I want better compaction that preserves factual information so my long-running sessions stay useful

## Constraints

- Must work with existing OpenClaw architecture
- No breaking changes to existing sessions
- Must integrate with existing skills platform
- Keep dependencies minimal (Python for SimpleMem, TypeScript for OpenClaw)
- Support both local-first and remote gateway modes

## Existing Code to Leverage

- `src/agents/memory.ts` - Existing memory system
- `src/commands/` - CLI command structure
- `src/config/` - Configuration management
- `src/sessions/` - Session management
- `docs/concepts/memory.md` - Memory documentation

## Out of Scope

- Real-time collaborative memory (future feature)
- Cross-workspace memory sharing (future feature)
- Cloud backup/sync (future feature)
- Mobile node memory sync (future feature)

## Dependencies Analysis

| Component | Depends On | Blocks |
|-----------|-----------|--------|
| Session Brain | Config, Session system | Memory CLI |
| Enhanced Compaction | Existing compaction | Memory CLI |
| Memory CLI | Session Brain, Compaction | - |
| Skill Intelligence | Skills platform | - |
| Curriculum Planner | Session Brain | - |

## Implementation Approach

1. **Phase 1**: Session Brain + basic memory CLI (4 iterations)
2. **Phase 2**: Enhanced compaction + semantic retrieval (4 iterations)
3. **Phase 3**: Skill Factory + Skill Retrieval (3 iterations)
4. **Phase 4**: Curriculum Planner integration (2 iterations)

## Acceptance Criteria

- [ ] Session Brain persists across restarts
- [ ] `openclaw memory recall` returns relevant past context
- [ ] Compaction creates structured atomic facts
- [ ] Semantic search works over session history
- [ ] Skill Factory can generate skills from workflows
- [ ] All new features have CLI and chat command access
