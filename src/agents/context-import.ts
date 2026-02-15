import fs from "node:fs";
import {
  loadSessionStore,
  resolveDefaultSessionStorePath,
  resolveSessionTranscriptPathInDir,
} from "../config/sessions.js";

export type ContextImportPayload = {
  version: string;
  exportedAt: number;
  sessionId?: string;
  summary: string;
  keyFiles: {
    read: string[];
    modified: string[];
  };
  openQuestions: string[];
  nextSteps: string[];
  metadata?: Record<string, unknown>;
};

export type ImportContextResult = {
  sessionId: string;
  sessionFile: string;
};

function formatContextMessage(payload: ContextImportPayload): string {
  const lines = ["Imported context summary:", payload.summary.trim()];
  if (payload.keyFiles.read.length) {
    lines.push("", "Key files read:", ...payload.keyFiles.read.map((file) => `- ${file}`));
  }
  if (payload.keyFiles.modified.length) {
    lines.push("", "Key files modified:", ...payload.keyFiles.modified.map((file) => `- ${file}`));
  }
  if (payload.openQuestions.length) {
    lines.push("", "Open questions:", ...payload.openQuestions.map((q) => `- ${q}`));
  }
  if (payload.nextSteps.length) {
    lines.push("", "Next steps:", ...payload.nextSteps.map((step) => `- ${step}`));
  }
  return lines.join("\n").trim();
}

export function importContext(params: {
  payload: ContextImportPayload;
  sessionsDir?: string;
  sessionId?: string;
  now?: () => number;
}): ImportContextResult {
  const { payload } = params;
  if (!payload?.summary) {
    throw new Error("Invalid export payload: summary missing");
  }
  if (!payload.keyFiles || !Array.isArray(payload.keyFiles.read)) {
    throw new Error("Invalid export payload: keyFiles missing");
  }

  const storePath = resolveDefaultSessionStorePath();
  const sessionsDir = params.sessionsDir ?? fs.realpathSync.native?.(storePath) ?? storePath;
  const store = loadSessionStore(storePath, { skipCache: true });
  const sessionId = params.sessionId?.trim() || payload.sessionId || `import-${Date.now()}`;
  const sessionFile = resolveSessionTranscriptPathInDir(sessionId, sessionsDir);

  const entry = {
    sessionId,
    lastUpdated: params.now ? params.now() : Date.now(),
    updatedAt: params.now ? params.now() : Date.now(),
    summary: payload.summary.slice(0, 80),
    sessionFile,
    compactionCount: 0,
  };
  store[sessionId] = entry;

  fs.mkdirSync(sessionsDir, { recursive: true });
  const message = {
    type: "system",
    message: formatContextMessage(payload),
  };
  fs.writeFileSync(sessionFile, `${JSON.stringify(message)}\n`, "utf-8");

  return { sessionId, sessionFile };
}
