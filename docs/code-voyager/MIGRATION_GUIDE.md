# Migration Guide: From Claude Code-Only to Universal Voyager

This guide helps existing Code Voyager users migrate to the new universal adapter system.

## TL;DR for Existing Users

**Nothing breaks.** The new adapter system is fully backward compatible.
If you're happy with Claude Code, keep using it exactly as before.

## What Changed?

### Before (Claude Code Only)

- Hardcoded to `.claude/` directory
- Only works with Claude Code IDE
- Only uses Claude Agent SDK
- Hooks configured in `.claude/settings.json`

### After (Universal)

- Configurable storage location
- Works with any IDE via adapters
- Supports multiple AI providers
- Backward compatible with Claude Code

## Migration Options

### Option 1: Keep Using Claude Code (Recommended for Existing Users)

**Do nothing.** Everything continues to work.

The adapter system automatically detects Claude Code usage and maintains compatibility.

### Option 2: Migrate to Generic CLI

Gain portability while keeping Claude AI.

**Steps:**

1. Create new config:

```bash
mkdir -p .voyager
cat > .voyager/config.toml << EOF
[voyager]
ide_adapter = "generic_cli"
ai_provider = "claude"
state_dir = ".voyager"
skills_dir = ".voyager/skills"
EOF
```

2. Move your data (optional):

```bash
# Move state
cp -r .claude/voyager .voyager/

# Move skills
cp -r .claude/skills .voyager/skills/
```

3. Update your workflow:

```bash
# Instead of hooks, use CLI commands
voyager session start
# Work on code...
voyager brain update
voyager session end
```

**Benefits:**

- Works with any editor
- Not tied to Claude Code
- Manual control over updates
- Same AI quality (still uses Claude)

**Trade-offs:**

- Manual session management
- No automatic context injection
- Need to remember to update brain

### Option 3: Switch AI Provider

Try OpenAI or local models while keeping your workflow.

#### With Claude Code + OpenAI

```toml
# .claude/voyager/config.toml
[voyager]
ide_adapter = "claude_code"
ai_provider = "openai"
state_dir = ".claude/voyager"
skills_dir = ".claude/skills"

[ai.openai]
model = "gpt-4"
```

```bash
export OPENAI_API_KEY="sk-..."
pip install openai
```

#### With Generic CLI + Ollama

```toml
# .voyager/config.toml
[voyager]
ide_adapter = "generic_cli"
ai_provider = "ollama"

[ai.ollama]
model = "codellama:34b"
base_url = "http://localhost:11434"
```

```bash
ollama pull codellama:34b
ollama serve
```

## Migration Scenarios

### Scenario 1: Solo Developer Using Claude Code

**Current Setup:**

- Claude Code IDE
- `.claude/` directory structure
- Hooks configured

**Recommendation:** Don't migrate. Keep using Claude Code adapter.

**Why:** You're already using the best setup for Claude Code. No benefit to changing.

### Scenario 2: Team with Mixed IDEs

**Current Setup:**

- Some use Claude Code
- Others use VS Code, Vim, etc.
- Want to share skills and memory

**Recommendation:** Migrate to generic CLI + version controlled config.

**Steps:**

1. Move to `.voyager/`:

```bash
mv .claude/voyager .voyager
mv .claude/skills .voyager/skills
```

2. Create shared config:

```bash
cat > .voyager/config.toml << EOF
[voyager]
ide_adapter = "generic_cli"
ai_provider = "claude"
EOF
```

3. Commit to git:

```bash
git add .voyager/
git commit -m "Add universal Voyager config"
```

4. Team members use CLI:

```bash
voyager session start
```

**Benefits:**

- Everyone can participate
- Shared skills and memory
- IDE independence

### Scenario 3: Privacy-Conscious Developer

**Current Setup:**

- Using Claude Code
- Concerned about data privacy
- Has powerful local machine

**Recommendation:** Switch to Ollama with generic CLI.

**Steps:**

1. Install Ollama:

```bash
# From https://ollama.ai/
ollama pull codellama:34b
```

2. Create config:

```bash
mkdir -p .voyager
cat > .voyager/config.toml << EOF
[voyager]
ide_adapter = "generic_cli"
ai_provider = "ollama"

[ai.ollama]
model = "codellama:34b"
EOF
```

3. Migrate data:

```bash
cp -r .claude/voyager .voyager/
```

4. Use normally:

```bash
voyager session start
```

**Benefits:**

- Complete privacy
- No data leaves your machine
- No API costs
- Offline capable

### Scenario 4: Cost-Conscious Developer

**Current Setup:**

- Using Claude Code
- High API costs

**Recommendation:** Use hybrid approach with multiple providers.

**Steps:**

1. Configure multiple providers:

```toml
[voyager]
ide_adapter = "generic_cli"
ai_provider = "ollama"  # Default to free

[ai.ollama]
model = "llama3.1:8b"  # Fast, free

[ai.claude]
model = "claude-3-5-sonnet-20241022"  # Best quality

[ai.openai]
model = "gpt-3.5-turbo"  # Cheap
```

2. Use strategically:

```bash
# Quick brain updates (free)
voyager brain update --provider ollama

# Important skill generation (best quality)
voyager factory propose --provider claude

# Simple questions (cheap)
voyager ask "What's next?" --provider openai
```

**Benefits:**

- Significantly lower costs
- Use expensive models only when needed
- Maintain quality for critical tasks

## Data Migration

### Brain State

Brain state is stored in JSON and Markdown files.

**Claude Code location:**

- `.claude/voyager/brain.json`
- `.claude/voyager/brain.md`

**Universal location:**

- `.voyager/brain.json`
- `.voyager/brain.md`

**Migration:**

```bash
cp .claude/voyager/brain.* .voyager/
```

### Skills

