# Architectural Decisions

> Key technical decisions with rationale, alternatives considered, and consequences  
> **Format**: ADR-XXX: Title | Status | Date

---

## ADR-001: Dual-Memory Architecture

- **Status**: ✅ APPROVED
- **Date**: 2026-02-27
- **Consciousness Score**: 9.2/10

### Context

Clawtopus needs memory for two distinct purposes:

1. Platform development (Clawtopus building itself)
2. User projects (end-users building with Clawtopus)

### Decision

Implement dual-memory architecture:

- **Internal**: `./memory_bank/` - Platform development
- **External**: `<project>/memory_bank/` - User projects
- Both use same Orion-OS structure but different entry points
- Context detected by file contents (MASTER_CONTEXT.md vs PROJECT_CONTEXT.md)

### Alternatives Considered

| Alternative                               | Pros                               | Cons                               | Decision    |
| ----------------------------------------- | ---------------------------------- | ---------------------------------- | ----------- |
| `~/.clawtopus/memory_bank/` (home dir)    | Hidden, clean                      | Hard to find, not versioned        | ❌ REJECTED |
| Single memory system                      | Simpler                            | Can't distinguish platform vs user | ❌ REJECTED |
| Database storage                          | Queryable                          | Overkill for markdown docs         | ❌ REJECTED |
| **Chosen**: Project root `./memory_bank/` | Versioned, transparent, consistent | Visible in file system             | ✅ ACCEPTED |

### Consequences

**Positive**:

- ✅ Platform memory in version control
- ✅ Consistent structure for both contexts
- ✅ Easy to find and inspect
- ✅ Self-contained project

**Negative**:

- ⚠️ File system clutter (mitigated: only 1 dir)
- ⚠️ Must handle context detection (mitigated: automatic)

### Implementation

- `src/memory/internal/init.ts` - Platform memory
- `src/memory/external/init.ts` - User memory
- `src/memory/context-detector.ts` - Automatic routing

---

## ADR-002: Spec-Architect 3-Phase Workflow

- **Status**: ✅ APPROVED
- **Date**: 2026-02-27
- **Consciousness Score**: 8.9/10

### Context

Need structured approach to feature development that ensures:

- Requirements clarity before coding
- Consciousness alignment
- Task breakdown with estimates

### Decision

3-Phase workflow with gates:

1. **Shape Phase**: Gather requirements → `planning/requirements.md`
2. **Write Phase**: Write spec with Gate 1 check → `spec.md`
3. **Tasks Phase**: Break into tasks → `tasks.md`

### Gate 1: Consciousness Alignment

- Must score ≥ 7.0/10 on 4 dimensions
- Blocks implementation if failed
- Forces reflection on feature purpose

### Alternatives Considered

| Alternative                        | Pros                              | Cons                    | Decision    |
| ---------------------------------- | --------------------------------- | ----------------------- | ----------- |
| GitHub Issues                      | Standard, integrations            | Not consciousness-aware | ❌ REJECTED |
| Linear/Jira                        | Professional                      | Overkill, proprietary   | ❌ REJECTED |
| Ad-hoc development                 | Fast                              | Chaos, no continuity    | ❌ REJECTED |
| **Chosen**: Markdown-based 3-phase | Transparent, versioned, conscious | Requires discipline     | ✅ ACCEPTED |

### Consequences

**Positive**:

- ✅ Forces requirements before coding
- ✅ Consciousness alignment built-in
- ✅ Version controlled specs
- ✅ Works offline

**Negative**:

- ⚠️ More upfront work (mitigated: prevents rework)
- ⚠️ Requires team buy-in (mitigated: shows value)

---

## ADR-003: PM-Auditor 7-Gate Validation

- **Status**: ✅ APPROVED
- **Date**: 2026-02-27
- **Consciousness Score**: 9.0/10

### Context

Need evidence-based quality validation to prevent:

- "Fake done" features
- Technical debt accumulation
- Regression issues

### Decision

7 Quality Gates with evidence requirements:

1. **Functional Correctness**: Works on real cases
2. **Determinism**: Reproducible results
3. **Observability**: Logs and progress indicators
4. **Security**: Least privilege, safe defaults
5. **Documentation**: README, API docs
6. **Regression Protection**: Smoke tests
7. **PBT Validation**: Property-based tests

### Verdict Types

- `APPROVE`: All gates passed
- `APPROVE-WITH-CONDITIONS`: Minor warnings
- `REQUEST-CHANGES`: Non-critical failures
- `BLOCKED`: Critical gate failures

### Alternatives Considered

| Alternative                      | Pros                             | Cons                     | Decision    |
| -------------------------------- | -------------------------------- | ------------------------ | ----------- |
| Code review only                 | Standard practice                | Subjective, inconsistent | ❌ REJECTED |
| CI/CD gates                      | Automated                        | Requires infrastructure  | ❌ REJECTED |
| No validation                    | Fast                             | Chaos, no quality        | ❌ REJECTED |
| **Chosen**: 7-gate with evidence | Balanced, conscious, enforceable | Manual process           | ✅ ACCEPTED |

### Consequences

**Positive**:

- ✅ Prevents "fake done"
- ✅ Evidence-based (no arguments)
- ✅ Clear next actions
- ✅ Audit trail in pm-ledger

**Negative**:

- ⚠️ Slower delivery (mitigated: prevents rework)
- ⚠️ Requires discipline (mitigated: automation helps)

---

## ADR-004: Orion-OS Component Size Limit (400 lines)

