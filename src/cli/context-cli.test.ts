import { Command } from "commander";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Disable colors for deterministic assertions
process.env.FORCE_COLOR = "0";

const loadConfig = vi.fn(() => ({
  agents: {
    defaults: {
      model: { primary: "pi:opus" },
      models: { "pi:opus": {} },
      contextTokens: 32000,
      compaction: {
        maxAutoCompactions: 5,
        warnAtCompaction: 3,
      },
    },
  },
}));

const resolveDefaultSessionStorePath = vi.fn<[], string>();
const loadSessionStore = vi.fn((storePath: string) => {
  const raw = fs.readFileSync(storePath, "utf-8");
  return JSON.parse(raw) as Record<string, unknown>;
});
const resolveFreshSessionTotalTokens = vi.fn((entry: { totalTokens?: number }) =>
  typeof entry.totalTokens === "number" ? entry.totalTokens : null,
);
const resolveSessionFilePath = vi.fn<[], string>();

vi.mock("../config/config.js", () => ({
  loadConfig,
}));

vi.mock("../config/sessions.js", () => ({
  loadSessionStore,
  resolveDefaultSessionStorePath,
  resolveFreshSessionTotalTokens,
  resolveSessionFilePath,
}));

vi.mock("../agents/model-selection.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../agents/model-selection.js")>();
  return {
    ...actual,
    resolveConfiguredModelRef: (args: Parameters<typeof actual.resolveConfiguredModelRef>[0]) =>
      actual.resolveConfiguredModelRef(args),
  };
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-12-06T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function writeTempSessions(data: unknown): string {
  const file = path.join(
    os.tmpdir(),
    `context-status-sessions-${Date.now()}-${Math.random().toString(16).slice(2)}.json`,
  );
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}

function writeTranscript(lines: unknown[]): string {
  const file = path.join(
    os.tmpdir(),
    `context-status-transcript-${Date.now()}-${Math.random().toString(16).slice(2)}.jsonl`,
  );
  fs.writeFileSync(file, lines.map((l) => JSON.stringify(l)).join("\n"));
  return file;
}

