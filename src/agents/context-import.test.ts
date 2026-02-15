import fs from "node:fs";
import path from "node:path";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { importContext } from "./context-import.js";

vi.mock("../config/sessions.js", () => ({
  loadSessionStore: vi.fn(() => ({})),
  resolveDefaultSessionStorePath: vi.fn(() => "/tmp/sessions.json"),
  resolveSessionTranscriptPathInDir: vi.fn((sessionId: string, dir: string) =>
    path.join(dir, `${sessionId}.jsonl`),
  ),
}));

const payload = {
  version: "1.0",
  exportedAt: 1700000000,
  summary: "Work summary",
  keyFiles: { read: ["README.md"], modified: ["src/index.ts"] },
  openQuestions: ["Q1?"],
  nextSteps: ["Do X"],
};

describe("importContext", () => {
  beforeEach(() => {
    vi.spyOn(fs, "mkdirSync").mockImplementation(() => undefined);
    vi.spyOn(fs, "writeFileSync").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes a new transcript with system message", () => {
    const result = importContext({ payload, sessionsDir: "/tmp/sessions", now: () => 170 });
    expect(result.sessionId).toBeDefined();
    expect(result.sessionFile).toContain("/tmp/sessions");
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it("fails with invalid payload", () => {
    expect(() =>
      importContext({
        payload: { ...payload, summary: "" },
        sessionsDir: "/tmp/sessions",
      }),
    ).toThrow("summary missing");
  });
});
