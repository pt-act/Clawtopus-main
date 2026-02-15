import fs from "node:fs";
import path from "node:path";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";

const importContextMock = vi.hoisted(() => ({
  fn: vi.fn(() => ({
    sessionId: "import-123",
    sessionFile: "/tmp/import-123.jsonl",
  })),
}));

vi.mock("../agents/context-import.js", () => ({
  importContext: importContextMock.fn,
}));

import { contextImportCommand } from "./context-import.js";

const runtime = {
  log: vi.fn(),
  error: vi.fn(),
  exit: vi.fn(),
} as unknown as {
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => void;
};

describe("contextImportCommand", () => {
  beforeEach(() => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockReturnValue(
      JSON.stringify({ summary: "Hello", keyFiles: { read: [], modified: [] } }),
    );
    vi.spyOn(fs, "writeFileSync").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("imports payload and prints output", async () => {
    await contextImportCommand({ input: "input.json" }, runtime);
    expect(importContextMock.fn).toHaveBeenCalled();
    expect(runtime.log).toHaveBeenCalled();
  });

  it("writes output when requested", async () => {
    await contextImportCommand({ input: "input.json", output: "out.json" }, runtime);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.resolve("out.json"),
      expect.any(String),
      "utf-8",
    );
  });

  it("passes session override", async () => {
    await contextImportCommand({ input: "input.json", session: "override" }, runtime);
    expect(importContextMock.fn).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: "override" }),
    );
  });
});
