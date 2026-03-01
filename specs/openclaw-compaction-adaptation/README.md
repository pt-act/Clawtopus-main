# OpenClaw Context Compaction Enhancement

**Adaptation of PLIP Multi-Layered Context Management for OpenClaw**

This document adapts the comprehensive context compaction specification from the PLIP project to OpenClaw's architecture, addressing the CONTRIBUTING.md priority: _"Performance: Optimizing token usage and compaction logic."_

## Overview

OpenClaw already has a functional compaction system. This enhancement proposes adding:

1. **Layered compaction strategies** (beyond current single-pass)
2. **Boundary-based session loading** (prevents exponential context growth)
3. **Compaction events in transcripts** (audit trail)
4. **CLI commands for context management** (manual control)
5. **Degradation warnings** (user transparency)
6. **Export/Import system** (fresh start without losing knowledge)

---

## Documents

- [requirements.md](./requirements.md) - Adapted user stories and requirements
- [spec.md](./spec.md) - Technical specification with OpenClaw mappings
- [tasks.md](./tasks.md) - Implementation breakdown
- [gap-analysis.md](./gap-analysis.md) - Current vs. proposed comparison

---

## Quick Start for Contributors

1. Review `gap-analysis.md` to understand what exists vs. what's new
2. Pick a phase from `tasks.md` (Phase 1 recommended for first contribution)
3. Follow OpenClaw's CONTRIBUTING.md and AGENTS.md guidelines
4. Run `pnpm build && pnpm check && pnpm test` before PR

---

## Key Architectural Decisions

| Decision                             | Rationale                                                 |
| ------------------------------------ | --------------------------------------------------------- |
| Extend existing `compaction.ts`      | Builds on proven codebase, minimizes risk                 |
| Use NDJSON transcript events         | Consistent with OpenClaw's session file format            |
| Integrate with `pi-coding-agent` SDK | Leverages existing `SessionManager` and `SettingsManager` |
| Add CLI commands via `src/commands/` | Follows established command structure                     |
| OpenRouter model support             | Per user's fork (free tier models for compaction)         |

---

## Status

**Phase**: Implementation Complete (14 iterations)  
**Status**: Shipped in OpenClaw  
**Priority**: Complete (per CONTRIBUTING.md roadmap)
