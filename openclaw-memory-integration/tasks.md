# OpenClaw Memory Integration - Tasks

## Overview

Integrate Code-Voyager and SimpleMem memory systems into OpenClaw. This breaks into 4 phases totaling 13 iterations.

**Key Insight**: OpenClaw already has extensive memory infrastructure (vector search, SQLite storage, CLI). This integration extends existing systems rather than building parallel ones.

## Dependencies

```
Phase 1 (3 iter) ──► Phase 2 (4 iter) ──► Phase 3 (3 iter) ──► Phase 4 (3 iter)
      │                   │                    │                    │
      └───────────────────┴────────────────────┴────────────────────┘
                    All depend on Phase 1 (but Phase 2-4 can parallelize after)
```

## Task Groups

### Phase 1: Session Brain + Integration Foundation

#### Iteration 1: Session Brain Data Model + Storage
**Files**: `src/agents/session-brain.ts`, extend `src/config/types.agent-defaults.ts`

- [ ] Define `BrainEntry` interface (goals, decisions, progress, blocked)
- [ ] Create JSON-based brain store in `.openclaw/voyager/` (new directory)
- [ ] Add brain config to existing `agents.defaults.memorySearch` or new `agents.defaults.sessionBrain`
- [ ] **Tests**: 3 tests for brain store

#### Iteration 2: Brain Update Logic
**Files**: `src/agents/session-brain.ts`, `src/sessions/transcript-events.ts`

- [ ] Implement `updateBrainFromSession()` - extract goals/decisions from transcript
- [ ] Hook into session end and pre-compaction events
- [ ] Track: current goal, recent decisions, next steps, blocked items
- [ ] **Tests**: 3 tests for brain update

#### Iteration 3: Brain Injection + CLI
**Files**: `src/agents/session-brain.ts`, extend `src/cli/memory-cli.ts`

- [ ] Implement `injectBrainContext()` - format for system prompt
- [ ] Add CLI: `openclaw memory brain status`
- [ ] Add CLI: `openclaw memory brain update`
- [ ] Add to existing `openclaw memory status` output
- [ ] **Tests**: 3 tests

---

### Phase 2: Enhanced Compaction + Atomic Facts

#### Iteration 4: Atomic Fact Extraction
**Files**: `src/agents/atomic-facts.ts`, extend `src/agents/compaction.ts`

- [ ] Implement `extractAtomicFacts()` - LLM-based fact extraction
- [ ] Transform dialogue → atomic facts with absolute timestamps
- [ ] Add `AtomicFact` interface
- [ ] Integrate with existing compaction pipeline
- [ ] **Tests**: 4 tests

#### Iteration 5: Multi-View Index Integration
**Files**: `src/agents/atomic-facts.ts`, extend existing memory index

- [ ] Store atomic facts in existing SQLite (new table)
- [ ] Add semantic index for facts (reuse existing embeddings)
- [ ] Add lexical index (reuse existing FTS)
- [ ] **Tests**: 3 tests

#### Iteration 6: Adaptive Retrieval for Facts
**Files**: `src/agents/memory-recall.ts`, extend `src/agents/memory-search.ts`

- [ ] Implement query complexity estimation
- [ ] Implement adaptive depth retrieval
- [ ] Integrate with existing memory search
- [ ] **Tests**: 3 tests

#### Iteration 7: Memory Recall CLI Enhancement
**Files**: extend `src/cli/memory-cli.ts`

- [ ] Enhance `openclaw memory search` to include brain + atomic facts
- [ ] Add chat commands: `/memory recall`
- [ ] **Tests**: 2 tests

---

### Phase 3: Skill Intelligence

#### Iteration 8: Workflow Pattern Detection
**Files**: `src/agents/skill-factory/detector.ts`, `src/agents/skill-factory/store.ts`

- [ ] Implement `detectPatterns()` - analyze tool usage sequences
- [ ] Identify recurring workflows from session history
- [ ] Store patterns in `.openclaw/voyager/patterns.json`
- [ ] **Tests**: 3 tests

#### Iteration 9: Skill Proposal + Scaffolding
**Files**: `src/agents/skill-factory/proposer.ts`, `src/agents/skill-factory/scaffolder.ts`

- [ ] Implement `generateSkillProposal()` - LLM-based
- [ ] Implement `scaffoldSkill()` - create SKILL.md
- [ ] Save to `.openclaw/skills/generated/`
- [ ] Add CLI: `openclaw skill factory propose`
- [ ] **Tests**: 3 tests

#### Iteration 10: Semantic Skill Retrieval
**Files**: `src/agents/skill-factory/retrieval.ts`, extend `src/cli/memory-cli.ts`

- [ ] Build skill embedding index (reuse existing)
- [ ] Implement `searchSkills(query)` 
- [ ] Add CLI: `openclaw skill search <query>`
- [ ] **Tests**: 3 tests

---

### Phase 4: Curriculum Planner + Polish

#### Iteration 11: Curriculum Generation
**Files**: `src/agents/curriculum/planner.ts`, `src/agents/curriculum/renderer.ts`

- [ ] Implement `generateCurriculum()` - from codebase analysis
- [ ] Implement `generateOnboarding()` - from repo structure
- [ ] Output to `.openclaw/curriculum/`
- [ ] **Tests**: 3 tests

#### Iteration 12: Wizard Integration
**Files**: extend `src/commands/onboard-*.ts`

- [ ] Integrate curriculum with wizard onboarding
- [ ] Add "memory status" summary to `/status` output
- [ ] **Tests**: 2 tests

#### Iteration 13: Documentation + Migration
**Files**: docs updates

- [ ] Update `docs/concepts/memory.md`
- [ ] Add migration guide for existing users
- [ ] Final integration tests
- [ ] **Tests**: 2 tests

---

## Iteration Summary

| Phase | Iterations | Focus | Tests |
|-------|------------|-------|-------|
| 1 | 1-3 | Session Brain + CLI | 9 |
| 2 | 4-7 | Atomic Facts + Recall | 12 |
| 3 | 8-10 | Skill Intelligence | 9 |
| 4 | 11-13 | Curriculum + Integration | 7 |
| **Total** | **13** | | **37** |

## Integration Points (Reuse Existing)

| Existing System | Integration Point |
|---------------|-------------------|
| `src/cli/memory-cli.ts` | Add brain subcommands |
| `src/agents/memory-search.ts` | Extend with atomic facts |
| `src/config/types.agent-defaults.ts` | Add sessionBrain config |
| `src/sessions/transcript-events.ts` | Hook brain update |
| SQLite + embeddings | Store atomic facts |

## Acceptance Criteria

### Phase 1
- [ ] `openclaw memory brain status` shows entries
- [ ] Brain persists across restarts
- [ ] Session resume injects brain context

### Phase 2
- [ ] Compaction creates atomic facts
- [ ] `openclaw memory search` includes facts
- [ ] Adaptive retrieval works

### Phase 3
- [ ] Workflow patterns detected
- [ ] Skill proposals generated
- [ ] Semantic skill search works

### Phase 4
- [ ] Curriculum generated
- [ ] Wizard integration complete
- [ ] Documentation updated
