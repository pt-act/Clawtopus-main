vi.mock("../../config/paths.js", () => ({
  resolveStateDir: () => path.join(os.tmpdir(), "test-voyager-update"),
}));

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  extractMessagesFromTranscript,
  updateBrainFromSession,
  injectBrainContext,
} from "../session-brain/update.js";
import { clearBrain } from "../session-brain/store.js";

const TEST_DIR = path.join(os.tmpdir(), "test-voyager-update");

describe("session-brain update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });
    clearBrain();
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe("extractMessagesFromTranscript", () => {
    it("returns empty array for non-existent file", () => {
      const messages = extractMessagesFromTranscript("/nonexistent/file.jsonl");
      expect(messages).toEqual([]);
    });

    it("extracts messages from JSONL transcript", () => {
      const sessionPath = path.join(TEST_DIR, "session.jsonl");
      const lines = [
        JSON.stringify({ message: { role: "user", content: "Hello" }, timestamp: 1000 }),
        JSON.stringify({ message: { role: "assistant", content: "Hi there" }, timestamp: 1001 }),
        JSON.stringify({ message: { role: "user", content: "Help me build a feature" }, timestamp: 1002 }),
      ];
      fs.writeFileSync(sessionPath, lines.join("\n"));

      const messages = extractMessagesFromTranscript(sessionPath);
      expect(messages).toHaveLength(3);
      expect(messages[0].content).toBe("Hello");
      expect(messages[2].role).toBe("user");
    });

    it("handles content as array blocks", () => {
      const sessionPath = path.join(TEST_DIR, "session.jsonl");
      const lines = [
        JSON.stringify({
          message: {
            role: "assistant",
            content: [{ type: "text", text: "Part 1" }, { type: "text", text: "Part 2" }],
          },
        }),
      ];
      fs.writeFileSync(sessionPath, lines.join("\n"));

      const messages = extractMessagesFromTranscript(sessionPath);
      expect(messages[0].content).toBe("Part 1 Part 2");
    });
  });

  describe("updateBrainFromSession", () => {
    it("updates brain with extracted information", () => {
      const sessionPath = path.join(TEST_DIR, "session.jsonl");
      const lines = [
        JSON.stringify({ message: { role: "user", content: "Help me build a feature" }, timestamp: 1000 }),
        JSON.stringify({ message: { role: "assistant", content: "We've decided to use PostgreSQL" }, timestamp: 1001 }),
      ];
      fs.writeFileSync(sessionPath, lines.join("\n"));

      const state = updateBrainFromSession("test-session", sessionPath);
      expect(state.entries.length).toBeGreaterThan(0);
      expect(state.sessionId).toBe("test-session");
    });

    it("respects max entries limit", () => {
      const sessionPath = path.join(TEST_DIR, "session.jsonl");
      const lines = Array.from({ length: 150 }, (_, i) =>
        JSON.stringify({ message: { role: "user", content: `Task ${i}` }, timestamp: 1000 + i }),
      );
      fs.writeFileSync(sessionPath, lines.join("\n"));

      const state = updateBrainFromSession("test-session", sessionPath);
      expect(state.entries.length).toBeLessThanOrEqual(100);
    });
  });

  describe("injectBrainContext", () => {
    it("returns empty string when brain is empty", () => {
      const context = injectBrainContext();
      expect(context).toBe("");
    });

    it("returns formatted context when brain has entries", () => {
      const sessionPath = path.join(TEST_DIR, "session.jsonl");
      const lines = [
        JSON.stringify({ message: { role: "user", content: "Help me build a feature" }, timestamp: 1000 }),
        JSON.stringify({ message: { role: "assistant", content: "We've decided to use PostgreSQL" }, timestamp: 1001 }),
      ];
      fs.writeFileSync(sessionPath, lines.join("\n"));

      updateBrainFromSession("test-session", sessionPath);

      const context = injectBrainContext();
      expect(context).toContain("Session Memory");
      expect(context).toContain("Key Decisions");
    });

    it("includes current goal when present", () => {
      const sessionPath = path.join(TEST_DIR, "session.jsonl");
      const lines = [
        JSON.stringify({ message: { role: "user", content: "Help me build a feature" }, timestamp: 1000 }),
        JSON.stringify({ message: { role: "user", content: "Also add error handling" }, timestamp: 1001 }),
      ];
      fs.writeFileSync(sessionPath, lines.join("\n"));

      updateBrainFromSession("test-session", sessionPath);

      const context = injectBrainContext();
      expect(context).toContain("Current Goal");
      expect(context).toContain("error handling");
    });
  });
});
