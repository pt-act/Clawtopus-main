# Generic CLI Usage Example

This example shows how to use Code Voyager with any CLI or terminal environment,
without IDE-specific hooks.

## Setup

1. Install Voyager:

```bash
uv tool install "git+https://github.com/zenbase-ai/code-voyager.git"
```

2. Copy the configuration to your project:

```bash
mkdir -p .voyager
cp voyager.toml .voyager/config.toml
```

3. Initialize Voyager:

```bash
voyager init
```

## Usage

### Start a Session

```bash
# Start a new session
voyager session start

# This will display your brain state if one exists
```

### Work on Code

Work normally on your code. Voyager won't interfere.

### Ask Questions

```bash
# Ask what you were working on
voyager ask "What were we working on last session?"

# Get suggestions for next steps
voyager ask "What should I work on next?"
```

### Update Brain State

```bash
# Manually update the brain with your progress
voyager brain update --notes "Implemented user authentication"

# Or update from a conversation transcript
voyager brain update --transcript session.jsonl
```

### Create Skills

```bash
# Propose new skills based on your workflows
voyager factory propose

# List pending skill proposals
voyager factory list

# Scaffold a specific skill
voyager factory scaffold --name deploy-to-prod
```

### End a Session

```bash
# End the current session
voyager session end
```

## Brain State

Your brain state is stored in `.voyager/brain.json` and `.voyager/brain.md`.

You can view it at any time:

```bash
# View brain state as markdown
cat .voyager/brain.md

# Or load it programmatically
voyager brain show
```

## Skills

Skills are stored in `.voyager/skills/`.

You can:

```bash
# List all skills
voyager skill list

# Search for skills semantically
voyager skill find "deployment workflow"

# Index skills for search
voyager skill index
```

## Integration with Other Tools

### Shell Hooks

Add these to your `.bashrc` or `.zshrc`:

```bash
# Auto-start session when entering a voyager-enabled project
function cd() {
  builtin cd "$@"
  if [ -f ".voyager/config.toml" ]; then
    voyager session start --quiet
  fi
}

# Auto-end session on shell exit
trap 'voyager session end --quiet' EXIT
```

### Git Hooks

Add to `.git/hooks/post-commit`:

```bash
#!/bin/bash
# Update brain state after each commit
voyager brain update --notes "Committed: $(git log -1 --pretty=%B)"
```

## Benefits

- **No IDE lock-in**: Works with any editor or CLI
- **Manual control**: You decide when to update state
- **Scriptable**: Easy to integrate into your existing workflows
- **Portable**: Your memory travels with your code
