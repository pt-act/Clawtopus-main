# Dual-Memory Architecture - Task Breakdown

> **Total Estimate**: 10 iterations  
> **Parallel Groups**: 3 (can work simultaneously after Group 1)  
> **Dependencies**: See dependency graph below

---

## Dependency Graph

```
Group 1: Foundation (Required First)
├── Task 1.1: Internal memory structure
├── Task 1.2: Context detection logic
└── Task 1.3: Initialization triggers
         │
         ▼
Group 2: Core Memory (Can Parallel with Group 3)
├── Task 2.1: External memory auto-creation
├── Task 2.2: Memory bank templates
└── Task 2.3: Context switching
         │
         ▼
Group 3: Spec-Architect (Can Parallel with Group 2)
├── Task 3.1: Shape phase integration
├── Task 3.2: Write phase integration
├── Task 3.3: Tasks phase integration
└── Task 3.4: PBT enhancement
         │
         ▼
Group 4: PM-Auditor
├── Task 4.1: 7-gate implementation
├── Task 4.2: PM ledger structure
├── Task 4.3: Evidence collection
└── Task 4.4: Verdict generation
         │
         ▼
Group 5: QuantumReef Integration
├── Task 5.1: New task categories
├── Task 5.2: Protocol extensions
├── Task 5.3: Progress streaming
└── Task 5.4: Testing & validation
```

---

## Task Group 1: Foundation (2 iterations)

### Implementation Tasks

#### Task 1.1: Internal Memory Structure

**Description**: Create `~/.clawtopus/memory_bank/` with Orion-OS structure  
**Depends On**: None  
**Acceptance Criteria**:

- [ ] Directory structure matches spec SR-1
- [ ] `MASTER_CONTEXT.md` template with platform vision
- [ ] `pm-ledger/` subdirectory with templates
- [ ] `specs/` directory ready for feature specs

**Files Created**:

- `src/memory/internal/init.ts` (lines 1-150)
- `src/memory/internal/templates.ts` (lines 1-200)
- `src/memory/internal/types.ts` (lines 1-100)

**Tests** (4 tests):

- [ ] Initialization creates all required files
- [ ] Templates render with correct placeholders
- [ ] Re-initialization is idempotent
- [ ] Path resolution works cross-platform

---

#### Task 1.2: Context Detection Logic

**Description**: Detect whether running in internal (platform) or external (user project) context  
**Depends On**: Task 1.1  
**Acceptance Criteria**:

- [ ] Detects `~/.clawtopus/` directory presence
- [ ] Detects `<project>/memory_bank/` presence
- [ ] Returns context type: `internal` | `external` | `uninitialized`
- [ ] Handles edge cases (nested projects, symlinks)

**Files Created**:

- `src/memory/context-detector.ts` (lines 1-180)

**Tests** (4 tests):

- [ ] Returns `internal` when in `~/.clawtopus/`
- [ ] Returns `external` when in project with `memory_bank/`
- [ ] Returns `uninitialized` for new directories
- [ ] Handles symlinks correctly

---

#### Task 1.3: Initialization Triggers

**Description**: Auto-initialize memory banks on first interaction  
**Depends On**: Task 1.2  
**Acceptance Criteria**:

- [ ] Triggers on first `new_task` call
- [ ] Triggers on first `plan` command
- [ ] Shows progress indicator during init
- [ ] Non-blocking (async)

**Files Created**:

- `src/memory/triggers.ts` (lines 1-150)

**Tests** (3 tests):

- [ ] Triggers only once per context
- [ ] Handles concurrent init attempts gracefully
- [ ] Rollback on init failure

---

## Task Group 2: Core Memory (2 iterations)

### Implementation Tasks

#### Task 2.1: External Memory Auto-Creation

**Description**: Auto-create `memory_bank/` for end-user projects  
**Depends On**: Task 1.1, Task 1.2  
**Acceptance Criteria**:

- [ ] Creates on first project interaction
- [ ] Structure matches spec SR-2
- [ ] Includes detected user patterns
- [ ] < 1 second initialization time

**Files Created**:

