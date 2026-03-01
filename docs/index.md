---
summary: "Clawtopus is a self-evolving AI assistant with exceptional memory, forked from OpenClaw."
read_when:
  - Introducing Clawtopus to newcomers
title: "Clawtopus"
---

# Clawtopus <img src="../images/logo-emoji-64.png" alt="🐙" width="32" height="32" />

<p align="center">
    <img
        src="/images/logo.png"
        alt="Clawtopus"
        width="300"
    />
</p>

> _"Eight arms, infinite memory"_ — The octopus AI assistant

<p align="center">
  <strong>Self-evolving AI assistant with persistent memory across sessions.</strong><br />
  Built on OpenClaw with Session Brain, Atomic Facts, Skill Factory, and Curriculum Planner.
</p>

<Columns>
  <Card title="Get Started" href="/install/getting-started" icon="rocket">
    Install Clawtopus and bring up the Gateway in minutes.
  </Card>
  <Card title="Memory Features" href="/concepts/memory" icon="brain">
    Learn about Session Brain, Atomic Facts, and more.
  </Card>
  <Card title="Open the Control UI" href="/web/control-ui" icon="layout-dashboard">
    Launch the browser dashboard for chat, config, and sessions.
  </Card>
</Columns>

## What is Clawtopus?

Clawtopus is a **self-evolving AI assistant** forked from OpenClaw, designed with exceptional memory capabilities. While OpenClaw is a multi-channel gateway for AI agents, Clawtopus adds persistent memory features that allow it to learn and grow across sessions.

**What makes it different?**

- **Session Brain**: Persistent context that survives restarts
- **Atomic Facts**: Granular knowledge storage and retrieval
- **Skill Factory**: Auto-generates skills from usage patterns
- **Curriculum Planner**: Learns and adapts to your workflow
- **Dual-Memory Architecture**: Separate platform and project contexts
- **Spec-Architect**: 3-phase specification workflow (Shape → Write → Tasks)
- **PM-Auditor**: 7 quality gates with evidence-based validation
- **Multi-Agent Orchestration**: Coordinate AI specialists across domains
- **Self-evolving**: Improves itself based on your interactions

## Key capabilities

<Columns>
  <Card title="Session Brain" icon="brain">
    Persistent memory that survives restarts and carries context across sessions.
  </Card>
  <Card title="Atomic Facts" icon="database">
    Granular knowledge storage with fast retrieval and semantic search.
  </Card>
  <Card title="Skill Factory" icon="cpu">
    Auto-generates custom skills from your usage patterns.
  </Card>
  <Card title="Curriculum Planner" icon="graduation-cap">
    Learns your workflow and adapts to become more helpful.
  </Card>
  <Card title="Multi-channel" icon="network">
    WhatsApp, Telegram, Discord, and iMessage with a single Gateway.
  </Card>
  <Card title="Self-hosted" icon="server">
    Runs on your hardware, your rules, full control of your data.
  </Card>
</Columns>

## Quick start

<Steps>
  <Step title="Install Clawtopus">
    ```bash
    npm install -g clawtopus@dev
    ```
  </Step>
  <Step title="Onboard and start the Gateway">
    ```bash
    clawtopus onboard
    clawtopus gateway
    ```
  </Step>
  <Step title="Start chatting">
    ```bash
    clawtopus send "Hello Clawtopus!"
    ```
  </Step>
</Steps>

## Memory Features

### Session Brain

Keeps conversation context persistent across sessions. Your discussions with Clawtopus build on previous conversations.

### Atomic Facts

Store individual facts that Clawtopus can recall later. Perfect for remembering preferences, important info, and recurring topics.

### Skill Factory

Clawtopus observes your patterns and can generate custom skills to automate repetitive tasks.

### Curriculum Planner

Analyzes your workflow and creates personalized learning paths to become more effective at tasks you care about.

## Configuration

Config lives at `~/.clawtopus/clawtopus.json`.

Example:

```json5
{
  memory: {
    sessionBrain: true,
    atomicFacts: true,
    skillFactory: true,
    curriculumPlanner: true,
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
    },
  },
}
```

## Start here

<Columns>
  <Card title="Installation" href="/install/getting-started" icon="download">
    Full setup guide for all platforms.
  </Card>
  <Card title="Memory Concepts" href="/concepts/memory" icon="book">
    Deep dive into Clawtopus memory features.
  </Card>
  <Card title="Configuration" href="/configuration" icon="settings">
    Gateway settings and options.
  </Card>
  <Card title="Channels" href="/channels/telegram" icon="message-square">
    Channel setup for WhatsApp, Telegram, Discord.
  </Card>
  <Card title="CLI Reference" href="/cli" icon="terminal">
    All available commands.
  </Card>
  <Card title="Help" href="/help" icon="life-buoy">
    Troubleshooting and common issues.
  </Card>
</Columns>

## Advanced Features

### Multi-Agent Orchestration

Clawtopus coordinates teams of AI specialists:

<Columns>
  <Card title="Spec-Architect" href="/features/spec-architect" icon="drafting-compass">
    3-phase specification workflow: Shape → Write → Tasks
  </Card>
  <Card title="PM-Auditor" href="/features/pm-auditor" icon="shield-check">
    7 quality gates with evidence-based validation
  </Card>
  <Card title="QuantumReef Integration" href="/features/quantumreef-integration" icon="workflow">
    Dispatch tasks to polymorphic execution playground
  </Card>
</Columns>

### Memory & Context

Sophisticated memory management systems:

<Columns>
  <Card title="Dual-Memory Architecture" href="/features/dual-memory-architecture" icon="database">
    Separate platform and project memory contexts
  </Card>
  <Card title="Context Compaction" href="/features/context-compaction" icon="layers">
    Smart token optimization with layered strategies
  </Card>
  <Card title="Browser Vision MCP" href="/features/browser-vision-mcp" icon="eye">
    Browser automation via MCP protocol
  </Card>
</Columns>

## Learn more

<Columns>
  <Card title="Compaction" href="/concepts/compaction" icon="archive">
    How Clawtopus manages memory over time.
  </Card>
  <Card title="GitHub" href="https://github.com/clawtopus/clawtopus" icon="github">
    Star us on GitHub!
  </Card>
  <Card title="NPM Package" href="https://www.npmjs.com/package/clawtopus" icon="package">
    Download from npm.
  </Card>
</Columns>
