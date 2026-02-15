import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { exportContext } from "./context-export.js";

const writeTranscript = (lines: Array<Record<string, unknown>>): string => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-export-"));
  const file = path.join(dir, "session.jsonl");
  const payload = lines.map((line) => JSON.stringify(line)).join("\n");
  fs.writeFileSync(file, payload, "utf-8");
  return file;
};

describe("exportContext", () => {
  it("builds structured export schema", () => {
    const file = writeTranscript([
      { type: "session", timestamp: 1000 },
      {
        role: "assistant",
        content: [{ type: "text", text: "Updated src/index.ts and src/utils.ts" }],
        timestamp: 2000,
      },
      {
        role: "assistant",
        content: [{ type: "text", text: "Next: add tests for src/utils.ts" }],
        timestamp: 3000,
      },
    ]);

    const exported = exportContext({
      sessionId: "session-123",
      sessionKey: "agent:main:123",
      sessionFile: file,
      format: "structured",
    });

    expect(exported.version).toBe("1.0");
    expect("summary" in exported).toBe(true);
    expect(exported.summary).toContain("Next:");
    expect(exported.keyFiles.read).toContain("src/index.ts");
    expect(exported.keyFiles.modified).toContain("src/index.ts");
    expect(exported.nextSteps.length).toBeGreaterThan(0);
    expect(exported.metadata.totalMessages).toBe(2);
  });

  it("extracts questions", () => {
    const file = writeTranscript([
      { type: "session", timestamp: 1000 },
      {
        role: "assistant",
        content: [{ type: "text", text: "Question: How should we handle edge case X?" }],
        timestamp: 2000,
      },
    ]);

    const exported = exportContext({
      sessionId: "session-456",
      sessionFile: file,
      format: "structured",
    });

    expect(exported.openQuestions).toContain("How should we handle edge case X?");
  });

  it("supports raw export format", () => {
    const file = writeTranscript([{ type: "session", timestamp: 1000 }]);
    const exported = exportContext({
      sessionId: "session-raw",
      sessionFile: file,
      format: "raw",
    });

    expect("rawLines" in exported).toBe(true);
    expect(exported.rawLines).toHaveLength(1);
  });
});
