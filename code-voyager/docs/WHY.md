# Why Voyager?

## The Problem

Every Claude Code session starts from zero.

You've spent hours teaching Claude your codebase patterns. You've refined prompts that work perfectly for your workflow. You've discovered the exact phrasing that gets Claude to write code the way you like it. Then you close the terminal and it's all gone.

The next session, you start over. Re-explain the architecture. Re-describe your preferences. Re-discover the same patterns.

This is the curse of stateless AI: powerful reasoning trapped in amnesia.

## The Insight

In 2023, researchers at NVIDIA and Caltech built Voyager—an AI agent that plays Minecraft. Not just plays, but _gets better at playing_. Unlike previous agents that forgot everything between sessions, Voyager remembers. It builds a library of skills. It generates its own curriculum. It learns from its mistakes.

The results were dramatic: 3.3x more unique items discovered, 15.3x faster progression through the tech tree. Not through more compute or bigger models, but through three simple mechanisms:

1. **Automatic Curriculum** — Instead of random tasks, the agent generates progressively harder challenges based on its current state. What's the most useful thing I could learn right now?

2. **Growing Skill Library** — Every successful behavior gets saved as a reusable skill. Complex abilities emerge from composing simple ones. The agent's capabilities compound over time.

3. **Iterative Refinement** — Multiple feedback sources (environment state, execution errors, self-verification) drive continuous improvement. Skills don't just accumulate—they get better.

The key insight: **an agent that remembers is fundamentally different from one that doesn't.**

## The Translation

Code Voyager brings these mechanisms to Claude Code.

**Session Brain** is memory. It tracks what you're working on, decisions you've made, and where you left off. Close Claude Code, come back tomorrow, pick up exactly where you stopped. No more "let me re-explain the codebase."

**Curriculum Planner** is direction. Point it at a repo and it generates prioritized task sequences—what to work on next, what depends on what, what matters most. For onboarding, for roadmaps, for planning refactors.

**Skill Factory** is growth. It analyzes your workflows and proposes skills—then scaffolds them for you. That 50-step deployment process you always forget? Now it's a skill. That particular way you like tests written? Skill. Your institutional knowledge, externalized and ready to use.

**Skill Retrieval** is recall. As your skill library grows, semantic search helps Claude find the right skill for the task. ColBERT embeddings, not keyword matching.

**Skill Refinement** is learning. Feedback from tool execution flows into skill improvement recommendations. Skills don't just exist—they evolve based on how well they work.

## Why This Matters

The gap between what AI _could_ do and what it _actually does_ is often just context. Claude is capable of extraordinary things, but only if it knows what you know—your patterns, your preferences, your institutional memory.

The traditional approach is to write better prompts. But prompts are static. They don't learn. They don't grow. They don't get better at knowing you.

Voyager's insight is that the agent should build its own knowledge over time. Not through fine-tuning or training, but through structured memory and skill accumulation. The same insight that let an AI master Minecraft can let Claude master your codebase.

## The Vision

Imagine a Claude that:

- Remembers the architectural decisions from three months ago
- Knows that you prefer composition over inheritance
- Has internalized your team's code review standards
- Suggests the next logical improvement based on what you've already done
- Gets better at helping you the more you use it

This isn't artificial general intelligence. It's artificial _institutional_ intelligence—encoding the tacit knowledge that makes senior engineers effective.

Code Voyager is infrastructure for that future. A session brain that persists. A curriculum that guides. Skills that compound. Feedback that refines.

Every session builds on the last.

## Getting Started

```bash
uv tool install "git+https://github.com/zenbase-ai/code-voyager.git"
```

Then ask Claude: _"What were we working on?"_

And for once, it'll remember.
