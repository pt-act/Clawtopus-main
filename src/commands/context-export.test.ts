import fs from "node:fs";
import os from "node:os";
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

const sessionStoreMocks = vi.hoisted(() => ({
  store: {},
}));

vi.mock("../config/sessions.js", () => ({
  loadSessionStore: vi.fn(() => sessionStoreMocks.store),
  resolveDefaultSessionStorePath: vi.fn(() => "/tmp/openclaw/sessions.json"),
  resolveSessionFilePath: vi.fn((id: string) => `/tmp/openclaw/${id}.jsonl`),
}));

import { contextExportCommand } from "./context-export.js";

const makeRuntime = () => ({
  log: vi.fn(),
  error: vi.fn(),
  exit: vi.fn(),
});

describe("contextExportCommand", () => {
  beforeEach(() => {
    sessionStoreMocks.store = {
      "agent:main:123": {
        sessionId: "session-123",
        sessionFile: "/tmp/openclaw/session-123.jsonl",
      },
    };
    vi.clearAllMocks();
  });

  it("writes export file", async () => {
    const runtime = makeRuntime();
    const transcriptPath = "/tmp/openclaw/session-123.jsonl";
    fs.mkdirSync(path.dirname(transcriptPath), { recursive: true });
    fs.writeFileSync(
      transcriptPath,
      JSON.stringify({ role: "assistant", content: [{ type: "text", text: "Hi" }] }),
      "utf-8",
    );

    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-export-"));
    const outPath = path.join(outDir, "export.json");

    await contextExportCommand({ session: "agent:main:123", output: outPath }, runtime);

    expect(fs.existsSync(outPath)).toBe(true);
    const payload = JSON.parse(fs.readFileSync(outPath, "utf-8"));
    expect(payload.sessionId).toBe("session-123");
  });
});
