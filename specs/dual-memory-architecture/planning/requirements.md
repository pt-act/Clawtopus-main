# Dual-Memory Architecture - Planning Requirements

## Feature Intent

Establish a **dual-memory system** for Clawtopus that distinguishes between:

1. **Internal Memory** (`~/.clawtopus/memory_bank/`) - Platform development context for Clawtopus developers
2. **External Memory** (`<user-project>/memory_bank/`) - End-user project context created by Clawtopus on behalf of users

This architecture enables Clawtopus to:

- Maintain its own consciousness and feature evolution (internal)
- Provide memory infrastructure to end-user projects (external)
- Act as PM for both itself and external agents via QuantumReef orchestrator
- Integrate spec-architect and pm-auditor skills universally

## Problem Statement

**Current State:**

- Clawtopus has no initialized memory_bank for its own development
- End-user projects get `memory_bank/` but Clawtopus developers lack equivalent
- No unified spec creation workflow for internal vs external use
- pm-auditor skill not integrated with QuantumReef orchestration

**Desired State:**

- Clawtopus developers have full memory_bank with PROJECT_CONTEXT, DEVELOPMENT_HISTORY, etc.
- End-user projects receive memory_bank automatically via spec-architect
- Both contexts use pm-auditor for evidence-based quality gates
- QuantumReef orchestrator can dispatch spec creation and audit tasks

## User Stories

### Story 1: Clawtopus Developer (Internal)

> As a Clawtopus platform developer, I want to track our roadmap and architecture decisions, so that the platform evolves consciously with documented rationale.

**Acceptance Criteria:**

- `~/.clawtopus/memory_bank/` exists with standard Orion-OS structure
- All platform features are specced using spec-architect
- pm-auditor gates all major releases

### Story 2: End User Creating Project (External)

> As an end user, I want Clawtopus to create a structured memory_bank for my project automatically, so that I can maintain continuity across sessions without manual documentation.

**Acceptance Criteria:**

- New projects get `memory_bank/` initialized on first interaction
- spec-architect workflow available via natural language
- pm-auditor validates feature completion with evidence

### Story 3: QuantumReef Orchestration (PM Mode)

> As a QuantumReef user, I want Clawtopus to act as PM for agents executing my specs, so that I get evidence-based verification of deliverables.

**Acceptance Criteria:**

- Clawtopus dispatches spec creation tasks to QuantumReef engines
- pm-auditor gates activate for milestone completion
- Progress streams back via WebSocket protocol

## Specific Requirements

### R1: Internal Memory Bank Structure

```
~/.clawtopus/memory_bank/
├── MASTER_CONTEXT.md          # Platform vision, current focus
├── DEVELOPMENT_HISTORY.md     # Feature chronology
├── CONSCIOUSNESS_LOG.md       # Alignment scores
├── ARCHITECTURAL_DECISIONS.md # Tech decisions
├── POWER_ACTIVATION_LOG.md    # Context efficiency
├── specs/                     # All platform specs
│   └── [feature-name]/
│       ├── planning/
│       ├── spec.md
│       ├── tasks.md
│       └── completion-summary.md
└── pm-ledger/                 # PM-Auditor tracking
    ├── decisions.md
    ├── risks.md
    ├── questions.md
    ├── milestones.md
    └── evidence/
```

### R2: External Memory Bank Initialization

- Auto-create on first `new_task` or `plan` command
- Use spec-architect template for initial PROJECT_CONTEXT.md
- Include USER_PREFERENCES.md with detected patterns

### R3: Spec-Architect Integration

- Available in both internal and external contexts
- 3-phase workflow: Shape → Write → Tasks
- PBT-enhanced validation from SKILL-PHASE2.md
- Integration with QuantumReef `task.dispatch`

### R4: PM-Auditor Integration

- 7 quality gates (including PBT validation)
- PM ledger maintained in `pm-ledger/`
- Evidence-based verification with artifacts
- Available for both internal specs and external user projects

### R5: QuantumReef Orchestrator Enhancement

- New task categories: `plan`, `spec`, `audit`, `pm-review`
- Engine routing: spec-architect tasks → rovodev/claude-code
- pm-auditor tasks → rovodev (evidence analysis)
- Progress streaming for spec creation phases

