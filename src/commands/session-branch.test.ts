import fs from "node:fs";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";

const branchSessionMock = vi.hoisted(() => ({
  fn: vi.fn(() => ({
    sessionId: "branch-1",
    sessionFile: "/tmp/branch-1.jsonl",
    sourceSessionId: "source",
    sourceSessionFile: "/tmp/source.jsonl",
    copiedLines: 2,
  })),
}));

vi.mock("../agents/session-branch.js", () => ({
  branchSession: branchSessionMock.fn,
}));

vi.mock("../config/sessions.js", () => ({
  loadSessionStore: vi.fn(() => ({
    "agent:main:session": {
      sessionId: "source",
      sessionFile: "/tmp/source.jsonl",
    },
  })),
  resolveDefaultSessionStorePath: vi.fn(() => "/tmp/sessions.json"),
  resolveSessionFilePath: vi.fn(() => "/tmp/source.jsonl"),
}));

vi.mock("../cli/prompt.js", () => ({
  promptSelect: vi.fn(async () => 2),
}));

import { sessionBranchCommand } from "./session-branch.js";

const runtime = {
  log: vi.fn(),
  error: vi.fn(),
  exit: vi.fn(),
} as unknown as {
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => void;
};

describe("sessionBranchCommand", () => {
  beforeEach(() => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockReturnValue("a\nB\nC\n");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("branches with prompt", async () => {
    await sessionBranchCommand({ session: "agent:main:session" }, runtime);
    expect(branchSessionMock.fn).toHaveBeenCalled();
  });

  it("uses provided line count", async () => {
    await sessionBranchCommand({ session: "agent:main:session", lines: 1 }, runtime);
    expect(branchSessionMock.fn).toHaveBeenCalledWith(expect.objectContaining({ lineCount: 1 }));
  });
});
