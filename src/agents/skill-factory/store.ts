import fs from "node:fs";
import path from "node:path";
import { resolveStateDir } from "../../config/paths.js";

const SKILL_FACTORY_DIR = "skills";
const PATTERNS_FILE = "patterns.json";

function resolveSkillFactoryDir(): string {
  return path.join(resolveStateDir(), VOYAGER_DIR, SKILL_FACTORY_DIR);
}

function resolvePatternsPath(): string {
  return path.join(resolveSkillFactoryDir(), PATTERNS_FILE);
}

const VOYAGER_DIR = "voyager";

export interface ToolUsage {
  toolName: string;
  timestamp: number;
  sessionId: string;
  success: boolean;
}

export interface WorkflowPattern {
  id: string;
  name: string;
  description: string;
  tools: string[];
  frequency: number;
  lastSeen: number;
  sessions: string[];
  suggestedSkill?: string;
}

export interface PatternStore {
  patterns: WorkflowPattern[];
  toolUsageHistory: ToolUsage[];
  lastUpdated: number;
}

export function loadPatterns(): PatternStore {
  const patternsPath = resolvePatternsPath();
  try {
    if (fs.existsSync(patternsPath)) {
      const data = fs.readFileSync(patternsPath, "utf-8");
      return JSON.parse(data) as PatternStore;
    }
  } catch (error) {
    console.error("Failed to load patterns:", error);
  }
  return { patterns: [], toolUsageHistory: [], lastUpdated: Date.now() };
}

export function savePatterns(store: PatternStore): void {
  const factoryDir = resolveSkillFactoryDir();
  const patternsPath = resolvePatternsPath();

  try {
    const stateDir = resolveStateDir();
    const voyagerDir = path.join(stateDir, VOYAGER_DIR);
    if (!fs.existsSync(voyagerDir)) {
      fs.mkdirSync(voyagerDir, { recursive: true });
    }
    if (!fs.existsSync(factoryDir)) {
      fs.mkdirSync(factoryDir, { recursive: true });
    }
    fs.writeFileSync(patternsPath, JSON.stringify(store, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save patterns:", error);
    throw error;
  }
}

export function addToolUsage(usage: ToolUsage): void {
  const store = loadPatterns();
  store.toolUsageHistory.push(usage);

  const maxHistory = 1000;
  if (store.toolUsageHistory.length > maxHistory) {
    store.toolUsageHistory = store.toolUsageHistory.slice(-maxHistory);
  }

  detectAndSavePatterns(store);
}

function detectAndSavePatterns(store: PatternStore): void {
  const toolSequences = new Map<string, number>();

  for (let i = 0; i < store.toolUsageHistory.length - 1; i++) {
    const current = store.toolUsageHistory[i];
    const next = store.toolUsageHistory[i + 1];

    if (current.sessionId === next.sessionId) {
      const sequence = `${current.toolName} -> ${next.toolName}`;
      toolSequences.set(sequence, (toolSequences.get(sequence) || 0) + 1);
    }
  }

  const threshold = 3;
  const existingIds = new Set(store.patterns.map((p) => p.id));

  for (const [sequence, frequency] of toolSequences) {
    if (frequency >= threshold) {
      const tools = sequence.split(" -> ");
      const patternId = `pattern-${sequence.replace(/[^a-zA-Z0-9]/g, "-")}`;

      const existing = store.patterns.find((p) => p.id === patternId);
      if (existing) {
        existing.frequency = frequency;
        existing.lastSeen = Date.now();
      } else if (!existingIds.has(patternId)) {
        store.patterns.push({
          id: patternId,
          name: generatePatternName(tools),
          description: `Tools used together: ${sequence}`,
          tools,
          frequency,
          lastSeen: Date.now(),
          sessions: [...new Set(store.toolUsageHistory.filter((u) => tools.includes(u.toolName)).map((u) => u.sessionId))],
        });
      }
    }
  }

  store.lastUpdated = Date.now();
  savePatterns(store);
}

function generatePatternName(tools: string[]): string {
  const toolNames = tools.map((t) => t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
  if (toolNames.length === 1) {
    return toolNames[0];
  }
  if (toolNames.length === 2) {
    return `${toolNames[0]} + ${toolNames[1]}`;
  }
  return `${toolNames[0]} chain`;
}

export function getPatterns(): WorkflowPattern[] {
  const store = loadPatterns();
  return store.patterns.toSorted((a, b) => b.frequency - a.frequency);
}

export function getPatternsByTool(toolName: string): WorkflowPattern[] {
  const store = loadPatterns();
  return store.patterns.filter((p) => p.tools.includes(toolName));
}

export function suggestSkillFromPattern(pattern: WorkflowPattern): string {
  const skillName = pattern.name.replace(/\s+/g, "-").toLowerCase();
  return skillName;
}

export function clearPatterns(): void {
  savePatterns({ patterns: [], toolUsageHistory: [], lastUpdated: Date.now() });
}