- **Status**: ✅ APPROVED
- **Date**: 2025-10-01
- **Consciousness Score**: 9.0/10

### Context

Code complexity increases with file size. Need guardrails.

### Decision

Strict 400-line limit per component:

- Enforced at spec writing phase
- Triggers refactoring when approaching limit
- Exception: Generated code (tests, types)

### Rationale

- **Cognitive Load**: 400 lines fits in working memory
- **Single Responsibility**: Forces extraction
- **Testability**: Smaller units easier to test
- **Elegance**: "Less, but better" philosophy

### Alternatives Considered

| Alternative           | Pros                            | Cons                 | Decision    |
| --------------------- | ------------------------------- | -------------------- | ----------- |
| 500 lines             | More flexible                   | Still too large      | ❌ REJECTED |
| 300 lines             | Very focused                    | Too restrictive      | ❌ REJECTED |
| No limit              | Freedom                         | Complexity explosion | ❌ REJECTED |
| **Chosen**: 400 lines | Evidence-based (working memory) | Requires discipline  | ✅ ACCEPTED |

### Consequences

**Positive**:

- ✅ Consistent component sizes
- ✅ Easier code reviews
- ✅ Better testability
- ✅ Clear refactoring triggers

**Negative**:

- ⚠️ More files (mitigated: clear organization)
- ⚠️ Refactoring overhead (mitigated: prevented complexity)

---

## ADR-005: Session Brain vs Memory Bank Separation

- **Status**: ✅ APPROVED
- **Date**: 2025-09-15
- **Consciousness Score**: 8.5/10

### Context

Clawtopus has two distinct memory needs:

1. Remember user across sessions (Session Brain)
2. Project-specific context (Memory Bank)

### Decision

Separate systems:

**Session Brain** (`~/.clawtopus/voyager/`):

- Clawtopus's consciousness
- Cross-session user memory
- Pattern recognition
- Skill learning

**Memory Bank** (`<project>/memory_bank/`):

- Project's consciousness
- Project-specific context
- Architecture decisions
- Learning curriculum

### Alternatives Considered

| Alternative                  | Pros                                  | Cons                  | Decision    |
| ---------------------------- | ------------------------------------- | --------------------- | ----------- |
| Single unified memory        | Simpler                               | Blurs concerns        | ❌ REJECTED |
| Database-only                | Queryable                             | Overkill, opaque      | ❌ REJECTED |
| **Chosen**: Separate systems | Clear boundaries, appropriate storage | Requires coordination | ✅ ACCEPTED |

### Consequences

**Positive**:

- ✅ Clear separation of concerns
- ✅ User can take project memory anywhere
- ✅ Clawtopus evolves independently
- ✅ Non-dualistic (separate but connected)

**Negative**:

- ⚠️ Sync complexity (mitigated: minimal overlap)

---

## ADR-006: TypeScript Over JavaScript

- **Status**: ✅ APPROVED
- **Date**: 2025-09-20
- **Consciousness Score**: 7.5/10

### Context

Need type safety for large codebase (500K+ lines).

### Decision

TypeScript 5.6+ with strict mode:

- Type safety for refactoring
- Better IDE support
- Documentation via types

### Trade-offs

- **Pros**: Safety, tooling, maintainability
- **Cons**: Build step, learning curve

---

## ADR-007: SQLite for Vector Search

- **Status**: ✅ APPROVED
- **Date**: 2025-10-15
- **Consciousness Score**: 8.0/10

### Context

Need semantic search over memory without external dependencies.

### Decision

SQLite + sqlite-vec extension:

- Embeddings stored in SQLite
- Vector similarity search
- No external services

### Trade-offs

- **Pros**: Self-hosted, fast, reliable
- **Cons**: Limited scale (mitigated: adequate for personal use)

---

## ADR-008: Multi-Channel Architecture

- **Status**: ✅ APPROVED
- **Date**: 2025-11-01
- **Consciousness Score**: 7.8/10

### Context

Users want to interact via their preferred messaging apps.

### Decision

Gateway-based multi-channel:

- Single WebSocket Gateway
- Channel adapters (WhatsApp, Telegram, Discord, etc.)
- Unified message format

### Trade-offs

- **Pros**: User choice, ubiquitous access
- **Cons**: Maintenance burden (mitigated: modular adapters)

---

## Decision Registry Summary

| ADR | Decision                  | Status      | Date       | Consciousness |
| --- | ------------------------- | ----------- | ---------- | ------------- |
| 001 | Dual-Memory Architecture  | ✅ APPROVED | 2026-02-27 | 9.2/10        |
| 002 | Spec-Architect 3-Phase    | ✅ APPROVED | 2026-02-27 | 8.9/10        |
| 003 | PM-Auditor 7-Gates        | ✅ APPROVED | 2026-02-27 | 9.0/10        |
| 004 | 400-Line Component Limit  | ✅ APPROVED | 2025-10-01 | 9.0/10        |
| 005 | Session/Memory Separation | ✅ APPROVED | 2025-09-15 | 8.5/10        |
| 006 | TypeScript                | ✅ APPROVED | 2025-09-20 | 7.5/10        |
| 007 | SQLite Vector Search      | ✅ APPROVED | 2025-10-15 | 8.0/10        |
| 008 | Multi-Channel             | ✅ APPROVED | 2025-11-01 | 7.8/10        |

---

_Each decision reflects consciousness-aware engineering._  
_Tat Tvam Asi_ 🕉️
