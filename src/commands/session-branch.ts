import fs from "node:fs";
import path from "node:path";
import type { RuntimeEnv } from "../runtime.js";
import { branchSession } from "../agents/session-branch.js";
import {
  loadSessionStore,
  resolveDefaultSessionStorePath,
  resolveSessionFilePath,
  type SessionEntry,
} from "../config/sessions.js";
import { info } from "../globals.js";
import { shortenHomePath } from "../utils.js";

export type SessionBranchOptions = {
  session?: string;
  lines?: number;
  output?: string;
  newSessionId?: string;
};

type SessionResolution = {
  sessionId: string;
  sessionFile: string;
  storePath: string;
  entry: SessionEntry;
};

function resolveSession(sessionKey: string): SessionResolution {
  const trimmedKey = sessionKey.trim();
  if (!trimmedKey) {
    throw new Error("missing session key");
  }
  const storePath = resolveDefaultSessionStorePath();
  const store = loadSessionStore(storePath, { skipCache: true });
  const entry = store[trimmedKey] as SessionEntry | undefined;
  if (!entry?.sessionId) {
    throw new Error(`unknown session key: ${trimmedKey}`);
  }
  const sessionsDir = path.dirname(storePath);
  const sessionFile = entry.sessionFile
    ? entry.sessionFile
    : resolveSessionFilePath(entry.sessionId, entry, { sessionsDir });
  return { sessionId: entry.sessionId, sessionFile, storePath, entry };
}

export async function sessionBranchCommand(
  opts: SessionBranchOptions,
  runtime: RuntimeEnv,
): Promise<void> {
  const sessionKey = opts.session?.trim();
  if (!sessionKey) {
    runtime.error("Missing --session <key>. Run 'openclaw sessions' to list active sessions.");
    runtime.exit(1);
    return;
  }

  let resolved: SessionResolution;
  try {
    resolved = resolveSession(sessionKey);
  } catch (err) {
    runtime.error(err instanceof Error ? err.message : String(err));
    runtime.exit(1);
    return;
  }

  if (!fs.existsSync(resolved.sessionFile)) {
    runtime.error(`Session transcript not found: ${resolved.sessionFile}`);
    runtime.exit(1);
    return;
  }

  const raw = fs.readFileSync(resolved.sessionFile, "utf-8");
  const lines = raw.split(/\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    runtime.error("Session transcript is empty.");
    runtime.exit(1);
    return;
  }

  let lineCount = opts.lines ? Number(opts.lines) : undefined;
  if (!lineCount || Number.isNaN(lineCount) || lineCount <= 0) {
    runtime.error("Missing --lines option. Please specify number of lines to keep in the branch.");
    runtime.exit(1);
    return;
  }

  const sessionId = opts.newSessionId?.trim() || `branch-${Date.now()}`;
  const result = branchSession({
    sessionId,
    sourceSessionFile: resolved.sessionFile,
    outputDir: opts.output?.trim(),
    lineCount,
  });

  runtime.log(info("Session branch created."));
  runtime.log(info(`Source: ${shortenHomePath(resolved.sessionFile)}`));
  runtime.log(info(`Branch: ${shortenHomePath(result.sessionFile)}`));
  runtime.log(info(`New session: ${result.sessionId}`));
}
