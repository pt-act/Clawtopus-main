# 📍 Memory Bank Location Update

> **Date**: 2026-02-27  
> **Change**: Platform memory bank location updated from `~/.clawtopus/` to project root

---

## ✅ What Was Created

```
/Users/rna/Desktop/Clawtopus-main/memory_bank/
├── MASTER_CONTEXT.md          ✅ Platform vision & roadmap
├── DEVELOPMENT_HISTORY.md     ✅ Feature log (reverse-chronological)
├── CONSCIOUSNESS_LOG.md       ✅ Alignment scores
├── ARCHITECTURAL_DECISIONS.md ✅ ADR records
├── POWER_ACTIVATION_LOG.md    ✅ Context efficiency metrics
└── pm-ledger/                 ✅ PM audit trail
    ├── decisions.md
    ├── risks.md
    ├── questions.md
    ├── milestones.md
    └── evidence/
```

---

## 🔄 Architecture Decision Change

### **Original Design (Spec)**

```
~/.clawtopus/memory_bank/        ← Internal (platform)
<project>/memory_bank/           ← External (user projects)
```

### **Updated Design (Implemented)**

```
./memory_bank/                   ← Internal (platform) - MASTER_CONTEXT.md
<project>/memory_bank/           ← External (user projects) - PROJECT_CONTEXT.md
```

### **Why the Change?**

1. **Consistency**: Both internal and external memory use same structure
2. **Version Control**: Platform memory can be committed with the codebase
3. **Portability**: Project self-contained, no hidden directories in home
4. **Transparency**: Easy to find and inspect
5. **Backup**: Included in project backups automatically

---

## 🎯 Context Detection Logic

The system now detects context by **checking what's IN the memory_bank**:

| Context                 | Detected By                 | Location                 |
| ----------------------- | --------------------------- | ------------------------ |
| **Internal** (Platform) | `MASTER_CONTEXT.md` exists  | `./memory_bank/`         |
| **External** (User)     | `PROJECT_CONTEXT.md` exists | `<project>/memory_bank/` |
| **Uninitialized**       | No memory_bank found        | N/A                      |

---

## 🚀 Usage

### Platform Development (You, working on Clawtopus)

```bash
cd /Users/rna/Desktop/Clawtopus-main
# Memory bank automatically detected as INTERNAL
# Uses MASTER_CONTEXT.md, DEVELOPMENT_HISTORY.md, etc.
```

### User Project Development (End users)

```bash
cd /Users/rna/some-user-project
# First interaction creates EXTERNAL memory bank
# Uses PROJECT_CONTEXT.md, USER_PREFERENCES.md, etc.
```

---

## 📊 Status

- ✅ **Platform memory bank**: `/Users/rna/Desktop/Clawtopus-main/memory_bank/`
- ✅ **Context detection**: Updated to check file contents (MASTER_CONTEXT.md vs PROJECT_CONTEXT.md)
- ✅ **Initialization script**: `scripts/init-platform-memory.ts`

### Next Steps

1. **Add specs**: Create feature specs in `memory_bank/specs/`
2. **Use spec-architect**: Run `runSpecArchitect('feature-name', 'description')`
3. **PM audit**: Run `qualityGates.runAllGates()` on implementations

---

## 📝 Files Updated

- `src/memory/context-detector.ts` - Detects by file contents, not path
- `src/memory/internal/init.ts` - Uses `process.cwd()` instead of `~/.clawtopus/`
- `scripts/init-platform-memory.ts` - Creates memory_bank at project root

---

**Tat Tvam Asi** 🕉️  
_The memory is now part of the project itself._
