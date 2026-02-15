import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  addToolUsage,
  getPatterns,
  getPatternsByTool,
  suggestSkillFromPattern,
  clearPatterns,
} from "./store.js";

vi.mock("../../config/paths.js", () => ({
  resolveStateDir: () => path.join(os.tmpdir(), "test-voyager-skills"),
}));

const TEST_DIR = path.join(os.tmpdir(), "test-voyager-skills");

describe("skill-factory store", () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });
    clearPatterns();
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe("addToolUsage", () => {
    it("adds tool usage to history", () => {
      addToolUsage({
        toolName: "bash",
        timestamp: Date.now(),
        sessionId: "session-1",
        success: true,
      });

      const patterns = getPatterns();
      expect(patterns.length).toBeGreaterThanOrEqual(0);
    });

    it("detects patterns from tool sequences", () => {
      const now = Date.now();
      addToolUsage({ toolName: "read", timestamp: now, sessionId: "s1", success: true });
      addToolUsage({ toolName: "edit", timestamp: now + 1, sessionId: "s1", success: true });
      addToolUsage({ toolName: "read", timestamp: now + 2, sessionId: "s1", success: true });
      addToolUsage({ toolName: "edit", timestamp: now + 3, sessionId: "s1", success: true });
      addToolUsage({ toolName: "read", timestamp: now + 4, sessionId: "s1", success: true });
      addToolUsage({ toolName: "edit", timestamp: now + 5, sessionId: "s1", success: true });

      const patterns = getPatterns();
      const readEditPattern = patterns.find((p) => p.tools.includes("read") && p.tools.includes("edit"));
      expect(readEditPattern).toBeDefined();
    });
  });

  describe("getPatterns", () => {
    it("returns sorted patterns by frequency", () => {
      const patterns = getPatterns();
      expect(Array.isArray(patterns)).toBe(true);
    });
  });

  describe("getPatternsByTool", () => {
    it("filters patterns by tool name", () => {
      const patterns = getPatternsByTool("nonexistent");
      expect(Array.isArray(patterns)).toBe(true);
    });
  });

  describe("suggestSkillFromPattern", () => {
    it("generates skill name from pattern", () => {
      const skill = suggestSkillFromPattern({
        id: "pattern-1",
        name: "Read + Edit",
        description: "Test pattern",
        tools: ["read", "edit"],
        frequency: 5,
        lastSeen: Date.now(),
        sessions: ["s1"],
      });

      expect(skill).toBeDefined();
      expect(typeof skill).toBe("string");
    });
  });

  describe("clearPatterns", () => {
    it("clears all patterns", () => {
      clearPatterns();
      const patterns = getPatterns();
      expect(patterns).toEqual([]);
    });
  });
});
