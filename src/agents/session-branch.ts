import fs from "node:fs";
import path from "node:path";
import {
  resolveDefaultSessionStorePath,
  resolveSessionTranscriptPathInDir,
} from "../config/sessions/paths.js";
import { loadSessionStore } from "../config/sessions/store.js";

export type BranchSessionResult = {
  sessionId: string;
  sessionFile: string;
  sourceSessionId: string;
  sourceSessionFile: string;
  copiedLines: number;
};

export function branchSession(params: {
  sessionId: string;
  sourceSessionFile: string;
  outputDir?: string;
  lineCount: number;
  now?: () => number;
}): BranchSessionResult {
  if (!params.sessionId.trim()) {
    throw new Error("Missing new session id");
  }
  if (params.lineCount <= 0) {
    throw new Error("lineCount must be positive");
  }

  const storePath = resolveDefaultSessionStorePath();
  const store = loadSessionStore(storePath, { skipCache: true });
  const sessionsDir = params.outputDir ?? path.dirname(storePath);
  const sessionFile = resolveSessionTranscriptPathInDir(params.sessionId, sessionsDir);

  if (!fs.existsSync(params.sourceSessionFile)) {
    throw new Error("Source transcript not found");
  }

  const raw = fs.readFileSync(params.sourceSessionFile, "utf-8");
  const lines = raw.split(/\n/).filter((line) => line.trim().length > 0);
  const startIndex = Math.max(0, lines.length - params.lineCount);
  const slice = lines.slice(startIndex);

  fs.mkdirSync(path.dirname(sessionFile), { recursive: true });
  fs.writeFileSync(sessionFile, slice.join("\n") + "\n", "utf-8");

  const entry = {
    sessionId: params.sessionId,
    lastUpdated: params.now ? params.now() : Date.now(),
    updatedAt: params.now ? params.now() : Date.now(),
    summary: `Branch from ${path.basename(params.sourceSessionFile)}`,
    sessionFile,
    compactionCount: 0,
  };
  store[params.sessionId] = entry;

  return {
    sessionId: params.sessionId,
    sessionFile,
    sourceSessionId: params.sessionId,
    sourceSessionFile: params.sourceSessionFile,
    copiedLines: slice.length,
  };
}
