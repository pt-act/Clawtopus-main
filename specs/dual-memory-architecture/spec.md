# Dual-Memory Architecture Specification

> **Goal**: Establish a unified dual-memory system that serves both Clawtopus platform development and end-user projects, with integrated spec-architect and pm-auditor capabilities accessible via QuantumReef orchestration.

**Consciousness Alignment Score**: 8.5/10 ✅

---

## Goal

Create a dual-memory architecture that:

1. Provides Clawtopus developers with persistent platform consciousness (`~/.clawtopus/memory_bank/`)
2. Auto-provisions memory infrastructure for end-user projects (`<project>/memory_bank/`)
3. Unifies spec-architect workflow across both contexts
4. Integrates pm-auditor for evidence-based quality gates
5. Exposes all capabilities via QuantumReef orchestrator

---

## User Stories

### US-1: Platform Developer Memory

As a Clawtopus platform developer, I need persistent memory of our architecture and roadmap, so that platform evolution is conscious and documented.

**Acceptance Criteria:**

- `~/.clawtopus/memory_bank/` auto-initializes on first dev session
- All platform features follow spec-architect 3-phase workflow
- pm-auditor gates all releases with evidence verification
- QuantumReef can dispatch spec tasks for platform features

### US-2: End-User Project Memory

As an end user creating projects with Clawtopus, I want automatic memory infrastructure, so that my projects maintain continuity without manual documentation burden.

**Acceptance Criteria:**

- `memory_bank/` auto-created on first project interaction
- spec-architect available via natural language ("Plan my dashboard")
- pm-auditor validates feature completion with artifact evidence
- Progress streams via QuantumReef WebSocket protocol

### US-3: PM Mode for QuantumReef

As a QuantumReef orchestrator user, I want Clawtopus to act as PM for agent teams, so that deliverables meet quality gates with evidence.

**Acceptance Criteria:**

- Clawtopus dispatches `plan`, `spec`, `audit` tasks to QuantumReef
- pm-auditor 7-dimension gates applied to all deliverables
- Evidence bundle generated for each milestone
- Progress notifications stream to user's phone

---

## Specific Requirements

### SR-1: Internal Memory Bank (Platform)

**Location**: `~/.clawtopus/memory_bank/`

**Structure**:

```
~/.clawtopus/memory_bank/
├── MASTER_CONTEXT.md          # Platform vision, strategic direction
├── DEVELOPMENT_HISTORY.md     # Reverse-chronological feature log
├── CONSCIOUSNESS_LOG.md       # Alignment scores per feature
├── ARCHITECTURAL_DECISIONS.md # ADR records
├── POWER_ACTIVATION_LOG.md    # Context efficiency metrics
├── specs/                     # All platform specs
│   └── [feature]/
│       ├── planning/requirements.md
│       ├── spec.md
│       ├── tasks.md
│       └── completion-summary.md
└── pm-ledger/                 # PM-Auditor tracking
    ├── decisions.md
    ├── risks.md
    ├── questions.md
    ├── milestones.md
    └── evidence/
        └── [milestone]/
            ├── pbt/
            ├── logs/
            └── artifacts/
```

**Initialization Trigger**: First `new_task` with mode != end-user project

### SR-2: External Memory Bank (User Projects)

**Location**: `<user-project>/memory_bank/`

**Structure**:

```
<user-project>/memory_bank/
├── PROJECT_CONTEXT.md         # What this project is
├── USER_PREFERENCES.md        # User's style and patterns
├── PROJECT_STATE.md           # Current focus, recent work
├── DEVELOPMENT_HISTORY.md     # Session history
├── DECISIONS.md               # Key architectural choices
├── CURRICULUM.md              # Learning path
├── specs/                     # User feature specs (if used)
└── pm-ledger/                 # PM tracking (if pm-auditor used)
```

**Initialization Trigger**: First interaction with new project directory

### SR-3: Spec-Architect Integration

**Availability**: Both internal (`~/.clawtopus/`) and external (`<project>/`) contexts

**Workflow**:

1. **Shape Phase**: Gather requirements → `planning/requirements.md`
2. **Write Phase**: Consciousness alignment → `spec.md`
3. **Tasks Phase**: Dependency mapping → `tasks.md`

**QuantumReef Integration**:

- Category `plan` → triggers Shape phase
- Category `spec` → triggers Write phase
- Category `tasks` → triggers Tasks phase
- Each phase dispatchable as separate `task.dispatch`

**PBT Enhancement** (from SKILL-PHASE2):

- Phase 2 identifies PBT-suitable components
- Phase 3 includes validation tiers (Focused + PBT)
- Security properties defined in spec.md

