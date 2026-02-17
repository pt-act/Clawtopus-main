# Memory Bank Templates

These template files help Clawtopus maintain continuity across sessions for your project.

## File Structure

```
project/
└── memory_bank/
    ├── PROJECT_CONTEXT.md     # What the project is
    ├── PROJECT_STATE.md       # Current state, recent sessions
    ├── USER_PREFERENCES.md    # Your work style and preferences
    ├── DECISIONS.md          # Key architectural decisions
    ├── SKILLS.md             # Project-specific patterns
    └── CURRICULUM.md         # Learning path for tech stack
```

## How to Use

### Option 1: Copy All Templates

```bash
cp -r docs/reference/templates/memory_bank your-project/memory_bank
```

### Option 2: Copy Individual Files

```bash
mkdir -p your-project/memory_bank
cp docs/reference/templates/memory_bank/PROJECT_CONTEXT.md your-project/memory_bank/
cp docs/reference/templates/memory_bank/PROJECT_STATE.md your-project/memory_bank/
# ... etc
```

### Option 3: Use CLI Command (Coming Soon)

```bash
clawtopus init-memory-bank
```

## File Descriptions

### PROJECT_CONTEXT.md

**Purpose**: High-level overview of what the project is and why it exists.

**Updated**: Manually when project scope changes; auto-updated on major milestones.

**Priority**: Load first (highest priority context).

---

### PROJECT_STATE.md

**Purpose**: Track current work, recent sessions, what's in progress.

**Updated**: Automatically at the end of each Clawtopus session.

**Priority**: Load second (current state matters most).

---

### USER_PREFERENCES.md

**Purpose**: Define how Clawtopus should work with you on this project.

**Updated**: Manually when your preferences change.

**Priority**: Load third (influences interaction style).

---

### DECISIONS.md

**Purpose**: Document important architectural and technical decisions.

**Updated**: Manually when key decisions are made; auto-updated for major changes.

**Priority**: Reference as needed.

---

### SKILLS.md

**Purpose**: Capture project-specific patterns, conventions, and reusable code.

**Updated**: Auto-updated when new patterns emerge during sessions.

**Priority**: Reference as needed.

---

### CURRICULUM.md

**Purpose**: Track learning progress for the tech stack.

**Updated**: Manually as you learn; auto-updated when new concepts are introduced.

**Priority**: Reference as needed.

---

## Loading Priority

When Clawtopus starts a session, it loads files in this order:

1. **PROJECT_CONTEXT.md** → Understand what the project is
2. **PROJECT_STATE.md** → Know where we are now
3. **USER_PREFERENCES.md** → Learn how to work with you
4. **DECISIONS.md** → Be aware of key architectural choices
5. **SKILLS.md** → Know project-specific patterns
6. **CURRICULUM.md** → Understand learning goals

## Automatic Updates

Clawtopus automatically updates these files:

- ✅ **PROJECT_STATE.md** - Every session end
- ⚡ **SKILLS.md** - When new patterns are identified
- 📝 **PROJECT_CONTEXT.md** - On major milestones

You should manually update:

- **USER_PREFERENCES.md** - When your preferences change
- **DECISIONS.md** - When making architectural decisions
- **CURRICULUM.md** - As you learn new concepts

## Tips

1. **Start Simple**: You don't need all files. Start with just `PROJECT_CONTEXT.md` and `PROJECT_STATE.md`.

2. **Update Preferences Early**: Set `USER_PREFERENCES.md` in your first session to get the best experience.

3. **Document Decisions**: Use `DECISIONS.md` to avoid revisiting solved problems.

4. **Trust the Auto-Updates**: Let Clawtopus maintain `PROJECT_STATE.md` automatically.

5. **Review Regularly**: Scan `PROJECT_STATE.md` at the start of each session.

---

_For more information, see the [Memory Bank Integration Guide](../memory-bank-integration.md)_
