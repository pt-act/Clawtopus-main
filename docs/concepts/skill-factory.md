---
title: "Skill Factory"
summary: "Auto-generate skills from your workflow patterns"
read_when:
  - You want to automate repetitive workflows
  - You're curious how Clawtopus learns from your patterns
---

# Skill Factory 🏭

Skill Factory automatically detects repetitive workflows and proposes custom skills to automate them.

## How It Works

1. **Pattern Detection**: Clawtopus monitors your tool usage patterns across sessions
2. **Frequency Analysis**: Identifies recurring tool sequences (e.g., `Read → Edit → Write` repeated often)
3. **Skill Proposal**: Suggests new skills based on detected patterns
4. **Auto-Generation**: Creates ready-to-use skills from your workflows

## Storage

- Patterns: `~/.clawtopus/voyager/skills/patterns.json`
- Generated skills: `~/.clawtopus/skills/custom/`

## CLI Commands

```bash
# View detected patterns
clawtopus memory factory patterns

# List generated/proposed skills
clawtopus memory factory skills

# Enable/disable pattern detection
clawtopus config set agents.defaults.skillFactory.enabled true
```

## Configuration

```json5
{
  agents: {
    defaults: {
      skillFactory: {
        enabled: true,
        minFrequency: 3, // patterns seen 3+ times
        minSequenceLength: 2, // at least 2 tools in sequence
        autoGenerate: false, // require approval before creating skills
      },
    },
  },
}
```

## Example

If you frequently run:

```bash
clawtopus send "list all files in src/"
clawtopus send "show me the imports in those files"
clawtopus send "explain what each file does"
```

Skill Factory detects this pattern and might propose a skill like `analyze-project` that combines all three operations.

## Pattern Schema

```typescript
interface WorkflowPattern {
  id: string;
  name: string;
  description: string;
  tools: string[]; // e.g., ["Bash", "Read", "Edit"]
  frequency: number; // how often this pattern occurs
  lastSeen: number; // timestamp
  sessions: string[]; // sessions where pattern was seen
  suggestedSkill?: string; // proposed skill name
}
```
