# Clawtopus Rebrand Specification

## Project Identity

**New Name:** Clawtopus  
**Tagline:** *"The eight-armed assistant with a memory that never forgets"*  
**Concept:** Octopus with exceptional memory capabilities - 2 of 8 arms have claws

---

## Components Requiring Rebranding

### 1. Package & Build (High Priority)

| File | Changes Needed |
|------|----------------|
| `package.json` | name → `clawtopus`, bin → `clawtopus` |
| `package.json` | description, homepage, repository |
| `tsdown.config.ts` | output name |
| `tsconfig.json` | No change (internal) |

### 2. CLI Binary & Commands

| File | Changes Needed |
|------|----------------|
| CLI binary name | `openclaw` → `clawtopus` |
| All CLI commands | Update help text, docs links |
| Error messages | Update references |

### 3. Configuration Files

| File | Changes Needed |
|------|----------------|
| `~/.openclaw/` | → `~/.clawtopus/` |
| Config paths | Update all references |
| State directories | Update paths |

### 4. Documentation

| File | Changes Needed |
|------|----------------|
| `README.md` | Full rebrand |
| `docs/` | Docs URLs, branding |
| `AGENTS.md` | Update references |
| `CLAUDE.md` | Symlink to AGENTS.md |

### 5. Source Code - Internal References

| Category | Files | Priority |
|----------|-------|----------|
| Error messages | `*.ts` | Medium |
| Logging | `logger.ts` | Medium |
| Config paths | `config/paths.ts` | High |

### 6. External Integrations (Lower Priority)

| Item | Notes |
|------|-------|
| GitHub repo | Rename `pt-act/openclaw-main` → `clawtopus/clawtopus` |
| npm package | Publish as `clawtopus` |
| Discord | Update bot name |
| Docs domain | `docs.openclaw.ai` → custom |

---

## Files to Update (Detailed)

### High Priority (Must Change)

- [x] `package.json` - name, bin, description, repository
- [x] `README.md` - Full rebrand
- [x] `src/config/paths.ts` - Config directory paths
- [ ] `src/runtime.ts` - Binary name references
- [x] `src/terminal/links.ts` - Docs URL
- [x] `AGENTS.md` - Full rebrand
- [x] `CLAUDE.md` - Symlink to AGENTS.md

### Medium Priority (Should Change)

- [ ] `src/cli/*.ts` - Help text, error messages
- [ ] `src/commands/*.ts` - CLI references
- [ ] `docs/` - All documentation
- [ ] `AGENTS.md` - Project references

### Low Priority (Nice to Have)

- [ ] Comments in source code
- [ ] Logging messages
- Non-user-facing internal names

---

## What to KEEP from OpenClaw

These are your unique differentiators - **do NOT change**:

- ✅ Session Brain implementation
- ✅ Atomic Facts implementation
- ✅ Skill Factory implementation
- ✅ Curriculum Planner implementation
- ✅ All CLI commands you added (`brain:`, `facts:`, `curriculum`)
- ✅ Your sync scripts

---

## Implementation Order

### Phase 1: Core ✅ COMPLETE
1. [x] `package.json` - name, bin, description
2. [x] `src/config/paths.ts` - config directory
3. [x] Build and test basic CLI
4. [x] `README.md` - Full rebrand
5. [x] `AGENTS.md` - Full rebrand
6. [x] `CLAUDE.md` - Symlink

### Phase 2: CLI Surface ✅ COMPLETE
4. [x] Update CLI help text - via `src/cli/cli-name.ts`
5. [x] Update error messages - automatic via resolveCliName()
6. [x] CLI now shows `clawtopus` as primary name

### Phase 3: Documentation ✅ COMPLETE
7. [x] README.md full rebrand
8. [x] Key docs (memory.md updated with Clawtopus features)
9. [x] AGENTS.md update

### Phase 4: External (Day 3+)
10. GitHub repo rename
11. npm publish
12. Custom domain (optional)

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking changes | Keep CLI alias `openclaw` → `clawtopus` |
| Config migration | Auto-detect `~/.openclaw/` and migrate |
| Docs broken | Redirect from old URLs |
| Community confusion | Clear migration guide |

---

## Success Criteria

- [x] `package.json` name changed to `clawtopus`
- [x] CLI binary supports both `clawtopus` and `openclaw` aliases
- [x] Config directory changed to `~/.clawtopus/`
- [x] Build passes
- [x] README rebranded
- [x] AGENTS.md updated