- `src/memory/external/init.ts` (lines 1-150)
- `src/memory/external/pattern-detector.ts` (lines 1-120)

**Tests** (3 tests):

- [ ] Auto-creates on first interaction
- [ ] Detects and stores user patterns
- [ ] Meets performance requirement

---

#### Task 2.2: Memory Bank Templates

**Description**: Create templates for all memory_bank files  
**Depends On**: Task 2.1  
**Acceptance Criteria**:

- [ ] All 7 external files have templates
- [ ] All 5 internal files have templates
- [ ] Templates include Clawtopus branding
- [ ] Templates are valid Markdown

**Files Created**:

- `templates/memory-bank/internal/*.md` (7 files)
- `templates/memory-bank/external/*.md` (7 files)
- `src/memory/template-renderer.ts` (lines 1-200)

**Tests** (2 tests):

- [ ] All templates render without errors
- [ ] Rendered templates are valid Markdown

---

#### Task 2.3: Context Switching

**Description**: Support working across internal and external contexts  
**Depends On**: Task 1.2, Task 2.1  
**Acceptance Criteria**:

- [ ] Can load internal memory while in external project
- [ ] Can load external memory from internal context
- [ ] Clear visual indicator of current context
- [ ] Context precedence rules documented

**Files Created**:

- `src/memory/context-switcher.ts` (lines 1-180)

**Tests** (3 tests):

- [ ] Correctly loads cross-context memory
- [ ] Visual indicator shows current context
- [ ] Precedence rules work as documented

---

## Task Group 3: Spec-Architect Integration (2 iterations)

### Implementation Tasks

#### Task 3.1: Shape Phase Integration

**Description**: Integrate spec-architect Phase 1 (requirements gathering)  
**Depends On**: Task 1.3, Task 2.1  
**Acceptance Criteria**:

- [ ] Available via "Plan [feature]" trigger
- [ ] Creates `planning/requirements.md`
- [ ] Gathers requirements through conversation
- [ ] Searches for reusable patterns

**Files Created**:

- `src/specs/shape-phase.ts` (lines 1-250)
- `src/specs/requirements-gatherer.ts` (lines 1-200)

**Tests** (4 tests):

- [ ] Creates correct directory structure
- [ ] Requirements.md has required sections
- [ ] Pattern search includes existing specs
- [ ] Handles user interruption gracefully

---

#### Task 3.2: Write Phase Integration

**Description**: Integrate spec-architect Phase 2 (spec writing)  
**Depends On**: Task 3.1  
**Acceptance Criteria**:

- [ ] Available via "Write spec for [feature]" trigger
- [ ] Loads requirements.md
- [ ] Consciousness Gate 1 validation
- [ ] Creates `spec.md` with all sections

**Files Created**:

- `src/specs/write-phase.ts` (lines 1-300)
- `src/specs/consciousness-gate.ts` (lines 1-150)

**Tests** (4 tests):

- [ ] Spec.md has all required sections
- [ ] Gate 1 blocks non-aligned features
- [ ] Reuses patterns identified in Shape phase
- [ ] Out of scope explicitly documented

---

#### Task 3.3: Tasks Phase Integration

**Description**: Integrate spec-architect Phase 3 (task breakdown)  
**Depends On**: Task 3.2  
**Acceptance Criteria**:

- [ ] Available via "Create tasks for [feature]" trigger
- [ ] Identifies task groups (DB, API, Frontend, Testing)
- [ ] Maps dependencies between tasks
- [ ] Estimates in iterations (not hours)
- [ ] Enforces 400-line limit mentions

**Files Created**:

- `src/specs/tasks-phase.ts` (lines 1-280)
- `src/specs/dependency-mapper.ts` (lines 1-180)
- `src/specs/iteration-estimator.ts` (lines 1-120)

**Tests** (4 tests):

- [ ] Tasks.md has dependency graph
- [ ] All estimates are in iterations
- [ ] 400-line limit mentioned for frontend tasks
- [ ] Parallel tasks correctly identified

---

#### Task 3.4: PBT Enhancement

**Description**: Add PBT validation to spec phases  
**Depends On**: Task 3.3  
**Acceptance Criteria**:

