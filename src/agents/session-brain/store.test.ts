import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  loadBrain,
  saveBrain,
  addBrainEntry,
  updateCurrentGoal,
  getBrainEntriesByType,
  getBrainEntriesBySession,
  generateBrainEntryId,
  clearBrain,
} from "../session-brain/store.js";
import type { BrainEntry, BrainState } from "../session-brain/types.js";

vi.mock("../../config/paths.js", () => ({
  resolveStateDir: () => path.join(os.tmpdir(), "test-voyager"),
}));

const TEST_DIR = path.join(os.tmpdir(), "test-voyager");

describe("session-brain store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe("loadBrain", () => {
    it("returns empty brain when no file exists", () => {
      const brain = loadBrain();
      expect(brain.entries).toEqual([]);
      expect(brain.lastUpdated).toBeDefined();
    });

    it("loads existing brain state", () => {
      const existingState: BrainState = {
        entries: [
          {
            id: "brain-1",
            timestamp: Date.now(),
            type: "goal",
            content: "Test goal",
            tags: ["test"],
          },
        ],
        currentGoal: "Test goal",
        lastUpdated: Date.now(),
      };
      saveBrain(existingState);

      const loaded = loadBrain();
      expect(loaded.entries).toHaveLength(1);
      expect(loaded.entries[0].content).toBe("Test goal");
    });
  });

  describe("saveBrain", () => {
    it("creates directory if it doesn't exist", () => {
      const state: BrainState = {
        entries: [],
        lastUpdated: Date.now(),
      };
      saveBrain(state);
      expect(fs.existsSync(TEST_DIR)).toBe(true);
    });

    it("saves brain state to file", () => {
      const state: BrainState = {
        entries: [
          {
            id: "brain-1",
            timestamp: Date.now(),
            type: "note",
            content: "Test note",
            tags: [],
          },
        ],
        lastUpdated: Date.now(),
      };
      saveBrain(state);

      const loaded = loadBrain();
      expect(loaded.entries).toHaveLength(1);
      expect(loaded.entries[0].content).toBe("Test note");
    });
  });

  describe("addBrainEntry", () => {
    it("adds new entry to brain", () => {
      const entry: BrainEntry = {
        id: generateBrainEntryId(),
        timestamp: Date.now(),
        type: "decision",
        content: "Use TypeScript",
        tags: ["tech"],
      };

      const state = addBrainEntry(entry);
      expect(state.entries).toHaveLength(1);
      expect(state.entries[0].content).toBe("Use TypeScript");
    });

    it("limits entries to maxEntries", () => {
      const maxEntries = 100;
      for (let i = 0; i < maxEntries + 10; i++) {
        addBrainEntry({
          id: generateBrainEntryId(),
          timestamp: Date.now(),
          type: "note",
          content: `Note ${i}`,
          tags: [],
        });
      }

      const state = loadBrain();
      expect(state.entries.length).toBeLessThanOrEqual(maxEntries);
    });

    it("prepends new entries", () => {
      addBrainEntry({
        id: "brain-1",
        timestamp: Date.now() - 1000,
        type: "note",
        content: "First",
        tags: [],
      });
      addBrainEntry({
        id: "brain-2",
        timestamp: Date.now(),
        type: "note",
        content: "Second",
        tags: [],
      });

      const state = loadBrain();
      expect(state.entries[0].content).toBe("Second");
    });
  });

  describe("updateCurrentGoal", () => {
    it("updates current goal", () => {
      const state = updateCurrentGoal("Complete memory integration");
      expect(state.currentGoal).toBe("Complete memory integration");
    });
  });

  describe("getBrainEntriesByType", () => {
    it("filters entries by type", () => {
      addBrainEntry({
        id: "brain-1",
        timestamp: Date.now(),
        type: "goal",
        content: "Goal 1",
        tags: [],
      });
      addBrainEntry({
        id: "brain-2",
        timestamp: Date.now(),
        type: "decision",
        content: "Decision 1",
        tags: [],
      });
      addBrainEntry({
        id: "brain-3",
        timestamp: Date.now(),
        type: "goal",
        content: "Goal 2",
        tags: [],
      });

      const goals = getBrainEntriesByType("goal");
      expect(goals).toHaveLength(2);
    });
  });

  describe("getBrainEntriesBySession", () => {
    it("filters entries by session ID", () => {
      addBrainEntry({
        id: "brain-1",
        timestamp: Date.now(),
        type: "note",
        content: "Note 1",
        sessionId: "session-a",
        tags: [],
      });
      addBrainEntry({
        id: "brain-2",
        timestamp: Date.now(),
        type: "note",
        content: "Note 2",
        sessionId: "session-b",
        tags: [],
      });

      const sessionA = getBrainEntriesBySession("session-a");
      expect(sessionA).toHaveLength(1);
      expect(sessionA[0].content).toBe("Note 1");
    });
  });

  describe("generateBrainEntryId", () => {
    it("generates unique IDs", () => {
      const id1 = generateBrainEntryId();
      const id2 = generateBrainEntryId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^brain-\d+-[a-z0-9]+$/);
    });
  });

  describe("clearBrain", () => {
    it("clears all entries", () => {
      addBrainEntry({
        id: "brain-1",
        timestamp: Date.now(),
        type: "note",
        content: "Test",
        tags: [],
      });

      clearBrain();
      const state = loadBrain();
      expect(state.entries).toEqual([]);
    });
  });
});
