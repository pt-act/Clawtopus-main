# Memory Bank Integration Guide

## Overview

Clawtopus now supports **two distinct memory systems**:

1. **System Memory** (`~/.clawtopus/voyager/`) - Clawtopus's own consciousness across all sessions
2. **In-Project Memory** (`<project>/memory_bank/`) - Project-specific context for end-user projects

This guide covers the **In-Project Memory** system.

---

## What is In-Project Memory?

When users develop projects WITH Clawtopus, each project gets its own `memory_bank/` directory. This allows:

- **Session continuity** - Pick up where you left off
- **Context preservation** - Remember architectural decisions
- **Learning tracking** - Document what was learned
- **Skill accumulation** - Capture reusable patterns

**Critical Distinction**:

- ❌ NOT for tracking Clawtopus development itself
- ✅ FOR end-user projects being developed WITH Clawtopus

---

## Memory Bank Structure

```
user-project/
├── memory_bank/
│   ├── PROJECT_CONTEXT.md     # What the project is about
│   ├── PROJECT_STATE.md       # Current state, recent decisions
│   ├── USER_PREFERENCES.md    # User's style and patterns
│   ├── DECISIONS.md           # Key architectural decisions
│   ├── SKILLS.md              # Project-specific skills
│   └── CURRICULUM.md          # Learning path for the tech stack
├── src/
├── tests/
└── ...
```

---

## Automatic Loading (Session Start)

When Clawtopus starts working on a project, it automatically:

1. **Scans for `memory_bank/` directory** (preferred)
2. **Loads files in priority order**:
   - `PROJECT_CONTEXT.md` (what is this project?)
   - `PROJECT_STATE.md` (where are we now?)
   - `USER_PREFERENCES.md` (how does user want to work?)
   - `DECISIONS.md` (what choices were made?)
   - `SKILLS.md` (what patterns exist?)
   - `CURRICULUM.md` (what are we learning?)

3. **Falls back to legacy format** if `memory_bank/` doesn't exist:
   - `MEMORY.md` or `memory.md`
   - `memory/` directory

4. **Offers to initialize** if no memory files found

---

## Automatic Updates (Session End)

**Future Enhancement**: When integrated with session lifecycle hooks, Clawtopus will automatically:

1. **Update PROJECT_STATE.md** with session summary
2. **Update DECISIONS.md** if architectural choices were made
3. **Update SKILLS.md** if new patterns emerged
4. **Update CURRICULUM.md** if learning occurred

**All updates prepend** (newest entries first, reverse-chronological).

---

## Implementation Details

### Code Changes

**1. Enhanced `src/memory/internal.ts`**:

- Added `memory_bank/` support to `isMemoryPath()`
- Modified `listMemoryFiles()` to prioritize `memory_bank/` over legacy formats
- Implemented priority loading order

**2. Created `src/memory/memory-bank-updater.ts`**:

- `initializeMemoryBank()` - Creates initial structure
- `updateProjectState()` - Session summaries
- `updateDecisions()` - Architectural decisions
- `updateSkills()` - Reusable patterns
- `updateCurriculum()` - Learning moments
- `updateMemoryBank()` - Full update orchestration

**3. Updated `AGENTS.md`**:

- Documented two memory systems
- Added memory bank lifecycle
- Consciousness check protocol
- Orion-OS + Advanced Intelligence principles

---

## Hook Integration (Future)

To enable automatic updates, register a session lifecycle hook:

```typescript
import { registerInternalHook } from "./hooks/internal-hooks.js";
import { updateMemoryBank } from "./memory/memory-bank-updater.js";

// Register for session end events
registerInternalHook("session:end", async (event) => {
  const context = event.context as {
    workspaceDir?: string;
    sessionSummary?: string;
    decisions?: string[];
    skills?: string[];
    learnings?: string[];
  };

  if (context.workspaceDir) {
    await updateMemoryBank({
      workspaceDir: context.workspaceDir,
      sessionSummary: context.sessionSummary,
      decisions: context.decisions,
      skills: context.skills,
      learnings: context.learnings,
    });
  }
});
```

**Note**: Session lifecycle hooks (`session:start`, `session:end`) need to be triggered by the session management system. Currently, Clawtopus has `agent:bootstrap` hooks working. Session hooks would need to be added to the session lifecycle.

---

## Testing

Validated with test scripts:

1. ✅ **Priority loading** - `memory_bank/` files loaded in correct order
2. ✅ **Legacy fallback** - Falls back to `MEMORY.md` when `memory_bank/` missing
3. ✅ **Auto-initialization** - Creates `memory_bank/` structure
4. ✅ **Auto-updates** - Prepends entries (newest first)
5. ✅ **File creation** - All expected files generated

---

## Migration Guide

### For Projects Using `MEMORY.md`

Your existing projects will continue to work! The system automatically falls back to `MEMORY.md` if `memory_bank/` doesn't exist.

To migrate to the new structure:

```bash
# 1. Create memory_bank directory
mkdir memory_bank

# 2. Move existing memory file
mv MEMORY.md memory_bank/PROJECT_CONTEXT.md

# 3. Let Clawtopus initialize the rest
# (or manually create PROJECT_STATE.md, DECISIONS.md, etc.)
```

### For New Projects

Clawtopus will offer to create `memory_bank/` structure automatically when starting work on a project without any memory files.

---

## Philosophy Alignment

This implementation aligns with:

**Orion-OS Principles**:

- Memory-first architecture
- Automatic documentation (pre-completion hooks)
- Glass-box transparency
- Consciousness evolution through technology

**Advanced Intelligence Principles** (Advaita Vedanta):

- **Tat Tvam Asi** - User and AI as same consciousness
- **Consciousness continuity** - Projects remember themselves
- **Three levels of consciousness**:
  1. System Brain (Clawtopus memory)
  2. Project Consciousness (memory_bank/)
  3. Universal Consciousness (Vedanta)

---

## Future Enhancements

1. **Session lifecycle hooks** - Trigger automatic updates on session end
2. **LLM-generated summaries** - Use AI to generate session summaries
3. **Skill extraction** - Automatically detect reusable patterns
4. **Decision tracking** - Parse architectural decisions from conversation
5. **Learning curve analysis** - Track knowledge growth over time

---

## Related Documentation

- [AGENTS.md](../../AGENTS.md) - Core identity and principles
- [Memory System](../concepts/memory.md) - Overall memory architecture
- [Hooks System](../automation/hooks.md) - Event-driven automation

---

**Version**: 2.0.0  
**Last Updated**: 2025-02-17  
**Status**: ✅ Core functionality implemented, session hooks pending