describe("context cli - status", () => {
  it("prints human-readable context status with degradation and recommendations", async () => {
    const storePath = writeTempSessions({
      "agent:main:demo": {
        sessionId: "session-1",
        model: "pi:opus",
        contextTokens: 30000,
        totalTokens: 15000,
        compactionCount: 3,
      },
    });

    const transcriptPath = writeTranscript([
      { type: "session", id: "session-1", timestamp: "2025-12-05T20:00:00Z" },
      {
        id: "c1",
        type: "compaction",
        timestamp: "2025-12-05T22:00:00Z",
        summary: "Compacted older history",
        messagesCompacted: 42,
        tokensBeforeCompaction: 180000,
        tokensAfterCompaction: 60000,
        trigger: "auto",
        layer: "summarize",
        boundaryMessageId: "m-42",
      },
    ]);

    resolveDefaultSessionStorePath.mockReturnValueOnce(storePath);
    resolveSessionFilePath.mockReturnValueOnce(transcriptPath);

    const { defaultRuntime } = await import("../runtime.js");
    const log = vi.spyOn(defaultRuntime, "log").mockImplementation(() => {});
    const program = new Command();
    program.name("test");
    const { registerContextCli } = await import("./context-cli.js");
    registerContextCli(program);

    await program.parseAsync(["context", "status", "--session", "agent:main:demo"], {
      from: "user",
    });

    const output = log.mock.calls.map((call) => String(call[0]));
    const joined = output.join("\n");

    expect(joined).toContain("Context Status");
    expect(joined).toContain("agent:main:demo");
    expect(joined).toContain("15,000 / 30,000 (50.0%)");
    expect(joined).toContain("Compactions");
    expect(joined).toContain("3");
    expect(joined).toContain("Auto-compaction");
    expect(joined).toContain("Enabled");
    expect(joined.toLowerCase()).toContain("degradation");
    expect(joined.toLowerCase()).toContain("high");
    expect(joined).toContain("Recommendations");
    expect(joined).toContain("Session compacted 3 times.");
  });

  it("emits JSON with compaction and degradation details", async () => {
    const storePath = writeTempSessions({
      "agent:main:json": {
        sessionId: "session-2",
        model: "pi:opus",
        contextTokens: 32000,
        totalTokens: 8000,
        compactionCount: 4,
      },
    });

    const transcriptPath = writeTranscript([
      { type: "session", id: "session-2", timestamp: "2025-12-05T20:00:00Z" },
      {
        id: "c-json",
        type: "compaction",
        timestamp: "2025-12-05T23:00:00Z",
        summary: "Compacted a lot",
        messagesCompacted: 100,
        tokensBeforeCompaction: 200000,
        tokensAfterCompaction: 50000,
        trigger: "auto",
        layer: "summarize",
        boundaryMessageId: "m-json",
      },
    ]);

    resolveDefaultSessionStorePath.mockReturnValueOnce(storePath);
    resolveSessionFilePath.mockReturnValueOnce(transcriptPath);

    const { defaultRuntime } = await import("../runtime.js");
    const log = vi.spyOn(defaultRuntime, "log").mockImplementation(() => {});
    const program = new Command();
    program.name("test");
    const { registerContextCli } = await import("./context-cli.js");
    registerContextCli(program);

    await program.parseAsync(["context", "status", "--session", "agent:main:json", "--json"], {
      from: "user",
    });

    const payload = JSON.parse(String(log.mock.calls[0]?.[0] ?? "{}")) as {
      sessionKey: string;
      compaction: {
        effectiveCount: number;
        riskLevel: string;
        informationLossEstimate: number;
        recommendation: string;
        autoCompaction: {
          enabled: boolean;
          maxAutoCompactions: number | null;
          warnAtCompaction: number | null;
        };
      };
    };

    expect(payload.sessionKey).toBe("agent:main:json");
    expect(payload.compaction.effectiveCount).toBe(4);
    expect(payload.compaction.riskLevel).toBe("high");
    expect(payload.compaction.informationLossEstimate).toBe(40);
    expect(payload.compaction.recommendation).toContain("Session compacted 4 times.");
    expect(payload.compaction.autoCompaction.enabled).toBe(true);
    expect(payload.compaction.autoCompaction.maxAutoCompactions).toBe(5);
    expect(payload.compaction.autoCompaction.warnAtCompaction).toBe(3);
  });

  it("prints context history in newest-first order", async () => {
    const storePath = writeTempSessions({
      "agent:main:history": {
        sessionId: "session-3",
        model: "pi:opus",
        contextTokens: 32000,
        totalTokens: 8000,
        compactionCount: 2,
      },
    });

    const transcriptPath = writeTranscript([
      { type: "session", id: "session-3", timestamp: "2025-12-05T20:00:00Z" },
      {
        id: "c-old",
        type: "compaction",
        timestamp: "2025-12-05T21:00:00Z",
        summary: "Older summary",
        messagesCompacted: 50,
        tokensBeforeCompaction: 150000,
        tokensAfterCompaction: 50000,
        trigger: "manual",
        layer: "summarize",
        boundaryMessageId: "m-old",
      },
      {
        id: "c-new",
        type: "compaction",
        timestamp: "2025-12-05T23:00:00Z",
        summary: "Newer summary",
        messagesCompacted: 75,
        tokensBeforeCompaction: 180000,
        tokensAfterCompaction: 60000,
        trigger: "auto",
        layer: "summarize",
        boundaryMessageId: "m-new",
        customInstruction: "Preserve API decisions",
      },
    ]);

    resolveDefaultSessionStorePath.mockReturnValueOnce(storePath);
    resolveSessionFilePath.mockReturnValueOnce(transcriptPath);

    const { defaultRuntime } = await import("../runtime.js");
    const log = vi.spyOn(defaultRuntime, "log").mockImplementation(() => {});
    const program = new Command();
    program.name("test");
    const { registerContextCli } = await import("./context-cli.js");
    registerContextCli(program);

    await program.parseAsync(["context", "history", "--session", "agent:main:history"], {
      from: "user",
    });

    const output = log.mock.calls.map((call) => String(call[0]));
    const joined = output.join("\n");

    const newIndex = joined.indexOf("AUTO - Layer: summarize");
    const oldIndex = joined.indexOf("MANUAL - Layer: summarize");
    expect(joined).toContain("Context History");
    expect(joined).toContain("AUTO - Layer: summarize");
    expect(joined).toContain("MANUAL - Layer: summarize");
    expect(joined).toContain("Compacted: 75 messages");
    expect(joined).toContain("Compacted: 50 messages");
    expect(joined).toContain("Focus: Preserve API decisions");
    expect(joined).toContain("Total Compactions:");
    expect(joined).toContain("Risk Level:");
    expect(newIndex).toBeGreaterThanOrEqual(0);
    expect(oldIndex).toBeGreaterThanOrEqual(0);
    expect(newIndex).toBeLessThan(oldIndex);
  });

  it("emits JSON history with compaction metadata", async () => {
    const storePath = writeTempSessions({
      "agent:main:history-json": {
        sessionId: "session-4",
        model: "pi:opus",
        contextTokens: 32000,
        totalTokens: 9000,
        compactionCount: 1,
      },
    });

    const transcriptPath = writeTranscript([
      { type: "session", id: "session-4", timestamp: "2025-12-05T20:00:00Z" },
      {
        id: "c-json",
        type: "compaction",
        timestamp: "2025-12-05T21:30:00Z",
        summary: "Compacted once",
        messagesCompacted: 20,
        tokensBeforeCompaction: 120000,
        tokensAfterCompaction: 40000,
        trigger: "auto",
        layer: "summarize",
        boundaryMessageId: "m-json",
      },
    ]);

    resolveDefaultSessionStorePath.mockReturnValueOnce(storePath);
    resolveSessionFilePath.mockReturnValueOnce(transcriptPath);

    const { defaultRuntime } = await import("../runtime.js");
    const log = vi.spyOn(defaultRuntime, "log").mockImplementation(() => {});
    const program = new Command();
    program.name("test");
    const { registerContextCli } = await import("./context-cli.js");
    registerContextCli(program);

    await program.parseAsync(
      ["context", "history", "--session", "agent:main:history-json", "--json"],
      { from: "user" },
    );

    const payload = JSON.parse(String(log.mock.calls[0]?.[0] ?? "{}")) as {
      sessionKey: string;
      compactionCount: number;
      events: Array<{ trigger: string | null; layer: string | null }>;
    };

    expect(payload.sessionKey).toBe("agent:main:history-json");
    expect(payload.compactionCount).toBe(1);
    expect(payload.events[0]?.trigger).toBe("auto");
    expect(payload.events[0]?.layer).toBe("summarize");
  });
});
