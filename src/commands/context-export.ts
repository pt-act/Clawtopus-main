import fs from "node:fs";
import path from "node:path";
import type { RuntimeEnv } from "../runtime.js";
import { exportContext, type ContextExportFormat } from "../agents/context-export.js";
import { loadConfig } from "../config/config.js";
import {
  loadSessionStore,
  resolveDefaultSessionStorePath,
  resolveSessionFilePath,
  type SessionEntry,
} from "../config/sessions.js";
import { info } from "../globals.js";
import { shortenHomePath } from "../utils.js";

export type ContextExportOptions = {
  session?: string;
  format?: string;
  output?: string;
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

function normalizeFormat(value?: string): ContextExportFormat {
  if (!value) {
    return "structured";
  }
  const normalized = value.toLowerCase();
  return normalized === "raw" ? "raw" : "structured";
}

export async function contextExportCommand(
  opts: ContextExportOptions,
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

  const cfg = loadConfig();
  void cfg;
  const format = normalizeFormat(opts.format);
  const exportData = exportContext({
    sessionId: resolved.sessionId,
    sessionKey,
    sessionFile: resolved.sessionFile,
    format,
  });

  const outputPath = opts.output?.trim()
    ? opts.output.trim()
    : path.join(process.cwd(), `context-export-${resolved.sessionId}.json`);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), "utf-8");

  runtime.log(info(`Context export written.`));
  runtime.log(info(`Session: ${sessionKey}`));
  runtime.log(info(`Transcript: ${shortenHomePath(resolved.sessionFile)}`));
  runtime.log(info(`Output: ${shortenHomePath(outputPath)}`));
}