- [ ] Phase 2 identifies PBT-suitable components
- [ ] Phase 3 includes validation tiers
- [ ] Security properties defined in spec.md
- [ ] PBT candidates listed per task group

**Files Created**:

- `src/specs/pbt-integration.ts` (lines 1-200)

**Tests** (3 tests):

- [ ] PBT candidates correctly identified
- [ ] Security properties defined
- [ ] Validation tiers in tasks.md

---

## Task Group 4: PM-Auditor Integration (2 iterations)

### Implementation Tasks

#### Task 4.1: 7-Gate Implementation

**Description**: Implement all 7 quality gates  
**Depends On**: Task 3.3  
**Acceptance Criteria**:

- [ ] Functional Correctness gate works
- [ ] Determinism gate works
- [ ] Observability gate works
- [ ] Security gate works
- [ ] Documentation gate works
- [ ] Regression Protection gate works
- [ ] PBT Validation gate works

**Files Created**:

- `src/pm-auditor/gates.ts` (lines 1-350)
- `src/pm-auditor/gate-checkers/*.ts` (7 files, < 150 lines each)

**Tests** (7 tests - one per gate):

- [ ] Each gate correctly evaluates criteria
- [ ] Gate results are deterministic
- [ ] Failed gates provide specific feedback

---

#### Task 4.2: PM Ledger Structure

**Description**: Create PM ledger directory structure  
**Depends On**: Task 1.1, Task 2.1  
**Acceptance Criteria**:

- [ ] `pm-ledger/` directory created
- [ ] All 5 ledger files have templates
- [ ] Evidence subdirectories created
- [ ] Ledger entries are append-only

**Files Created**:

- `src/pm-auditor/ledger.ts` (lines 1-200)
- `templates/pm-ledger/*.md` (5 files)

**Tests** (3 tests):

- [ ] All ledger files created
- [ ] Entries append correctly
- [ ] Evidence directories organized by milestone

---

#### Task 4.3: Evidence Collection

**Description**: Collect and organize evidence for audits  
**Depends On**: Task 4.2  
**Acceptance Criteria**:

- [ ] Auto-collects test outputs
- [ ] Auto-collects logs
- [ ] Auto-collects PBT results
- [ ] Manual evidence attachment supported
- [ ] Evidence bundle generation

**Files Created**:

- `src/pm-auditor/evidence-collector.ts` (lines 1-250)
- `src/pm-auditor/bundle-generator.ts` (lines 1-150)

**Tests** (4 tests):

- [ ] Auto-collection finds artifacts
- [ ] Bundle includes all evidence types
- [ ] Manual attachment works
- [ ] Bundle is reproducible

---

#### Task 4.4: Verdict Generation

**Description**: Generate PM verdicts with action items  
**Depends On**: Task 4.1, Task 4.3  
**Acceptance Criteria**:

- [ ] 4 verdict types supported (APPROVE, APPROVE-WITH-CONDITIONS, REQUEST-CHANGES, BLOCKED)
- [ ] Verdict includes gate results
- [ ] Verdict includes evidence list
- [ ] Verdict includes next actions
- [ ] Verdict saved to pm-ledger

**Files Created**:

- `src/pm-auditor/verdict-generator.ts` (lines 1-200)

**Tests** (4 tests):

- [ ] Each verdict type generated correctly
- [ ] Gate results included
- [ ] Next actions are actionable
- [ ] Verdict persisted to ledger

---

## Task Group 5: QuantumReef Integration (2 iterations)

### Implementation Tasks

#### Task 5.1: New Task Categories

**Description**: Add spec/pm task categories to QuantumReef  
**Depends On**: Task 3.1, Task 4.1  
**Acceptance Criteria**:

- [ ] Category `plan` added
- [ ] Category `spec` added
- [ ] Category `tasks` added
- [ ] Category `audit` added
- [ ] Category `pm-review` added
- [ ] Priority routing configured

**Files Modified**:

- `docs/integration/quantumreef-orchestrator.md` (add categories)
- `src/quantumreef/task-dispatcher.ts` (lines 1-200)

**Tests** (5 tests):

