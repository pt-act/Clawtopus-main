import fs from "node:fs";
import path from "node:path";
import type { RuntimeEnv } from "../runtime.js";
import { compactEmbeddedPiSession } from "../agents/pi-embedded-runner/compact.js";
import { incrementCompactionCount } from "../auto-reply/reply/session-updates.js";
import { promptYesNo } from "../cli/prompt.js";
import { loadConfig } from "../config/config.js";
import {
  loadSessionStore,
  resolveDefaultSessionStorePath,
  resolveSessionFilePath,
  type SessionEntry,
} from "../config/sessions.js";
import { info } from "../globals.js";

function resolveSessionFileFromKey(sessionKey: string): {
  sessionId: string;
  sessionFile: string;
  storePath: string;
  entry: SessionEntry;
  store: Record<string, SessionEntry>;
} {
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

  return { sessionId: entry.sessionId, sessionFile, storePath, entry, store };
}

export async function compactCommand(
  opts: { session?: string; focus?: string; dryRun?: boolean },
  runtime: RuntimeEnv,
): Promise<void> {
  const cfg = loadConfig();

  const sessionKey = opts.session?.trim();
  if (!sessionKey) {
    runtime.error("Missing --session <key>. Run 'openclaw sessions' to list active sessions.");
    runtime.exit(1);
    return;
  }

  let sessionMeta;
  try {
    sessionMeta = resolveSessionFileFromKey(sessionKey);
  } catch (err) {
    runtime.error(err instanceof Error ? err.message : String(err));
    runtime.exit(1);
    return;
  }

  const { sessionId, sessionFile, storePath, entry, store } = sessionMeta;

  const exists = fs.existsSync(sessionFile);
  if (!exists) {
    runtime.error(`Session transcript not found: ${sessionFile}`);
    runtime.exit(1);
    return;
  }

  const stats = fs.statSync(sessionFile);
  runtime.log(info(`Session store: ${storePath}`));
  runtime.log(info(`Session key: ${sessionKey}`));
  runtime.log(info(`Session id: ${sessionId}`));
  runtime.log(info(`Transcript: ${sessionFile}`));
  runtime.log(info(`Transcript size: ${(stats.size / 1024).toFixed(1)} KB`));

  if (opts.dryRun) {
    runtime.log(
      "Dry-run mode does not yet estimate post-compaction token counts. " +
        "Run without --dry-run to compact this session.",
    );
    return;
  }

  const confirmed = await promptYesNo(
    `Compact session "${sessionKey}" (id=${sessionId})? This will persist a new summary entry.`,
  );
  if (!confirmed) {
    runtime.log("Cancelled.");
    return;
  }

  runtime.log(info(`Compacting session ${sessionKey} (id=${sessionId})...`));

  const result = await compactEmbeddedPiSession({
    sessionId,
    sessionKey,
    sessionFile,
    workspaceDir: process.cwd(),
    config: cfg,
    trigger: "manual",
    customInstructions: opts.focus,
    messageChannel: undefined,
    messageProvider: undefined,
  });

  if (!result.ok || !result.compacted || !result.result) {
    runtime.error(result.reason ?? "Compaction failed or nothing to compact.");
    runtime.exit(1);
    return;
  }

  const before = result.result.tokensBefore;
  const after = result.result.tokensAfter ?? before;
  const saved = before - after;

  runtime.log(info("Compaction complete."));
  runtime.log(info(`Tokens: ${before.toLocaleString()} → ${after.toLocaleString()}`));
  if (saved > 0) {
    runtime.log(info(`Saved approximately ${saved.toLocaleString()} tokens.`));
  }

  try {
    const nextCount = await incrementCompactionCount({
      sessionEntry: entry,
      sessionStore: store,
      sessionKey,
      storePath,
      tokensAfter: result.result.tokensAfter,
    });
    if (typeof nextCount === "number") {
      runtime.log(info(`Compactions (total): ${nextCount}`));
    }
  } catch (err) {
    runtime.log(
      info(
        `Warning: failed to update session compaction metadata: ${
          err instanceof Error ? err.message : String(err)
        }`,
      ),
    );
  }
}