### SR-4: PM-Auditor Integration

**Activation Triggers**:

- Implementation summary posted
- All tasks marked complete
- User says: "Ready for audit", "PM review", "Gate check"
- Milestone completion claim

**7 Quality Gates**:

1. **Functional Correctness**: Works on real cases, edge cases handled
2. **Determinism**: Clear run instructions, reproducible
3. **Observability**: Informative logs, progress indicators
4. **Security**: Least privilege, safe defaults
5. **Documentation**: README, API docs, decisions recorded
6. **Regression Protection**: Smoke tests, golden demos
7. **Property-Based Validation**: PBT properties verified (NEW)

**PM Ledger Structure**:

```
pm-ledger/
├── decisions.md        # Why choices were made
├── risks.md           # Impact/probability/mitigation
├── questions.md       # Open items with owners
├── milestones.md      # Progress tracking
├── pbt-results.md     # Property validation outcomes
└── evidence/
    └── [milestone]/
        ├── README.md
        ├── pbt/
        ├── logs/
        └── artifacts/
```

### SR-5: QuantumReef Orchestrator Enhancement

**New Task Categories**:

| Category    | Priority Order            | Use Case                     |
| ----------- | ------------------------- | ---------------------------- |
| `plan`      | `rovodev` › `claude-code` | Requirements gathering phase |
| `spec`      | `rovodev` › `claude-code` | Specification writing phase  |
| `tasks`     | `rovodev` › `claude-code` | Task breakdown phase         |
| `audit`     | `rovodev` › `claude-code` | PM-Auditor review            |
| `pm-review` | `rovodev`                 | Evidence analysis            |

**Message Protocol Extensions**:

**Command**: `task.dispatch` (enhanced payload)

```json
{
  "type": "task.dispatch",
  "payload": {
    "taskId": "task_spec_001",
    "instruction": "Write spec for user dashboard feature",
    "category": "spec",
    "specContext": {
      "phase": "write", // shape | write | tasks
      "featureName": "user-dashboard",
      "template": "spec-architect"
    },
    "pmContext": {
      "auditOnComplete": true,
      "milestone": "m1-spec-ready"
    }
  }
}
```

**Event**: `task.progress` (spec phases)

```json
{
  "type": "task.progress",
  "payload": {
    "taskId": "task_spec_001",
    "phase": "write",
    "step": 2,
    "totalSteps": 5,
    "checkpoint": "Consciousness Gate 1 validated",
    "artifacts": ["specs/user-dashboard/spec.md"]
  }
}
```

**Event**: `pm.verdict` (NEW)

```json
{
  "type": "pm.verdict",
  "payload": {
    "taskId": "task_impl_001",
    "verdict": "APPROVE|APPROVE-WITH-CONDITIONS|REQUEST-CHANGES|BLOCKED",
    "gates": {
      "functional": "✅ PASSED",
      "determinism": "✅ PASSED",
      "observability": "⚠️ CONDITIONS",
      "security": "✅ PASSED",
      "documentation": "✅ PASSED",
      "regression": "✅ PASSED",
      "pbt": "✅ PASSED"
    },
    "evidence": ["logs/test_output.log", "pbt/results.txt"],
    "nextActions": ["Add debug mode flag", "Update README"]
  }
}
```

---

## Visual Design

### Memory Bank Initialization Flow

```
User opens Clawtopus
        │
        ▼
┌──────────────────┐
│ Context detected │
│ (internal vs     │
│  external)       │
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐  ┌──────────┐
│INTERNAL│  │ EXTERNAL │
│~/.claw.│  │<project>/│
│topus/  │  │memory_   │
│memory_ │  │bank/     │
│bank/   │  │          │
└───┬────┘  └────┬─────┘
    │            │
    ▼            ▼
┌──────────────────────┐
│ Initialize standard  │
│ Orion-OS structure   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Create MASTER_CONTEXT│
│ or PROJECT_CONTEXT   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Ready for specs      │
└──────────────────────┘
```

### Spec-Architect + PM-Auditor Workflow

```
User: "Plan my dashboard"
        │
        ▼
┌──────────────────┐
│ Phase 1: SHAPE   │
│ • Gather reqs    │
│ • Analyze assets │
│ • Search patterns│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ planning/        │
│ requirements.md  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Phase 2: WRITE   │
│ • Gate 1 check   │
│ • Create spec.md │
│ • Define PBT     │
│   properties     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ spec.md created  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Phase 3: TASKS   │
│ • Map deps       │
│ • Create tasks   │
│ • Est iterations │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ tasks.md created │
│ READY FOR DEV    │
└────────┬─────────┘
         │
    (after dev)
         │
         ▼
┌──────────────────┐
│ PM-AUDITOR       │
│ • 7 gates check  │
│ • Evidence verify│
│ • Issue verdict  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ pm-ledger/       │
│ [milestone]/     │
│ evidence/        │
└──────────────────┘
```

