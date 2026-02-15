import fs from "node:fs";
import path from "node:path";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { branchSession } from "./session-branch.js";

vi.mock("../config/sessions/store.js", () => ({
  loadSessionStore: vi.fn(() => ({})),
}));

vi.mock("../config/sessions/paths.js", () => ({
  resolveDefaultSessionStorePath: vi.fn(() => "/tmp/sessions.json"),
  resolveSessionTranscriptPathInDir: vi.fn((id: string, dir: string) =>
    path.join(dir, `${id}.jsonl`),
  ),
}));

describe("branchSession", () => {
  beforeEach(() => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockReturnValue("a\nB\nC\n");
    vi.spyOn(fs, "mkdirSync").mockImplementation(() => undefined);
    vi.spyOn(fs, "writeFileSync").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("copies last N lines without reserialization", () => {
    const result = branchSession({
      sessionId: "branch-1",
      sourceSessionFile: "/tmp/source.jsonl",
      lineCount: 2,
      outputDir: "/tmp",
      now: () => 123,
    });
    expect(result.copiedLines).toBe(2);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join("/tmp", "branch-1.jsonl"),
      expect.stringContaining("B\nC"),
      "utf-8",
    );
  });

  it("throws on missing source", () => {
    (fs.existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce(false);
    expect(() =>
      branchSession({
        sessionId: "branch-2",
        sourceSessionFile: "/tmp/missing.jsonl",
        lineCount: 1,
        outputDir: "/tmp",
      }),
    ).toThrow("Source transcript not found");
  });
});
