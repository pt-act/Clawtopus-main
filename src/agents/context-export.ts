import fs from "node:fs";
import type { CompactionEvent } from "../sessions/transcript-events.js";

export type ContextExportFormat = "structured" | "raw";

export type ContextExportMetadata = {
  totalMessages: number;
  compactionCount: number;
  durationHours: number;
};

export type ContextExportData = {
  version: "1.0";
  exportedAt: number;
  sessionId: string;
  sessionKey?: string;
  summary: string;
  keyFiles: {
    read: string[];
    modified: string[];
  };
  openQuestions: string[];
  nextSteps: string[];
  metadata: ContextExportMetadata;
};

export type RawContextExport = {
  version: "1.0";
  exportedAt: number;
  sessionId: string;
  sessionKey?: string;
  rawLines: string[];
};

export type ContextExportResult = ContextExportData | RawContextExport;

export type ContextExportInput = {
  sessionId: string;
  sessionKey?: string;
  sessionFile: string;
  format: ContextExportFormat;
};

const FILE_PATTERN =
  /(\b(?:src|lib|app|packages|tests?|docs|scripts)\/[^\s"'`]+\.(?:ts|tsx|js|jsx|py|md|json|yaml|yml)\b)/gi;

const MODIFIED_HINTS = ["modified", "updated", "created", "deleted", "refactor", "fix", "edit"];
const NEXT_HINTS = ["next", "todo", "follow up", "follow-up", "followup"];

type ParsedLine = Record<string, unknown>;

type ExtractedText = {
  role?: string;
  text: string;
  timestamp?: number;
};

function readTranscriptLines(sessionFile: string): string[] {
  if (!fs.existsSync(sessionFile)) {
    return [];
  }
  const raw = fs.readFileSync(sessionFile, "utf-8");
  return raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function safeParse(line: string): ParsedLine | null {
  try {
    const parsed = JSON.parse(line);
    if (parsed && typeof parsed === "object") {
      return parsed as ParsedLine;
    }
  } catch {
    // ignore
  }
  return null;
}

function extractTextBlocks(parsed: ParsedLine): ExtractedText[] {
  const role = typeof parsed.role === "string" ? parsed.role : undefined;
  const timestamp = typeof parsed.timestamp === "number" ? parsed.timestamp : undefined;
  const blocks = Array.isArray(parsed.content) ? parsed.content : [];
  const texts: ExtractedText[] = [];
  for (const block of blocks) {
    if (!block || typeof block !== "object") {
      continue;
    }
    const rec = block as { type?: unknown; text?: unknown; content?: unknown };
    if (rec.type === "text" && typeof rec.text === "string") {
      texts.push({ role, text: rec.text, timestamp });
    } else if (typeof rec.content === "string") {
      texts.push({ role, text: rec.content, timestamp });
    }
  }
  if (texts.length === 0 && typeof (parsed as { text?: unknown }).text === "string") {
    texts.push({ role, text: (parsed as { text: string }).text, timestamp });
  }
  return texts;
}

function collectAllText(parsedLines: ParsedLine[]): ExtractedText[] {
  return parsedLines.flatMap((line) => extractTextBlocks(line));
}

function extractSummary(textBlocks: ExtractedText[]): string {
  const assistantBlocks = textBlocks.filter((block) => block.role === "assistant");
  const candidate = assistantBlocks[assistantBlocks.length - 1]?.text?.trim();
  if (candidate) {
    return candidate.length > 280 ? `${candidate.slice(0, 277)}…` : candidate;
  }
  const fallback = textBlocks[textBlocks.length - 1]?.text?.trim();
  return fallback && fallback.length > 0 ? fallback : "Session export";
}

function extractFiles(textBlocks: ExtractedText[]): { read: string[]; modified: string[] } {
  const read = new Set<string>();
  const modified = new Set<string>();

  for (const block of textBlocks) {
    const matches = block.text.match(FILE_PATTERN) ?? [];
    if (matches.length === 0) {
      continue;
    }
    for (const match of matches) {
      read.add(match);
    }
    const textLower = block.text.toLowerCase();
    if (MODIFIED_HINTS.some((hint) => textLower.includes(hint))) {
      for (const match of matches) {
        modified.add(match);
      }
    }
  }

  return {
    read: Array.from(read),
    modified: Array.from(modified),
  };
}

function extractQuestions(textBlocks: ExtractedText[]): string[] {
  const questions = new Set<string>();
  for (const block of textBlocks) {
    const lines = block.text.split(/\n+/).map((line) => line.trim());
    for (const line of lines) {
      if (line.length < 6 || line.length > 140) {
        continue;
      }
      if (line.includes("?") || line.toLowerCase().startsWith("q:")) {
        questions.add(line.replace(/^q(?:uestion)?:\s*/i, ""));
      }
    }
  }
  return Array.from(questions);
}

function extractNextSteps(textBlocks: ExtractedText[]): string[] {
  const steps = new Set<string>();
  for (const block of textBlocks) {
    const textLower = block.text.toLowerCase();
    if (!NEXT_HINTS.some((hint) => textLower.includes(hint))) {
      continue;
    }
    const lines = block.text.split(/\n+/).map((line) => line.trim());
    for (const line of lines) {
      if (line.length < 4 || line.length > 160) {
        continue;
      }
      if (NEXT_HINTS.some((hint) => line.toLowerCase().includes(hint))) {
        steps.add(line.replace(/^[-*]\s*/, ""));
      }
    }
  }
  return Array.from(steps);
}

function extractMetadata(parsedLines: ParsedLine[]): ContextExportMetadata {
  const totalMessages = parsedLines.filter((line) => typeof line.role === "string").length;
  const compactionCount = parsedLines.filter((line) => line.type === "compaction").length;

  const timestamps = parsedLines
    .map((line) => (typeof line.timestamp === "number" ? line.timestamp : undefined))
    .filter((ts): ts is number => typeof ts === "number" && Number.isFinite(ts));
  const min = timestamps.length > 0 ? Math.min(...timestamps) : undefined;
  const max = timestamps.length > 0 ? Math.max(...timestamps) : undefined;
  const durationHours =
    min !== undefined && max !== undefined && max >= min
      ? Math.round(((max - min) / 36e5) * 10) / 10
      : 0;

  return {
    totalMessages,
    compactionCount,
    durationHours,
  };
}

function buildStructuredExport(params: {
  sessionId: string;
  sessionKey?: string;
  parsedLines: ParsedLine[];
  textBlocks: ExtractedText[];
}): ContextExportData {
  return {
    version: "1.0",
    exportedAt: Math.floor(Date.now() / 1000),
    sessionId: params.sessionId,
    sessionKey: params.sessionKey,
    summary: extractSummary(params.textBlocks),
    keyFiles: extractFiles(params.textBlocks),
    openQuestions: extractQuestions(params.textBlocks),
    nextSteps: extractNextSteps(params.textBlocks),
    metadata: extractMetadata(params.parsedLines),
  };
}

export function exportContext(params: ContextExportInput): ContextExportResult {
  const rawLines = readTranscriptLines(params.sessionFile);
  const parsedLines = rawLines.map((line) => safeParse(line)).filter(Boolean) as ParsedLine[];
  if (params.format === "raw") {
    return {
      version: "1.0",
      exportedAt: Math.floor(Date.now() / 1000),
      sessionId: params.sessionId,
      sessionKey: params.sessionKey,
      rawLines,
    };
  }

  const textBlocks = collectAllText(parsedLines);
  return buildStructuredExport({
    sessionId: params.sessionId,
    sessionKey: params.sessionKey,
    parsedLines,
    textBlocks,
  });
}

export function isCompactionEventLine(line: ParsedLine): line is ParsedLine & CompactionEvent {
  return line.type === "compaction";
}
