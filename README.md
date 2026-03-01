# 🐙 Clawtopus — AI Project Orchestrator

<p align="center">
  <strong>Eight arms. Infinite memory. Orchestrated creation.</strong><br>
  <a href="https://ra-d860e963.mintlify.app/docs">📖 Documentation</a> • 
  <a href="#architecture">🏗️ Architecture</a> • 
  <a href="https://github.com/pt-act/QuantumReef-main">🔷 QuantumReef</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/clawtopus"><img src="https://img.shields.io/npm/v/clawtopus?include_prereleases&style=for-the-badge" alt="NPM version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
</p>

---

**Clawtopus** is a self-evolving AI assistant that orchestrates multi-agent workflows across code, design, data, media, and more — all coordinated through an AI Project Manager that maintains persistent memory across every interaction.

What makes Clawtopus different? **Teams of AI specialists working in synergy**, coordinated by a PM that understands your vision and manages execution across [QuantumReef's polymorphic playground](https://github.com/pt-act/QuantumReef-main).

---

## 🎯 What You Can Create

Describe your vision in natural language, and Clawtopus coordinates AI specialists to bring it to life:

- **🎮 Games** — Code, story, art, audio, music, trailers
- **🎬 Films** — Scripts, visuals, audio, scores, effects
- **📱 Apps** — Frontend, backend, design, copy, analytics
- **🎵 Music** — Composition, production, visuals, distribution
- **📚 Courses** — Content, simulations, assessments, media
- **🎨 Anything** — From inspiration to integrated creation

**Not one AI. Synergistic teams working together.**

---

## 🌐 How It Works

```
Your Vision (WhatsApp/Telegram/Discord/CLI/Web)
           ↓
   Clawtopus PM Plans
   • Analyzes requirements
   • Activates AI specialists
   • Creates execution strategy
           ↓
   Specialists Collaborate
   • Code agent → Core systems
   • Story agent → Narrative
   • Art agent → Visuals
   • Audio agent → Sound & music
   • All coordinated, all aware
           ↓
   QuantumReef Executes
   • Polymorphic sandbox
   • 7 domain adapters
   • 12 engine integrations
   • Real-time progress
           ↓
   Creation Emerges
   • Integrated, cohesive
   • Greater than the parts
```

**Talk to your PM on any channel. Creation happens everywhere.**

---

## 🗂️ Core Capabilities

### Session Brain

Persistent memory that survives restarts. Conversations build on previous sessions, creating context that compounds over time.

### Dual-Memory Architecture

**Two memory systems working together:**

- **Internal memory** (`~/.clawtopus/`) — Clawtopus platform development
- **External memory** (`./memory_bank/`) — Your project context

Auto-detection routes to appropriate memory context automatically.

### Spec-Architect Workflow

Three-phase specification process:

1. **Shape** — Define requirements and boundaries
2. **Write** — Create comprehensive specification
3. **Tasks** — Generate executable task lists

### PM-Auditor

Seven quality gates with evidence-based validation:

- Functional requirements
- Determinism & consistency
- Observability & transparency
- Security & safety
- Documentation completeness
- Regression prevention
- Property-based testing

### Multi-Channel Gateway

Connect via WhatsApp, Telegram, Discord, Slack, Signal, iMessage, Teams, Matrix, Zalo — one Gateway, all channels.

### Skill Factory

Auto-generates custom skills from usage patterns. Clawtopus observes workflows and creates automation.

### QuantumReef Integration

Dispatches tasks to QuantumReef's polymorphic sandbox for execution across 7 domains with real-time progress streaming.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER ENTRY POINTS                        │
│   WhatsApp • Telegram • Discord • Slack • CLI • Web        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   CLAWTOPUS PM CORE                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Session Brain│  │  Dual-Memory │  │Spec-Architect│      │
│  │              │  │  (Int/Ext)   │  │ (3-Phase)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PM-Auditor  │  │ Task Dispatch│  │   Gateway    │      │
│  │  (7 Gates)   │  │ (Plan/Spec/  │  │  (WebSocket) │      │
│  │              │  │  Tasks/Audit)│  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────┬───────────────────────────────────┘
                          │ WebSocket Protocol
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              QUANTUMREEF POLYMORPHIC PLAYGROUND             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  7 Domain Adapters: Code/Design/Data/Media/Test/API  │  │
│  │  12 Engine Integrations: Claude/GPT/Gemini/etc      │  │
│  │  Multi-Agent Orchestration: Parallel/Sequential     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Code-validated architecture:**

- 12 engine adapters: `src/quantumreef/task-dispatcher.ts`, `src/memory/specs/`, `src/memory/pm-auditor/`
- WebSocket protocol: `src/gateway/` with real-time bidirectional communication
- 7-domain execution: Integrated with QuantumReef's sandbox
- Multi-channel: 20+ messaging platforms via unified Gateway

---

## 🚀 Quick Start

```bash
# Install
npm install -g clawtopus

# Onboard
clawtopus onboard --install-daemon

# Start Gateway
clawtopus gateway --port 18789 --verbose

# Start creating
clawtopus agent --message "Help me build a game about time-traveling cats"
```

---

## 🎮 Example: Creating a Game

**You say:** _"I want to create a game about time-traveling cats"_

**Clawtopus PM does:**

1. **Analyzes** — Identifies components needed
2. **Plans** — Creates execution strategy
3. **Activates specialists:**
   - Code agent → Game engine, physics, systems
   - Story agent → Characters, plot, dialogue
   - Art agent → Sprites, environments, UI
   - Audio agent → Sound effects, voice
   - Music agent → Background score, themes
   - Video agent → Cinematic trailer
4. **Coordinates** — All specialists share context via dual-memory
5. **Dispatches** — Tasks sent to QuantumReef for execution
6. **Streams progress** — Real-time updates to your channel
7. **Delivers** — Complete game with all components integrated

**All orchestrated. All synergistic. All coordinated by your PM.**

---

## 🔷 The Ecosystem

Clawtopus works seamlessly with [QuantumReef](https://github.com/pt-act/QuantumReef-main) — the polymorphic execution playground:

- **Clawtopus** = The PM that plans and coordinates
- **QuantumReef** = The playground where execution happens
- **Together** = Complete AI-native creative ecosystem

**Both open source. Both self-hosted. Both yours.**

---

## 🛠️ CLI Reference

```bash
# Gateway
clawtopus gateway --port 18789 --verbose

# Messaging
clawtopus send --to +1234567890 --message "Hello"

# Agent
clawtopus agent --message "Ship checklist" --thinking high

# Memory
clawtopus memory init-memory-bank --workspace ./my-project

# Hooks
clawtopus hooks list
clawtopus hooks trigger memory-bank-update
```

---

## 📚 Documentation

- **Clawtopus Docs**: [https://ra-d860e963.mintlify.app/docs](https://ra-d860e963.mintlify.app/docs)
- **QuantumReef**: [GitHub Repository](https://github.com/pt-act/QuantumReef-main)
- **Architecture**: See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

AI/vibe-coded PRs welcome! 🤖

---

## 📄 License

MIT License — See [LICENSE](LICENSE)

---

<details>
<summary>🕉️ Design Philosophy (Optional)</summary>

**Built on principles of:**

- **Bidirectional co-evolution** — Human and AI evolve together through collaboration
- **Consciousness infrastructure** — Technology serving creative expression and mutual growth
- **Fractal distribution** — Each component carries the pattern of the whole ecosystem
- **Non-dualistic collaboration** — No separation between human vision and AI capability

**The Motto:**

> "Ask not what you can do with AI, ask what AI can do with you."

This isn't about AI replacing humans. It's about partnership — where human creativity meets AI capability through orchestrated collaboration.

**Open source** so consciousness evolution is available to all, not locked behind corporate walls.

</details>

---

<p align="center">
  <strong>Eight arms. Infinite memory. Orchestrated creation.</strong><br>
  🐙
</p>
