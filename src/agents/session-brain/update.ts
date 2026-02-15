import fs from "node:fs";
import {
  loadBrain,
  saveBrain,
  generateBrainEntryId,
} from "./store.js";
import type { BrainEntry, BrainEntryType, BrainState } from "./types.js";

export interface TranscriptMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: number;
}

const GOAL_PATTERNS = [
  /help me (.*)/i,
  /i need to (.*)/i,
  /can you (.*)/i,
  /please (.*)/i,
  /i want to (.*)/i,
  /working on (.*)/i,
  /implement (.*)/i,
  /create (.*)/i,
  /build (.*)/i,
  /fix (.*)/i,
  /debug (.*)/i,
  /add (.*)/i,
];

const DECISION_PATTERNS = [
  /decided to (.*)/i,
  /chose to (.*)/i,
  /going with (.*)/i,
  /best approach is (.*)/i,
  /will use (.*)/i,
  /let's use (.*)/i,
  /adopting (.*)/i,
  /choosing (.*)/i,
  /selected (.*)/i,
  /settled on (.*)/i,
];

const PROGRESS_PATTERNS = [
  /completed (.*)/i,
  /finished (.*)/i,
  /done (.*)/i,
  /implemented (.*)/i,
  /created (.*)/i,
  /added (.*)/i,
  /fixed (.*)/i,
  /successfully (.*)/i,
  /now (.*)/i,
  /able to (.*)/i,
];

const BLOCKED_PATTERNS = [
  /stuck on (.*)/i,
  /blocked by (.*)/i,
  /waiting for (.*)/i,
  /can't (.*)/i,
  /unable to (.*)/i,
  /issue with (.*)/i,
  /problem with (.*)/i,
  /failing (.*)/i,
  /error (.*)/i,
];

function extractTextContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === "string") {
          return block;
        }
        if (typeof block === "object" && block !== null) {
          return (block as { text?: string }).text || "";
        }
        return "";
      })
      .join(" ");
  }
  if (typeof content === "object" && content !== null) {
    return (content as { text?: string }).text || "";
  }
  return "";
}

export function extractMessagesFromTranscript(
  sessionFilePath: string,
  limit = 50,
): TranscriptMessage[] {
  const messages: TranscriptMessage[] = [];

  try {
    if (!fs.existsSync(sessionFilePath)) {
      return messages;
    }

    const content = fs.readFileSync(sessionFilePath, "utf-8");
    const lines = content.split("\n").filter((line) => line.trim());

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.message?.role && parsed.message?.content) {
          const text = extractTextContent(parsed.message.content);
          if (text) {
            messages.push({
              role: parsed.message.role,
              content: text,
              timestamp: parsed.timestamp,
            });
          }
        }
      } catch {
        continue;
      }
    }
  } catch (error) {
    console.error("Failed to read transcript:", error);
  }

  return messages.slice(-limit);
}

function classifyEntry(content: string): BrainEntryType | null {
  for (const pattern of GOAL_PATTERNS) {
    if (pattern.test(content)) {
      return "goal";
    }
  }
  for (const pattern of DECISION_PATTERNS) {
    if (pattern.test(content)) {
      return "decision";
    }
  }
  for (const pattern of PROGRESS_PATTERNS) {
    if (pattern.test(content)) {
      return "progress";
    }
  }
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(content)) {
      return "blocked";
    }
  }
  return null;
}

export function extractKeyInformation(
  messages: TranscriptMessage[],
): {
  goals: string[];
  decisions: string[];
  progress: string[];
  blocked: string[];
  currentGoal: string | undefined;
} {
  const goals: string[] = [];
  const decisions: string[] = [];
  const progress: string[] = [];
  const blocked: string[] = [];

  for (const msg of messages) {
    const text = msg.content.slice(0, 500);
    const type = classifyEntry(text);

    if (type === "goal" && !goals.includes(text)) {
      goals.push(text);
    } else if (type === "decision" && !decisions.includes(text)) {
      decisions.push(text);
    } else if (type === "progress" && !progress.includes(text)) {
      progress.push(text);
    } else if (type === "blocked" && !blocked.includes(text)) {
      blocked.push(text);
    }
  }

  const currentGoal = goals[goals.length - 1] || undefined;

  return { goals, decisions, progress, blocked, currentGoal };
}

export function updateBrainFromSession(
  sessionId: string,
  sessionFilePath: string,
): BrainState {
  const messages = extractMessagesFromTranscript(sessionFilePath);
  const { goals, decisions, progress, blocked, currentGoal } =
    extractKeyInformation(messages);

  const brain = loadBrain();

  for (const goal of goals.slice(0, 3)) {
    brain.entries.push({
      id: generateBrainEntryId(),
      timestamp: Date.now(),
      type: "goal",
      content: goal,
      sessionId,
      tags: ["extracted"],
    });
  }

  for (const decision of decisions.slice(0, 5)) {
    brain.entries.push({
      id: generateBrainEntryId(),
      timestamp: Date.now(),
      type: "decision",
      content: decision,
      sessionId,
      tags: ["extracted"],
    });
  }

  for (const item of progress.slice(0, 3)) {
    brain.entries.push({
      id: generateBrainEntryId(),
      timestamp: Date.now(),
      type: "progress",
      content: item,
      sessionId,
      tags: ["extracted"],
    });
  }

  for (const item of blocked.slice(0, 2)) {
    brain.entries.push({
      id: generateBrainEntryId(),
      timestamp: Date.now(),
      type: "blocked",
      content: item,
      sessionId,
      tags: ["extracted"],
    });
  }

  if (currentGoal) {
    brain.currentGoal = currentGoal;
  }

  brain.lastUpdated = Date.now();
  brain.sessionId = sessionId;

  const maxEntries = 100;
  if (brain.entries.length > maxEntries) {
    brain.entries = brain.entries.slice(0, maxEntries);
  }

  saveBrain(brain);
  return brain;
}

export function injectBrainContext(): string {
  const brain = loadBrain();

  if (brain.entries.length === 0) {
    return "";
  }

  const lines: string[] = ["## Session Memory"];

  if (brain.currentGoal) {
    lines.push(`**Current Goal**: ${brain.currentGoal}`);
  }

  const recentEntries = brain.entries.slice(0, 10);
  const byType: Record<BrainEntryType, BrainEntry[]> = {
    goal: [],
    decision: [],
    progress: [],
    blocked: [],
    note: [],
  };

  for (const entry of recentEntries) {
    byType[entry.type]?.push(entry);
  }

  if (byType.decision.length > 0) {
    lines.push("\n**Key Decisions**:");
    for (const d of byType.decision.slice(0, 3)) {
      lines.push(`- ${d.content.slice(0, 200)}`);
    }
  }

  if (byType.blocked.length > 0) {
    lines.push("\n**Blocked/Stuck**:");
    for (const b of byType.blocked) {
      lines.push(`- ${b.content.slice(0, 200)}`);
    }
  }

  if (byType.progress.length > 0) {
    lines.push("\n**Recent Progress**:");
    for (const p of byType.progress.slice(0, 2)) {
      lines.push(`- ${p.content.slice(0, 200)}`);
    }
  }

  return lines.join("\n");
}