- [ ] Each category routes to correct handler
- [ ] Priority order respected
- [ ] Fallback to next engine works

---

#### Task 5.2: Protocol Extensions

**Description**: Extend WebSocket protocol for spec/pm events  
**Depends On**: Task 5.1  
**Acceptance Criteria**:

- [ ] Enhanced `task.dispatch` payload supports specContext
- [ ] Enhanced `task.dispatch` payload supports pmContext
- [ ] New `task.progress` checkpoints for spec phases
- [ ] New `pm.verdict` event type
- [ ] Backward compatibility maintained

**Files Created**:

- `src/quantumreef/protocol-extensions.ts` (lines 1-250)

**Tests** (4 tests):

- [ ] Spec context in dispatch works
- [ ] PM context in dispatch works
- [ ] New events parse correctly
- [ ] Backward compatibility verified

---

#### Task 5.3: Progress Streaming

**Description**: Stream spec/pm progress via WebSocket  
**Depends On**: Task 5.2  
**Acceptance Criteria**:

- [ ] Phase checkpoints emit progress events
- [ ] Gate evaluations emit progress events
- [ ] Evidence collection emits progress events
- [ ] Throttled to 500ms (ProgressBridge)
- [ ] Chunked to 300 chars for messaging

**Files Modified**:

- `src/quantumreef/progress-bridge.ts` (lines 1-300)

**Tests** (3 tests):

- [ ] Progress events emitted at checkpoints
- [ ] Throttling works correctly
- [ ] Chunking respects limits

---

#### Task 5.4: Testing & Validation

**Description**: End-to-end testing of QuantumReef integration  
**Depends On**: Task 5.3  
**Acceptance Criteria**:

- [ ] Full spec workflow via QuantumReef works
- [ ] Full PM audit via QuantumReef works
- [ ] Progress streams to phone correctly
- [ ] Verdict received and stored

**Files Created**:

- `tests/e2e/quantumreef-spec.test.ts` (lines 1-200)
- `tests/e2e/quantumreef-pm.test.ts` (lines 1-200)

**Tests** (4 tests):

- [ ] E2E spec creation flow
- [ ] E2E PM audit flow
- [ ] Mobile notification received
- [ ] Verdict stored in ledger

---

## Parallelization Strategy

### Parallel Groups (Can Work Simultaneously)

**After Group 1 completes:**

- Group 2 + Group 3 can work in parallel
- Both need foundation (context detection, initialization)

**After Group 2 & 3 complete:**

- Group 4 can work (needs specs to audit)

**After Group 4 completes:**

- Group 5 can work (needs all previous groups)

### Critical Path

```
Group 1 (2 iter) → Group 2 (2 iter) → Group 4 (2 iter) → Group 5 (2 iter)
               ↘ Group 3 (2 iter) ↗

Total: 2 + max(2,2) + 2 + 2 = 8 iterations minimum
With buffer: 10 iterations
```

---

## Focused Testing Summary

| Group     | Tests  | Coverage                                      |
| --------- | ------ | --------------------------------------------- |
| Group 1   | 11     | Initialization, context detection, triggers   |
| Group 2   | 8      | External memory, templates, context switching |
| Group 3   | 15     | Spec phases, PBT integration                  |
| Group 4   | 18     | Gates, ledger, evidence, verdicts             |
| Group 5   | 16     | Categories, protocol, streaming, E2E          |
| **Total** | **68** | Strategic coverage (not exhaustive)           |

**Target**: 16-34 tests per feature (Orion standard)  
**Actual**: ~68 total (distributed across 5 features)  
**Status**: ✅ Within acceptable range

---

## Acceptance Criteria (Feature Complete)

- [ ] Internal memory_bank initializes on first dev session
- [ ] External memory_bank auto-creates for user projects
- [ ] Spec-architect 3-phase workflow works in both contexts
- [ ] PM-auditor 7-gate evaluation works with evidence
- [ ] QuantumReef dispatches spec/pm tasks correctly
- [ ] Progress streams to mobile via WebSocket
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Consciousness alignment ≥ 7.0/10

---

_Task breakdown complete. Ready for implementation._
