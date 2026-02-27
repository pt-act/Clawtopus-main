---
title: "QuantumReef Orchestrator"
description: "Use Clawtopus as an external orchestrator for QuantumReef — dispatch coding tasks from WhatsApp, Telegram, or Discord and watch them execute live in the QuantumReef UI."
summary: "QuantumReef Orchestrator integration — WebSocket protocol, task routing, progress streaming, and Glass Box transparency."
read_when:
  - You want to send coding tasks from a messaging app and have QuantumReef execute them
  - You're building an external orchestrator that connects to QuantumReef via WebSocket
  - You want to understand the task.dispatch protocol and engine routing table
icon: "chart-network"
---

# QuantumReef Orchestrator Integration

Clawtopus acts as a **mobile-first external orchestrator** for [QuantumReef](https://quantumreef.dev) — bridging the gap between your messaging apps and a powerful local coding environment.

Send a task from your phone via WhatsApp, Telegram, or Discord. Clawtopus dispatches it to QuantumReef over WebSocket. QuantumReef picks the best coding engine, executes it, and streams progress back to your phone — all fully visible in the QuantumReef Orchestrator UI.

<CardGroup cols={3}>
  <Card title="WebSocket Protocol" icon="plug" href="#message-protocol">
    Full task.dispatch message schema and response types.
  </Card>
  <Card title="Engine Routing" icon="route" href="#task-categories">
    How QuantumReef selects RovoDev, Claude Code, Aider, and others.
  </Card>
  <Card title="Glass Box UI" icon="eye" href="#glass-box-transparency">
    Every delegation is visible — nothing runs in the dark.
  </Card>
</CardGroup>

---

## Architecture

The integration follows a clean, observable pipeline from your phone to your codebase:

```
Phone (WhatsApp / Telegram / Discord)
        │
        │  "fix the auth bug in my Next.js app"
        ▼
┌─────────────────────────────┐
│     Clawtopus Gateway       │  clawtopus gateway --port 18789
│   (ProgressBridge layer)    │
└────────────┬────────────────┘
             │  WebSocket  ws://localhost:18789
             │  task.dispatch →
             ▼
┌─────────────────────────────┐
│       QuantumReef           │
│   OrchestratorBridge        │  receives task.dispatch
│       │                     │
│       ▼                     │
│   TaskDispatcher            │  selects engine by category
│       │                     │
│       ├── RovoDev           │
│       ├── Claude Code       │
│       ├── Aider             │
│       ├── Codex             │
│       └── Gemini CLI        │
│                             │
│   ProgressBridge ──────────►│── task.progress →
│   Orchestrator UI tab       │
└─────────────────────────────┘
             │  task.progress / task.complete
             ▼
┌─────────────────────────────┐
│     Clawtopus Gateway       │
│   (formats per channel)     │
└────────────┬────────────────┘
             │
             ▼
        Phone notification
```

### How it works, step by step

<Steps>
  <Step title="User sends a message">
    The user sends a natural-language coding task from WhatsApp, Telegram, or Discord. No special syntax required.
  </Step>
  <Step title="Clawtopus dispatches to QuantumReef">
    The Clawtopus gateway receives the message and pushes a `task.dispatch` command over WebSocket to `ws://localhost:18789`.
  </Step>
  <Step title="OrchestratorBridge receives the task">
    QuantumReef's `OrchestratorBridge` accepts the WebSocket message and passes it to `TaskDispatcher`.
  </Step>
  <Step title="TaskDispatcher selects the best engine">
    Based on `category` (or inferred from the instruction), `TaskDispatcher` picks the highest-priority available engine from the routing table.
  </Step>
  <Step title="Progress streams back in real time">
    As the engine runs, output flows through `ProgressBridge` → Clawtopus Gateway → the user's phone. Simultaneously, every step is visible in QuantumReef's Orchestrator UI tab.
  </Step>
  <Step title="Task completes">
    A `task.complete` event is sent with the final output. The user receives a formatted summary on their phone.
  </Step>
</Steps>

---

## Message Protocol

All communication happens over a single persistent WebSocket connection at `ws://localhost:18789`. Messages are JSON objects with a `type` field and a `payload` object.

### Commands (Clawtopus → QuantumReef)

#### `task.dispatch`

Dispatch a new coding task to QuantumReef. This is the primary command.

```json
{
  "type": "task.dispatch",
  "payload": {
    "taskId": "task_a1b2c3d4",
    "instruction": "Fix the JWT expiry bug in src/auth/middleware.ts",
    "engine": "claude-code",
    "category": "debug",
    "workingDirectory": "/home/user/projects/my-app",
    "sessionId": "session_xyz789",
    "channel": "whatsapp",
    "sender": "+15551234567",
    "context": "The user reported 401 errors after token refresh"
  }
}
```

| Field              | Type     | Required | Description                                                                                                  |
| ------------------ | -------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| `taskId`           | `string` | ✅       | Unique ID for this task. Used to correlate progress and completion events.                                   |
| `instruction`      | `string` | ✅       | The natural-language task description sent by the user.                                                      |
| `engine`           | `string` | ❌       | Force a specific engine (e.g. `claude-code`). If omitted, TaskDispatcher selects automatically.              |
| `category`         | `string` | ❌       | Task category hint for routing (see [Task Categories](#task-categories)). If omitted, QuantumReef infers it. |
| `workingDirectory` | `string` | ❌       | Absolute path to the project root. Defaults to QuantumReef's current workspace.                              |
| `sessionId`        | `string` | ❌       | Clawtopus session ID. Included in progress events so replies route back correctly.                           |
| `channel`          | `string` | ❌       | Source channel (`whatsapp`, `telegram`, `discord`). Used to format progress messages.                        |
| `sender`           | `string` | ❌       | Sender identifier (phone number, user ID, etc.). Used for reply routing.                                     |
| `context`          | `string` | ❌       | Additional context from conversation history to help the engine.                                             |

---

#### `task.cancel`

Cancel an in-progress task.

```json
{
  "type": "task.cancel",
  "payload": {
    "taskId": "task_a1b2c3d4"
  }
}
```

QuantumReef responds with `task.cancelled` when the engine has been stopped cleanly.

---

#### `task.status`

Query the current status of a task.

```json
{
  "type": "task.status",
  "payload": {
    "taskId": "task_a1b2c3d4"
  }
}
```

QuantumReef responds with a `task.progress` event containing the latest state snapshot.

---

### Events (QuantumReef → Clawtopus)

QuantumReef pushes events back over the same WebSocket connection as tasks progress.

#### `task.accepted`

Confirms the task was received and queued.

```json
{
  "type": "task.accepted",
  "payload": {
    "taskId": "task_a1b2c3d4",
    "engine": "claude-code",
    "category": "debug",
    "estimatedStart": "2024-01-15T10:30:00Z"
  }
}
```

<Note>
All timestamp fields use ISO 8601 format with timezone (e.g., `2024-01-15T10:30:00Z`).
</Note>

#### `task.progress`

Streams incremental output from the running engine. Emitted repeatedly throughout execution.

```json
{
  "type": "task.progress",
  "payload": {
    "taskId": "task_a1b2c3d4",
    "engine": "claude-code",
    "chunk": "Reading src/auth/middleware.ts...\nFound issue on line 47: token.exp comparison uses seconds but Date.now() returns milliseconds.",
    "step": 3,
    "totalSteps": null,
    "elapsed": 4821
  }
}
```

| Field        | Description                                    |
| ------------ | ---------------------------------------------- |
| `chunk`      | Raw text output from the engine for this step. |
| `step`       | Current step number (1-based).                 |
| `totalSteps` | Known total steps, or `null` if open-ended.    |
| `elapsed`    | Milliseconds since task started.               |

#### `task.complete`

Signals successful completion with the final output.

```json
{
  "type": "task.complete",
  "payload": {
    "taskId": "task_a1b2c3d4",
    "engine": "claude-code",
    "summary": "Fixed JWT expiry comparison bug in middleware.ts. Changed `token.exp > Date.now()` to `token.exp * 1000 > Date.now()` on line 47. Tests pass.",
    "filesModified": ["src/auth/middleware.ts"],
    "elapsed": 18340
  }
}
```

#### `task.error`

Signals that the task failed.

```json
{
  "type": "task.error",
  "payload": {
    "taskId": "task_a1b2c3d4",
    "engine": "claude-code",
    "error": "Engine exited with code 1",
    "details": "claude-code: API rate limit exceeded. Retrying with aider...",
    "retriable": true
  }
}
```

When `retriable` is `true`, QuantumReef will attempt the next engine in the priority list automatically.

#### `task.cancelled`

Confirms a `task.cancel` command was processed.

```json
{
  "type": "task.cancelled",
  "payload": {
    "taskId": "task_a1b2c3d4",
    "engine": "claude-code",
    "elapsed": 7200
  }
}
```

#### `task.notification`

Out-of-band notification (e.g. engine fallback, permission prompt, long-running warning).

```json
{
  "type": "task.notification",
  "payload": {
    "taskId": "task_a1b2c3d4",
    "level": "info",
    "message": "claude-code unavailable — falling back to aider"
  }
}
```

| `level` | Use                                                     |
| ------- | ------------------------------------------------------- |
| `info`  | Informational update (engine fallback, file read, etc.) |
| `warn`  | Non-fatal issue the user should know about              |
| `error` | Fatal error before `task.error` is emitted              |

---

## Task Categories

`TaskDispatcher` uses the `category` field to select the best engine. Each category has a **priority list** — the first available, healthy engine wins.

| Category    | Priority order                         | Typical use                                            |
| ----------- | -------------------------------------- | ------------------------------------------------------ |
| `implement` | `rovodev` › `claude-code` › `aider`    | New features, scaffolding, greenfield code             |
| `refactor`  | `rovodev` › `claude-code` › `aider`    | Restructuring existing code without changing behaviour |
| `debug`     | `rovodev` › `claude-code` › `aider`    | Bug investigation and fixes                            |
| `review`    | `rovodev` › `claude-code`              | Code review, security audit, best-practice check       |
| `explain`   | `rovodev` › `claude-code`              | Explaining what code does, architecture walkthroughs   |
| `plan`      | `rovodev` › `claude-code`              | Task decomposition, sprint planning, technical design  |
| `test`      | `codex` › `claude-code` › `rovodev`    | Generating unit, integration, and e2e tests            |
| `search`    | `gemini-cli` › `rovodev`               | Codebase search, dependency exploration, API lookup    |
| `explore`   | `gemini-cli` › `rovodev`               | Open-ended research, discovering patterns              |
| `generate`  | `codex` › `gemini-cli` › `claude-code` | Boilerplate, scaffolding, repetitive code generation   |

<Note>
If `category` is omitted from `task.dispatch`, QuantumReef infers it from the `instruction` text using a lightweight classifier. You can always override it explicitly for precise routing.
</Note>

### Engine availability

TaskDispatcher checks engine health before routing. If the top-priority engine is unavailable (not installed, API key missing, rate-limited), it falls through to the next. A `task.notification` event is emitted for each fallback so Clawtopus can inform the user.

---

## Setup Instructions

<Steps>
  <Step title="Install Clawtopus">

    ```bash
    npm install -g clawtopus
    ```

  </Step>

  <Step title="Start the Clawtopus gateway">

    Start the gateway on the default QuantumReef orchestrator port:

    ```bash
    clawtopus gateway --port 18789
    ```

    The gateway exposes `ws://localhost:18789` and bridges your messaging channels to QuantumReef.

    <Tip>
    Add `--verbose` to see every WebSocket frame logged to stdout — useful for debugging the protocol during setup.
    </Tip>

  </Step>

  <Step title="Open QuantumReef">

    Launch QuantumReef and navigate to the **Orchestrator** tab. It will auto-connect to `ws://localhost:18789` within a few seconds.

    You should see a green **"Clawtopus connected"** indicator in the top-right of the Orchestrator tab.

  </Step>

  <Step title="Configure your channel">

    Make sure at least one messaging channel is linked. For example, to link WhatsApp:

    ```bash
    clawtopus channels login --channel whatsapp
    ```

    For Telegram, create a bot via [@BotFather](https://t.me/BotFather) and set the token:

    ```bash
    clawtopus configure set channels.telegram.token "YOUR_BOT_TOKEN"
    ```

  </Step>

  <Step title="Send a coding task">

    Message your Clawtopus bot from WhatsApp, Telegram, or Discord. For example:

    ```
    fix the auth bug in my Next.js app
    ```

    Watch it appear immediately in the QuantumReef Orchestrator UI and execute in real time.

  </Step>
</Steps>

### Verify the connection

```bash
clawtopus status --integration quantumreef
```

Expected output:

```
QuantumReef Orchestrator
  WebSocket: ws://localhost:18789
  Status:    connected ✓
  Uptime:    3m 42s
  Tasks:     12 dispatched, 11 complete, 0 errors
```

---

## Glass Box Transparency

<Info>
This integration is designed around the **Orion-OS Glass Box** principle: **nothing happens in the background**. Every delegation is visible, every step is observable, and users always know what is running on their behalf.
</Info>

Traditional AI automation runs as a black box — you send a request and wait for a result, with no visibility into what happened in between. This integration deliberately rejects that model.

### What "Glass Box" means in practice

**Every task is visible in the UI.** When Clawtopus dispatches a task, it appears immediately in QuantumReef's Orchestrator tab — including the instruction, the engine selected, and every line of output as it streams in.

**Engine selection is transparent.** If TaskDispatcher falls back from `claude-code` to `aider` because Claude's API is rate-limited, you see a notification. You always know which engine ran your task.

**Progress reaches your phone in real time.** You don't have to switch to a desktop app to know what's happening. The same output visible in the Orchestrator UI is also streamed to your phone, formatted for your channel.

**No silent retries or hidden state.** Every retry, fallback, and error is emitted as an explicit event. Clawtopus surfaces these to the user rather than silently recovering.

### Why this matters

The goal is to **enhance your judgment**, not replace it. When you can see exactly what the AI is doing — which file it's reading, which function it's modifying, which test failed — you stay in control. You can cancel tasks, override engine choices, or intervene at any step.

---

## Progress Notifications

The Clawtopus `ProgressBridge` layer formats `task.progress` chunks from QuantumReef into channel-appropriate messages and delivers them to the user's phone.

### Channel formatting

Each channel has different formatting requirements:

| Channel  | Format style       | Example                                       |
| -------- | ------------------ | --------------------------------------------- |
| WhatsApp | `*bold*` markdown  | `*Claude Code*: Fixed auth middleware ✓`      |
| Telegram | `<b>HTML</b>` tags | `<b>Claude Code</b>: Fixed auth middleware ✓` |
| Discord  | `**markdown**`     | `**Claude Code**: Fixed auth middleware ✓`    |

### Throttling and chunking

Raw engine output can be verbose. ProgressBridge applies two constraints before forwarding to the user:

- **Throttled to 500ms intervals** — output is buffered and sent at most twice per second to avoid flooding the user's chat.
- **Chunked to 300 characters max** — long output is split into multiple messages, each ≤ 300 characters, to stay within messaging platform limits and remain readable on small screens.

<Tip>
For tasks expected to produce very high output (e.g., running test suites, build commands), consider using `verbosity: "quiet"` mode to only receive completion/error notifications instead of streaming progress.
</Tip>

### Notification levels

| Event                            | User notification                                      |
| -------------------------------- | ------------------------------------------------------ |
| `task.accepted`                  | ✅ "Task received — running with Claude Code"          |
| `task.progress`                  | 🔄 Streamed output (throttled, chunked)                |
| `task.complete`                  | ✅ Summary message with files changed                  |
| `task.error`                     | ❌ Error message with brief details                    |
| `task.cancelled`                 | 🚫 "Task cancelled"                                    |
| `task.notification` (info)       | ℹ️ Surfaced if relevant to user (e.g. engine fallback) |
| `task.notification` (warn/error) | ⚠️ Always surfaced                                     |

### Configuring notification verbosity

```json5
{
  integrations: {
    quantumreef: {
      progressBridge: {
        throttleMs: 500, // Min interval between progress messages
        chunkSize: 300, // Max characters per message chunk
        notifyOnFallback: true, // Notify user when engine falls back
        verbosity: "normal", // "quiet" | "normal" | "verbose"
      },
    },
  },
}
```

| Verbosity | Behaviour                                                          |
| --------- | ------------------------------------------------------------------ |
| `quiet`   | Only `task.complete` and `task.error` notifications. No streaming. |
| `normal`  | Progress chunks + completion/error. Engine fallbacks surfaced.     |
| `verbose` | All events including `task.notification` info-level.               |

---

## Example Workflow

Here's a complete end-to-end example: fixing an auth bug via WhatsApp.

### 1. User sends a message

The user opens WhatsApp and messages their Clawtopus bot:

```
fix the auth bug in my Next.js app
```

### 2. Clawtopus dispatches to QuantumReef

Clawtopus parses the message, infers `category: "debug"`, and dispatches:

```json
{
  "type": "task.dispatch",
  "payload": {
    "taskId": "task_wh_20240115_001",
    "instruction": "fix the auth bug in my Next.js app",
    "category": "debug",
    "workingDirectory": "/home/user/projects/nextjs-app",
    "sessionId": "session_wa_15551234567",
    "channel": "whatsapp",
    "sender": "+15551234567"
  }
}
```

### 3. QuantumReef acknowledges

```json
{
  "type": "task.accepted",
  "payload": {
    "taskId": "task_wh_20240115_001",
    "engine": "claude-code",
    "category": "debug"
  }
}
```

The user receives on WhatsApp:

```
✅ Task received — running with *Claude Code*
```

### 4. Progress streams in real time

Over the next ~18 seconds, the user receives a series of WhatsApp messages:

```
🔄 Reading project structure...
```

```
🔄 *Claude Code*: Found 3 files related to auth: middleware.ts, session.ts, jwt.ts
```

```
🔄 Inspecting src/auth/middleware.ts — checking token validation logic...
```

```
🔄 *Claude Code*: Found issue on line 47. token.exp is in seconds but Date.now() returns milliseconds — off by 1000x.
```

```
🔄 Applying fix...
```

Simultaneously, every line appears in the QuantumReef Orchestrator UI tab.

### 5. Task completes

```json
{
  "type": "task.complete",
  "payload": {
    "taskId": "task_wh_20240115_001",
    "engine": "claude-code",
    "summary": "Fixed JWT expiry comparison bug in middleware.ts. Changed `token.exp > Date.now()` to `token.exp * 1000 > Date.now()` on line 47. All 12 auth tests pass.",
    "filesModified": ["src/auth/middleware.ts"],
    "elapsed": 18340
  }
}
```

The user receives on WhatsApp:

```
✅ *Done!* Fixed JWT expiry bug in middleware.ts

Changed token.exp > Date.now() → token.exp * 1000 > Date.now() (line 47). All 12 auth tests pass.

_Ran with Claude Code · 18s_
```

---

## Troubleshooting

<AccordionGroup>
  <Accordion title="QuantumReef shows 'Disconnected' in Orchestrator tab">
    The Clawtopus gateway is not running or is not reachable at `ws://localhost:18789`.

    1. Confirm the gateway is running: `clawtopus status`
    2. Check the port: `clawtopus gateway --port 18789`
    3. Ensure no firewall or VPN is blocking `localhost:18789`
    4. Check gateway logs: `clawtopus logs --tail 50`

  </Accordion>

  <Accordion title="Tasks are dispatched but no engine runs">
    TaskDispatcher couldn't find a healthy engine for the given category.

    1. Open QuantumReef → Settings → Engines and check which engines are installed and configured.
    2. Verify API keys are set for cloud engines (Claude, Codex, Gemini).
    3. Try a `task.dispatch` with `"engine": "aider"` to force a local engine.
    4. Check QuantumReef logs for `[TaskDispatcher]` entries.

  </Accordion>

  <Accordion title="Progress messages stop mid-task">
    The WebSocket connection may have dropped during a long task.

    1. The Clawtopus gateway reconnects automatically with exponential backoff.
    2. Check `clawtopus status --integration quantumreef` to see reconnect attempts.
    3. QuantumReef buffers up to 60 seconds of progress events — they will replay on reconnect.
    4. For long tasks (>5 min), set `verbosity: "quiet"` to reduce WebSocket pressure.

  </Accordion>

  <Accordion title="Messages arrive out of order on WhatsApp">
    WhatsApp has a global message rate limit. If ProgressBridge sends too many chunks too quickly, delivery order can be affected.

    Reduce the chunk rate:

    ```json5
    {
      integrations: {
        quantumreef: {
          progressBridge: {
            throttleMs: 1000,  // Increase from 500ms to 1000ms
            verbosity: "quiet" // Or switch to quiet mode
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Wrong engine is selected for my task">
    Override the engine explicitly in your message using a prefix:

    ```
    [engine:aider] refactor the UserService class to use dependency injection
    ```

    Or set a default engine for a category in your config:

    ```json5
    {
      integrations: {
        quantumreef: {
          routing: {
            debug: ["aider", "claude-code"],   // Prefer aider for debug tasks
          }
        }
      }
    }
    ```

  </Accordion>
</AccordionGroup>

---

## Related

<CardGroup cols={2}>
  <Card title="WhatsApp Channel" icon="message-circle" href="/channels/whatsapp">
    Set up WhatsApp for task dispatch and progress notifications.
  </Card>
  <Card title="Telegram Channel" icon="send" href="/channels/telegram">
    Configure Telegram bot for coding task orchestration.
  </Card>
  <Card title="Gateway Configuration" icon="settings" href="/gateway/configuration-reference">
    Full reference for gateway and integration config fields.
  </Card>
  <Card title="Sessions" icon="history" href="/concepts/session">
    How Clawtopus sessions map to QuantumReef task contexts.
  </Card>
</CardGroup>