Skills are directories with metadata.

**Claude Code location:**

- `.claude/skills/`

**Universal location:**

- `.voyager/skills/`

**Migration:**

```bash
cp -r .claude/skills/* .voyager/skills/
```

### Curriculum

Curriculum plans are JSON/Markdown files.

**Migration:**

```bash
cp .claude/voyager/curriculum.* .voyager/
```

### Feedback Database

Feedback is stored in SQLite.

**Migration:**

```bash
cp .claude/voyager/feedback.db .voyager/
```

## Configuration Migration

### From Hooks to CLI

**Before (.claude/settings.json):**

```json
{
  "hooks": {
    "SessionStart": [{ "type": "command", "command": "voyager hook session-start" }],
    "SessionEnd": [{ "type": "command", "command": "voyager hook session-end" }]
  }
}
```

**After (manual commands):**

```bash
# Start session
voyager session start

# End session
voyager session end
```

**Or use shell hooks (.bashrc):**

```bash
function cd() {
  builtin cd "$@"
  if [ -f ".voyager/config.toml" ]; then
    voyager session start --quiet
  fi
}
```

## Verification

### Check Migration Success

1. **Verify config loads:**

```bash
voyager config show
```

2. **Check brain state:**

```bash
cat .voyager/brain.md
```

3. **List skills:**

```bash
ls .voyager/skills/
```

4. **Test brain update:**

```bash
voyager brain update --dry-run
```

5. **Test skill search:**

```bash
voyager skill find "test"
```

## Rollback

If you need to rollback:

1. **Keep original files:**

```bash
# Don't delete .claude/ during migration
cp -r .claude/voyager .voyager/  # Copy, don't move
```

2. **Restore config:**

```bash
rm .voyager/config.toml
```

3. **Use Claude Code hooks again:**

- Hooks still work as before
- Original files unchanged

## Common Issues

### Issue: Config not found

**Problem:** Voyager doesn't find your config.

**Solution:**

```bash
# Check where it's looking
voyager config show --verbose

# Use explicit path
voyager --config .voyager/config.toml brain update
```

### Issue: Skills not loaded

**Problem:** Skills from `.claude/skills/` not found.

**Solution:**

```toml
[voyager]
skills_dir = ".claude/skills"  # Point to old location
```

Or:

```bash
cp -r .claude/skills .voyager/skills
```

### Issue: API provider not available

**Problem:** "Provider not available" error.

**Solution:**

```bash
# Install required package
pip install openai  # For OpenAI
pip install httpx   # For Ollama

# Set API key
export OPENAI_API_KEY="sk-..."
```

### Issue: Brain state empty after migration

**Problem:** Brain shows as empty.

**Solution:**

```bash
# Verify files copied
ls -la .voyager/brain.*

# Check file contents
cat .voyager/brain.json

# If missing, copy again
cp .claude/voyager/brain.* .voyager/
```

## Best Practices

### 1. Test Before Committing

```bash
# Test config
voyager config validate

# Test brain load
voyager brain show

# Test provider
voyager ask "test" --dry-run
```

### 2. Keep Backups

```bash
# Backup before migration
tar -czf voyager-backup-$(date +%Y%m%d).tar.gz .claude/voyager/
```

### 3. Gradual Migration

Don't migrate everything at once:

1. Week 1: Add generic CLI config, test alongside hooks
2. Week 2: Try OpenAI/Ollama for non-critical tasks
3. Week 3: Fully migrate if satisfied

### 4. Document for Team

If migrating a team:

1. Create migration plan document
2. Test with one person first
3. Schedule migration day
4. Provide support during transition

## FAQ

### Q: Will my hooks stop working?

**A:** No. Claude Code hooks continue to work. The adapter system wraps them transparently.

### Q: Can I use both Claude Code and generic CLI?

**A:** Yes. Configure for Claude Code, use CLI commands as needed:

```bash
# Claude Code handles sessions automatically
# But you can also use CLI:
voyager brain show
voyager skill find "deployment"
```

### Q: Do I need to reconfigure hooks?

**A:** No. If your hooks work now, they'll keep working.

### Q: Can I switch AI providers without changing IDEs?

**A:** Yes. IDE adapter and AI provider are independent:

```toml
ide_adapter = "claude_code"  # Keep using Claude Code
ai_provider = "openai"       # But switch to OpenAI
```

### Q: Will this break my team's setup?

**A:** No. Changes are opt-in. Team members can migrate individually.

### Q: Is the new system slower?

**A:** No. Performance is identical. The adapter is just a thin wrapper.

### Q: Can I go back to Claude Code-only?

**A:** Yes. Just remove `.voyager/config.toml` and use hooks as before.

## Support

If you run into issues:

1. **Check docs:**
   - [Configuration Guide](docs/configuration.md)
   - [IDE Adapters](docs/ide-adapters.md)
   - [AI Providers](docs/ai-providers.md)

2. **Validate setup:**

```bash
voyager config validate
voyager config check-providers
```

3. **Ask for help:**
   - Open an issue on GitHub
   - Include `voyager config show` output
   - Describe what you're trying to achieve

## Summary

| Migration Path     | Difficulty | Benefits                | When to Choose         |
| ------------------ | ---------- | ----------------------- | ---------------------- |
| **No migration**   | None       | None                    | Happy with Claude Code |
| **Generic CLI**    | Easy       | IDE independence        | Use multiple editors   |
| **OpenAI**         | Easy       | Lower cost, flexibility | Cost-conscious         |
| **Ollama**         | Medium     | Privacy, offline        | Privacy-focused        |
| **Full migration** | Medium     | Maximum portability     | Team with mixed IDEs   |

**Recommendation for most users:** Start with generic CLI, keep Claude AI.
It's the smallest change with the biggest benefit (portability).
