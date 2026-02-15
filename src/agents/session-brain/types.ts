export type BrainEntryType = "goal" | "decision" | "progress" | "blocked" | "note";

export interface BrainEntry {
  id: string;
  timestamp: number;
  type: BrainEntryType;
  content: string;
  sessionId?: string;
  tags: string[];
  priority?: number;
}

export interface BrainState {
  entries: BrainEntry[];
  currentGoal?: string;
  lastUpdated: number;
  sessionId?: string;
}

export interface BrainConfig {
  enabled: boolean;
  maxEntries: number;
  injectOnSessionStart: boolean;
  updateOnSessionEnd: boolean;
  updateOnCompaction: boolean;
}

export const DEFAULT_BRAIN_CONFIG: BrainConfig = {
  enabled: true,
  maxEntries: 100,
  injectOnSessionStart: true,
  updateOnSessionEnd: true,
  updateOnCompaction: true,
};