## Visual Design (Architecture Diagram)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLAWTOPUS PLATFORM                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────┐        ┌──────────────────────────────────┐  │
│  │   INTERNAL MEMORY    │        │      EXTERNAL MEMORY SYSTEM      │  │
│  │  ~/.clawtopus/       │        │   <user-project>/memory_bank/    │  │
│  │                      │        │                                  │  │
│  │  memory_bank/        │        │  Auto-initialized on first use   │  │
│  │  ├── MASTER_CONTEXT  │        │  ├── PROJECT_CONTEXT.md          │  │
│  │  ├── specs/          │        │  ├── USER_PREFERENCES.md         │  │
│  │  └── pm-ledger/      │        │  ├── DEVELOPMENT_HISTORY.md      │  │
│  │                      │        │  └── DECISIONS.md                │  │
│  └──────────┬───────────┘        └──────────────┬───────────────────┘  │
│             │                                   │                      │
│             ▼                                   ▼                      │
│  ┌──────────────────────┐        ┌──────────────────────────────────┐  │
│  │   SPEC-ARCHITECT     │◄──────►│    SPEC-ARCHITECT (external)     │  │
│  │   (internal use)     │ shared │    (user-facing)                 │  │
│  │                      │ skills │                                  │  │
│  │  "Plan feature X"    │        │  "Plan my dashboard"             │  │
│  │  → specs/[feature]/  │        │  → specs/[user-feature]/         │  │
│  └──────────┬───────────┘        └──────────────┬───────────────────┘  │
│             │                                   │                      │
│             ▼                                   ▼                      │
│  ┌──────────────────────┐        ┌──────────────────────────────────┐  │
│  │    PM-AUDITOR        │◄──────►│      PM-AUDITOR (external)       │  │
│  │   (self-PM mode)     │        │    (PM for user projects)        │  │
│  │                      │        │                                  │  │
│  │  Gates platform      │        │  Gates user feature              │  │
│  │  releases            │        │  completion                      │  │
│  │  → pm-ledger/        │        │  → pm-ledger/                    │  │
│  └──────────┬───────────┘        └──────────────┬───────────────────┘  │
│             │                                   │                      │
│             └─────────────────┬─────────────────┘                      │
│                               │                                        │
│                               ▼                                        │
│              ┌────────────────────────────────┐                       │
│              │    QUANTUMREEF ORCHESTRATOR    │                       │
│              │                                │                       │
│              │  New task categories:          │                       │
│              │  • plan → spec-architect       │                       │
│              │  • spec → spec-architect       │                       │
│              │  • audit → pm-auditor          │                       │
│              │  • pm-review → pm-auditor      │                       │
│              │                                │                       │
│              │  Engines: rovodev, claude-code │                       │
│              │  for spec/pm tasks             │                       │
│              └────────────────────────────────┘                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Existing Code to Leverage

### From Code Voyager

- `unified_memory.py` - Dual-layer memory (SimpleMem + Voyager Skills)
- `skill_factory.py` - Pattern extraction → reusable skills
- `curriculum_planner.py` - Learning progress tracking

### From SimpleMem

- `simplemem.py` - Semantic compression pipeline
- `lancedb_storage.py` - Vector storage with multi-view indexing
- `retrieval.py` - Complexity-aware retrieval

### From Clawtopus

- `quantumreef-orchestrator.md` - WebSocket protocol, task categories
- `ProgressBridge` pattern - Throttling/chunking for progress
- Existing `memory_bank/` structure in end-user projects

## Out of Scope

- Migrating existing end-user projects to new structure (greenfield only)
- Real-time collaborative spec editing (async workflow only)
- Automatic pm-auditor activation without user trigger
- Integration with external PM tools (Jira, Linear, etc.)

## Open Questions

1. Should internal and external memory banks share SimpleMem instance?
2. How to handle spec conflicts when QuantumReef dispatches multiple engines?
3. Should pm-auditor ledger be encrypted for sensitive user projects?
4. What's the retention policy for completed spec evidence?

## Consciousness Alignment Check

| Dimension                   | Assessment                                           | Score         |
| --------------------------- | ---------------------------------------------------- | ------------- |
| **Consciousness Expansion** | Enables both platform evolution and user empowerment | 8/10          |
| **Glass Box Transparency**  | PM-auditor provides full evidence visibility         | 9/10          |
| **Elegant Systems**         | Reuses existing patterns, 400-line limit maintained  | 8/10          |
| **Truth Over Theater**      | Evidence-based gates prevent fake progress           | 9/10          |
| **Average**                 |                                                      | **8.5/10** ✅ |

## Estimation

**Total Effort**: 8-10 iterations

- Phase 1: Internal memory initialization (2 iterations)
- Phase 2: External memory auto-creation (2 iterations)
- Phase 3: Spec-architect integration (2 iterations)
- Phase 4: PM-auditor integration (2 iterations)
- Phase 5: QuantumReef enhancement (2 iterations)