---

## Existing Code to Leverage

### Code Voyager Components

- **`unified_memory.py`**: Dual-layer memory (SimpleMem + Voyager Skills)
- **`skill_factory.py`**: Pattern → skill extraction
- **`session_brain.py`**: Cross-session user memory

### SimpleMem Components

- **`semantic_compressor.py`**: Dialogue → atomic entries
- **`multi_view_index.py`**: Semantic + conversational + atomic indexing
- **`adaptive_retrieval.py`**: Complexity-aware context assembly

### Clawtopus Existing

- **`quantumreef-orchestrator.md`**: WebSocket protocol, task categories
- **`ProgressBridge`**: Throttling/chunking layer
- **`memory_bank/` patterns**: Existing end-user structure

### Spec-Architect Skill

- **`skill.md`**: 3-phase process (Shape → Write → Tasks)
- **`SKILL-PHASE2.md`**: PBT-enhanced validation
- **Templates**: `planning/requirements.md`, `spec.md`, `tasks.md`

### PM-Auditor Skill

- **`SKILL.md`**: 7 quality gates, PM ledger structure
- **Templates**: `pm-verdict.md`, `coder-summary.md`, evidence bundles

---

## Out of Scope

**Explicitly NOT included:**

- Migration of existing end-user projects (greenfield only)
- Real-time collaborative spec editing (async only)
- Integration with external PM tools (Jira, Linear, Asana)
- Automatic pm-auditor without user trigger
- Shared SimpleMem between internal/external (separate instances)
- Multi-language spec templates (English only)

---

## PBT Validation Strategy

### Components Requiring Property-Based Testing

1. **Memory Bank Operations**
   - Property: All writes are retrievable
   - Property: Compression is reversible
   - Property: Concurrent writes don't corrupt

2. **Spec-Architect Phase Transitions**
   - Property: Shape → Write → Tasks always produces valid output
   - Property: Re-running same phase produces consistent results
   - Property: Phase output schema is valid

3. **PM-Auditor Gates**
   - Property: Verdict is deterministic for same evidence
   - Property: All 7 gates evaluated
   - Property: Evidence paths exist

4. **QuantumReef Protocol**
   - Property: All task.dispatch → task.complete cycles complete
   - Property: Progress events sum to 100%
   - Property: No orphaned tasks

---

## Success Metrics

### Technical Metrics

- Internal memory_bank initialization: < 2 seconds
- External memory_bank auto-creation: < 1 second
- Spec phase completion: < 30 seconds per phase
- PM audit latency: < 5 seconds for evidence verification

### Quality Metrics

- Consciousness alignment: ≥ 7.0/10 average
- pm-auditor gate pass rate: > 90% on first attempt
- Spec reuse rate: > 60% of tasks reference existing patterns
- Evidence completeness: 100% of audits have artifact bundle

### User Metrics

- End-user memory_bank adoption: > 95% of new projects
- Spec-architect usage: > 50% of features use 3-phase workflow
- PM-auditor satisfaction: Users report feeling "in control"

---

## Consciousness Alignment Verification

| Dimension                   | Evidence                                                                 | Score         |
| --------------------------- | ------------------------------------------------------------------------ | ------------- |
| **Consciousness Expansion** | Platform evolves consciously; users empowered with structured memory     | 8/10          |
| **Glass Box Transparency**  | PM-auditor provides full evidence visibility; specs document decisions   | 9/10          |
| **Elegant Systems**         | Reuses existing patterns; 400-line limit enforced; single responsibility | 8/10          |
| **Truth Over Theater**      | Evidence-based gates prevent fake progress; root cause focus             | 9/10          |
| **Average**                 |                                                                          | **8.5/10** ✅ |

---

## Risk Register

| Risk                                   | Impact | Probability | Mitigation                                  |
| -------------------------------------- | ------ | ----------- | ------------------------------------------- |
| Internal/external memory confusion     | High   | Medium      | Clear context detection; distinct paths     |
| pm-auditor too strict, blocks progress | Medium | Medium      | Verdict types allow conditional approval    |
| QuantumReef spec tasks timeout         | Medium | Low         | Phase-based dispatch; progress streaming    |
| Evidence storage bloat                 | Medium | Low         | Retention policy; auto-archive after N days |

---

_Specification complete. Ready for task breakdown._
