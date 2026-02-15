import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
const configMocks = vi.hoisted(() => ({
  loadConfig: vi.fn(() => ({
    agents: {
      defaults: {
        compaction: {
          mode: "safeguard",
        },
      },
    },
  })),
}));

vi.mock("../config/config.js", () => ({
  loadConfig: configMocks.loadConfig,
}));

import { contextInspectCommand } from "./context-inspect.js";

const sessionStoreMocks = vi.hoisted(() => ({
  store: {},
}));

vi.mock("../config/sessions.js", () => ({
  loadSessionStore: vi.fn(() => sessionStoreMocks.store),
  resolveDefaultSessionStorePath: vi.fn(() => "/tmp/openclaw/sessions.json"),
  resolveSessionFilePath: vi.fn((id: string) => `/tmp/openclaw/${id}.jsonl`),
}));

function makeRuntime() {
  return {
    log: vi.fn(),
    error: vi.fn(),
    exit: vi.fn(),
  };
}

describe("contextInspectCommand", () => {
  beforeEach(() => {
    sessionStoreMocks.store = {
      "agent:main:123": {
        sessionId: "session-123",
        sessionFile: "/tmp/openclaw/session-123.jsonl",
      },
    };
    vi.clearAllMocks();
  });

  it("prints JSON with breakdown and savings", async () => {
    const runtime = makeRuntime();
    const transcriptPath = "/tmp/openclaw/session-123.jsonl";
    fs.mkdirSync(path.dirname(transcriptPath), { recursive: true });
    fs.writeFileSync(
      transcriptPath,
      [
        JSON.stringify({ type: "session" }),
        JSON.stringify({ role: "assistant", content: [{ type: "text", text: "Hi" }] }),
        JSON.stringify({ role: "toolResult", toolCallId: "tool-1" }),
      ].join("\n"),
      "utf-8",
    );

    await contextInspectCommand({ session: "agent:main:123", json: true }, runtime);
    const payload = JSON.parse(String(runtime.log.mock.calls[0]?.[0] ?? "{}"));

    expect(payload.breakdown.totalTokens).toBeGreaterThan(0);
    expect(payload.breakdown.toolTokens).toBeGreaterThan(0);
    expect(payload.savings).toHaveLength(3);
  });

  it("prints human-readable output", async () => {
    const runtime = makeRuntime();
    const transcriptPath = "/tmp/openclaw/session-123.jsonl";
    fs.mkdirSync(path.dirname(transcriptPath), { recursive: true });
    fs.writeFileSync(transcriptPath, JSON.stringify({ type: "session" }), "utf-8");

    await contextInspectCommand({ session: "agent:main:123" }, runtime);

    const output = runtime.log.mock.calls.map((call) => String(call[0])).join("\n");
    expect(output).toContain("Context Inspect");
    expect(output).toContain("Breakdown");
    expect(output).toContain("Potential savings");
  });

  it("errors when session is missing", async () => {
    sessionStoreMocks.store = {};
    const runtime = makeRuntime();

    await contextInspectCommand({ session: "agent:main:999" }, runtime);

    expect(runtime.error).toHaveBeenCalled();
    expect(runtime.exit).toHaveBeenCalledWith(1);
  });
});
