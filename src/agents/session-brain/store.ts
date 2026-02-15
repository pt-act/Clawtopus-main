import fs from "node:fs";
import path from "node:path";
import { resolveStateDir } from "../../config/paths.js";
import type { BrainEntry, BrainState } from "./types.js";

const VOYAGER_DIR = "voyager";
const BRAIN_FILE = "brain.json";

function resolveBrainDir(): string {
  return path.join(resolveStateDir(), VOYAGER_DIR);
}

function resolveBrainPath(): string {
  return path.join(resolveBrainDir(), BRAIN_FILE);
}

export function loadBrain(): BrainState {
  const brainPath = resolveBrainPath();
  try {
    if (fs.existsSync(brainPath)) {
      const data = fs.readFileSync(brainPath, "utf-8");
      return JSON.parse(data) as BrainState;
    }
  } catch (error) {
    console.error("Failed to load brain:", error);
  }
  return {
    entries: [],
    lastUpdated: Date.now(),
  };
}

export function saveBrain(state: BrainState): void {
  const brainDir = resolveBrainDir();
  const brainPath = resolveBrainPath();

  try {
    const parentDir = path.dirname(brainDir);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    if (!fs.existsSync(brainDir)) {
      fs.mkdirSync(brainDir, { recursive: true });
    }
    fs.writeFileSync(brainPath, JSON.stringify(state, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save brain:", error);
    throw error;
  }
}

export function addBrainEntry(entry: BrainEntry): BrainState {
  const state = loadBrain();
  state.entries.unshift(entry);
  state.lastUpdated = Date.now();

  const maxEntries = 100;
  if (state.entries.length > maxEntries) {
    state.entries = state.entries.slice(0, maxEntries);
  }

  saveBrain(state);
  return state;
}

export function updateCurrentGoal(goal: string): BrainState {
  const state = loadBrain();
  state.currentGoal = goal;
  state.lastUpdated = Date.now();
  saveBrain(state);
  return state;
}

export function getBrainEntriesByType(type: BrainEntry["type"]): BrainEntry[] {
  const state = loadBrain();
  return state.entries.filter((entry) => entry.type === type);
}

export function getBrainEntriesBySession(sessionId: string): BrainEntry[] {
  const state = loadBrain();
  return state.entries.filter((entry) => entry.sessionId === sessionId);
}

export function generateBrainEntryId(): string {
  return `brain-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function clearBrain(): void {
  const state: BrainState = {
    entries: [],
    lastUpdated: Date.now(),
  };
  saveBrain(state);
}
