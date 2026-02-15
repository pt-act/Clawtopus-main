import fs from "node:fs";
import path from "node:path";
import type { RuntimeEnv } from "../runtime.js";
import { resolveCompactionConfig } from "../agents/compaction-config.js";
import { DEFAULT_COMPACTION_LAYERS, type CompactionLayer } from "../agents/compaction-layers.js";
import { loadConfig } from "../config/config.js";
import {
  loadSessionStore,
  resolveDefaultSessionStorePath,
  resolveSessionFilePath,
  type SessionEntry,
} from "../config/sessions.js";
import { info } from "../globals.js";
import { shortenHomePath } from "../utils.js";

const DEFAULT_SYSTEM_TOKEN_WEIGHT = 0.08;

type InspectOptions = {
  session?: string;
  json?: boolean;
};

type SessionResolution = {
  sessionId: string;
  sessionFile: string;
  storePath: string;
  entry: SessionEntry;
};

type CompactionSavings = {
  layer: CompactionLayer;
  estimatedSavedTokens: number;
};

type InspectBreakdown = {
  totalTokens: number;
  messageTokens: number;
  toolTokens: number;
  systemTokens: number;
};

type InspectResult = {
  sessionKey: string;
  sessionId: string;
  storePath: string;
  sessionFile: string;
  breakdown: InspectBreakdown;
  savings: CompactionSavings[];
  pinnedMessages: string[];
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

function categorizeTokens(lines: string[]): InspectBreakdown {
  let total = 0;
  let messageTokens = 0;
  let toolTokens = 0;
  let systemTokens = 0;

  for (const line of lines) {
    const approxTokens = Math.max(1, Math.round(line.length / 4));
    total += approxTokens;

    if (line.includes('"type":"session"')) {
      systemTokens += approxTokens;
      continue;
    }
    if (line.includes('"role":"toolResult"') || line.includes('"toolCallId"')) {
      toolTokens += approxTokens;
      continue;
    }
    messageTokens += approxTokens;
  }

  if (total === 0 && lines.length > 0) {
    total = lines.length;
  }

  if (systemTokens === 0 && total > 0) {
    systemTokens = Math.round(total * DEFAULT_SYSTEM_TOKEN_WEIGHT);
    messageTokens = Math.max(0, total - toolTokens - systemTokens);
  }

  return { totalTokens: total, messageTokens, toolTokens, systemTokens };
}

function estimateSavings(
  breakdown: InspectBreakdown,
  layers: CompactionLayer[] = DEFAULT_COMPACTION_LAYERS,
): CompactionSavings[] {
  const total = breakdown.totalTokens;
  return layers.map((layer) => {
    const factor = layer.id === "prune" ? 0.2 : layer.id === "summarize" ? 0.35 : 0.5;
    const estimatedSavedTokens = Math.max(0, Math.round(total * factor));
    return { layer, estimatedSavedTokens };
  });
}

export async function contextInspectCommand(
  opts: InspectOptions,
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
  const compactionConfig = resolveCompactionConfig(cfg);
  void compactionConfig;
  const transcriptLines = readTranscriptLines(resolved.sessionFile);
  const breakdown = categorizeTokens(transcriptLines);
  const savings = estimateSavings(breakdown);
  const pinnedMessages: string[] = [];

  const result: InspectResult = {
    sessionKey,
    sessionId: resolved.sessionId,
    storePath: resolved.storePath,
    sessionFile: resolved.sessionFile,
    breakdown,
    savings,
    pinnedMessages,
  };

  if (opts.json) {
    runtime.log(JSON.stringify(result, null, 2));
    return;
  }

  runtime.log(info(`Context Inspect (${sessionKey})`));
  runtime.log(info(`Store: ${shortenHomePath(resolved.storePath)}`));
  runtime.log(info(`Session id: ${resolved.sessionId}`));
  runtime.log(info(`Transcript: ${shortenHomePath(resolved.sessionFile)}`));
  runtime.log("");
  runtime.log(info("Breakdown"));
  runtime.log(`  Messages: ${breakdown.messageTokens.toLocaleString()} tokens`);
  runtime.log(`  Tool output: ${breakdown.toolTokens.toLocaleString()} tokens`);
  runtime.log(`  System: ${breakdown.systemTokens.toLocaleString()} tokens`);
  runtime.log(`  Total: ${breakdown.totalTokens.toLocaleString()} tokens`);
  runtime.log("");
  runtime.log(info("Potential savings"));
  for (const entry of savings) {
    runtime.log(
      `  ${entry.layer.id}: ~${entry.estimatedSavedTokens.toLocaleString()} tokens` +
        ` (${entry.layer.description ?? ""})`,
    );
  }
  runtime.log("");
  runtime.log(info("Pinned messages"));
  runtime.log(pinnedMessages.length > 0 ? pinnedMessages.join("\n") : "  (none yet)");
  runtime.log("");
  runtime.log(info(`Compaction mode: ${compactionConfig.mode}`));
}
