import type { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import type { TranscriptEvent } from "../sessions/transcript-events.js";
import { loadSessionWithBoundary } from "../agents/compaction-boundary.js";
import { evaluateDegradation } from "../agents/compaction-guard.js";
import { lookupContextTokens } from "../agents/context.js";
import { DEFAULT_CONTEXT_TOKENS, DEFAULT_MODEL, DEFAULT_PROVIDER } from "../agents/defaults.js";
import { resolveConfiguredModelRef } from "../agents/model-selection.js";
import { loadConfig } from "../config/config.js";
import {
  loadSessionStore,
  resolveDefaultSessionStorePath,
  resolveFreshSessionTotalTokens,
  resolveSessionFilePath,
  type SessionEntry,
} from "../config/sessions.js";
import { formatTimeAgo } from "../infra/format-time/format-relative.ts";
import { defaultRuntime } from "../runtime.js";
import { formatDocsLink } from "../terminal/links.js";
import { colorize, isRich, theme } from "../terminal/theme.js";
import { shortenHomePath } from "../utils.js";

type ContextStatusOptions = {
  session?: string;
  json?: boolean;
};

type ContextHistoryOptions = {
  session?: string;
  json?: boolean;
};

type ResolvedSession = {
  key: string;
  sessionId: string;
  sessionFile: string;
  storePath: string;
  entry: SessionEntry;
  store: Record<string, SessionEntry>;
};

function resolveSessionFromKey(sessionKey: string): ResolvedSession {
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

  return { key: trimmedKey, sessionId: entry.sessionId, sessionFile, storePath, entry, store };
}

function readTranscriptEvents(sessionFile: string): TranscriptEvent[] {
  if (!fs.existsSync(sessionFile)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(sessionFile, "utf-8");
    const events: TranscriptEvent[] = [];
    for (const line of raw.split(/\n+/)) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      try {
        const parsed = JSON.parse(trimmed) as TranscriptEvent;
        if (parsed && typeof parsed === "object") {
          events.push(parsed);
        }
      } catch {
        // ignore malformed lines
      }
    }
    return events;
  } catch {
    return [];
  }
}

function toTimestampMs(timestamp: number | string | undefined): number | null {
  if (typeof timestamp === "number" && Number.isFinite(timestamp)) {
    return timestamp;
  }
  if (typeof timestamp === "string") {
    const parsed = Date.parse(timestamp);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function formatTokensDelta(before: number, after: number): string {
  const beforeLabel = before.toLocaleString();
  const afterLabel = after.toLocaleString();
  const saved = Math.max(0, before - after);
  return `${beforeLabel} → ${afterLabel} (saved ${saved.toLocaleString()})`;
}

function formatContextHistorySummary(event: TranscriptEvent): string[] {
  if (!event || typeof event !== "object" || event.type !== "compaction") {
    return [];
  }
  const compaction = event as TranscriptEvent & {
    id?: string;
    timestamp?: number | string;
    messagesCompacted?: number;
    tokensBeforeCompaction?: number;
    tokensAfterCompaction?: number;
    trigger?: string;
    layer?: string;
    customInstruction?: string;
  };
  const ts = toTimestampMs(compaction.timestamp);
  const ago = ts ? formatTimeAgo(Date.now() - ts) : null;
  const header = `${ago ? `[${ago} ago] ` : ""}${(compaction.trigger ?? "unknown").toUpperCase()} - Layer: ${
    compaction.layer ?? "unknown"
  }`;
  const detailLines: string[] = [];
  if (
    typeof compaction.tokensBeforeCompaction === "number" &&
    typeof compaction.tokensAfterCompaction === "number"
  ) {
    detailLines.push(
      `  ${formatTokensDelta(compaction.tokensBeforeCompaction, compaction.tokensAfterCompaction)}`,
    );
  }
  if (typeof compaction.messagesCompacted === "number") {
    detailLines.push(`  Compacted: ${compaction.messagesCompacted} messages`);
  }
  if (compaction.customInstruction) {
    detailLines.push(`  Focus: ${compaction.customInstruction}`);
  }
  return [header, ...detailLines];
}

export async function runContextHistory(opts: ContextHistoryOptions): Promise<void> {
  const sessionKey = opts.session?.trim();
  if (!sessionKey) {
    defaultRuntime.error(
      "Missing --session <key>. Run 'openclaw sessions' to list active sessions.",
    );
    defaultRuntime.exit(1);
    return;
  }

  let resolved: ResolvedSession;
  try {
    resolved = resolveSessionFromKey(sessionKey);
  } catch (err) {
    defaultRuntime.error(err instanceof Error ? err.message : String(err));
    defaultRuntime.exit(1);
    return;
  }

  const { entry, storePath, sessionFile } = resolved;
  const events = readTranscriptEvents(sessionFile);
  const compactionEvents = events.filter((event) => event.type === "compaction");
  const sorted = compactionEvents
    .map((event) => {
      const ts = toTimestampMs((event as { timestamp?: number | string }).timestamp);
      return { event, ts };
    })
    .sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));

  const effectiveCompactions = Math.max(entry.compactionCount ?? 0, compactionEvents.length);
  const degradation = evaluateDegradation(effectiveCompactions);

  if (opts.json) {
    const payload = {
      sessionKey: resolved.key,
      sessionId: entry.sessionId,
      storePath,
      sessionFile,
      compactionCount: effectiveCompactions,
      riskLevel: degradation.riskLevel,
      informationLossEstimate: degradation.informationLossEstimate,
      recommendation: degradation.recommendation,
      events: sorted.map(({ event, ts }) => ({
        id: (event as { id?: string }).id ?? null,
        timestamp: ts,
        trigger: (event as { trigger?: string }).trigger ?? null,
        layer: (event as { layer?: string }).layer ?? null,
        messagesCompacted: (event as { messagesCompacted?: number }).messagesCompacted ?? null,
        tokensBefore: (event as { tokensBeforeCompaction?: number }).tokensBeforeCompaction ?? null,
        tokensAfter: (event as { tokensAfterCompaction?: number }).tokensAfterCompaction ?? null,
        customInstruction: (event as { customInstruction?: string }).customInstruction ?? null,
      })),
    };
    defaultRuntime.log(JSON.stringify(payload, null, 2));
    return;
  }

  const rich = isRich();
  const heading = (text: string) => colorize(rich, theme.heading, text);
  const muted = (text: string) => colorize(rich, theme.muted, text);
  const info = (text: string) => colorize(rich, theme.info, text);
  const riskColor =
    degradation.riskLevel === "critical"
      ? theme.error
      : degradation.riskLevel === "high"
        ? theme.warn
        : degradation.riskLevel === "medium"
          ? theme.info
          : theme.success;
  const riskLabel = colorize(rich, riskColor, degradation.riskLevel);

  const lines: string[] = [];
  lines.push(`${heading("Context History")} ${muted(`(${resolved.key})`)}`);
  if (sorted.length === 0) {
    lines.push(`${info("No compaction events recorded.")}`);
  } else {
    for (const { event } of sorted) {
      lines.push(...formatContextHistorySummary(event));
      lines.push("");
    }
  }
  lines.push(`${muted("Total Compactions:")} ${info(String(effectiveCompactions))}`);
  lines.push(`${muted("Risk Level:")} ${riskLabel}`);

  defaultRuntime.log(lines.join("\n").trim());
}

export async function runContextStatus(opts: ContextStatusOptions): Promise<void> {
  const sessionKey = opts.session?.trim();
  if (!sessionKey) {
    defaultRuntime.error(
      "Missing --session <key>. Run 'openclaw sessions' to list active sessions.",
    );
    defaultRuntime.exit(1);
    return;
  }

  let resolved: ResolvedSession;
  try {
    resolved = resolveSessionFromKey(sessionKey);
  } catch (err) {
    defaultRuntime.error(err instanceof Error ? err.message : String(err));
    defaultRuntime.exit(1);
    return;
  }

  const cfg = loadConfig();
  const { entry, storePath, sessionFile } = resolved;
  const sessionId = entry.sessionId;

  const resolvedModel = resolveConfiguredModelRef({
    cfg,
    defaultProvider: DEFAULT_PROVIDER,
    defaultModel: DEFAULT_MODEL,
  });
  const modelId = entry.model ?? resolvedModel.model ?? DEFAULT_MODEL;
  const contextTokens =
    entry.contextTokens ??
    lookupContextTokens(modelId) ??
    cfg.agents?.defaults?.contextTokens ??
    DEFAULT_CONTEXT_TOKENS;

  const totalTokens = resolveFreshSessionTotalTokens(entry) ?? null;
  const usagePct =
    totalTokens != null && contextTokens
      ? Math.min(999, (totalTokens / contextTokens) * 100)
      : null;

  const events = readTranscriptEvents(sessionFile);
  const boundary = events.length > 0 ? loadSessionWithBoundary(events) : null;

  const compactionsFromMetadata = entry.compactionCount ?? 0;
  const compactionsFromTranscript = boundary?.compactionCount ?? 0;
  const effectiveCompactions = Math.max(compactionsFromMetadata, compactionsFromTranscript);
  const degradation = evaluateDegradation(effectiveCompactions);

  const lastCompactionAt = boundary?.lastCompactionAt ?? null;
  const lastCompactionAgo =
    typeof lastCompactionAt === "number" && Number.isFinite(lastCompactionAt)
      ? formatTimeAgo(Date.now() - lastCompactionAt)
      : null;

  const compactionConfig = cfg.agents?.defaults?.compaction;
  const autoCompactionEnabled = (compactionConfig?.maxAutoCompactions ?? 0) > 0;

  if (opts.json) {
    const payload = {
      sessionKey: resolved.key,
      sessionId,
      storePath,
      sessionFile,
      contextTokens,
      totalTokens,
      usagePercent: usagePct,
      compaction: {
        fromMetadata: compactionsFromMetadata,
        fromTranscript: compactionsFromTranscript,
        effectiveCount: effectiveCompactions,
        lastCompactionAt,
        riskLevel: degradation.riskLevel,
        informationLossEstimate: degradation.informationLossEstimate,
        recommendation: degradation.recommendation,
        autoCompaction: {
          enabled: autoCompactionEnabled,
          maxAutoCompactions: compactionConfig?.maxAutoCompactions ?? null,
          warnAtCompaction: compactionConfig?.warnAtCompaction ?? null,
        },
      },
    };
    defaultRuntime.log(JSON.stringify(payload, null, 2));
    return;
  }

  const rich = isRich();
  const heading = (text: string) => colorize(rich, theme.heading, text);
  const muted = (text: string) => colorize(rich, theme.muted, text);
  const info = (text: string) => colorize(rich, theme.info, text);
  const success = (text: string) => colorize(rich, theme.success, text);
  const label = (text: string) => muted(`${text}:`);
  const storeLabel = shortenHomePath(storePath);
  const transcriptLabel = fs.existsSync(sessionFile)
    ? shortenHomePath(sessionFile)
    : `${shortenHomePath(sessionFile)} (missing)`;

  const contextLabel = (() => {
    if (!contextTokens) {
      return "unknown";
    }
    if (totalTokens == null) {
      return `${totalTokens ?? "?"}/${contextTokens.toLocaleString()} (?%)`;
    }
    const pctLabel = usagePct != null ? `${usagePct.toFixed(1)}%` : "?%";
    return `${totalTokens.toLocaleString()} / ${contextTokens.toLocaleString()} (${pctLabel})`;
  })();

  const riskColor =
    degradation.riskLevel === "critical"
      ? theme.error
      : degradation.riskLevel === "high"
        ? theme.warn
        : degradation.riskLevel === "medium"
          ? theme.info
          : theme.success;
  const riskLabel = colorize(rich, riskColor, degradation.riskLevel);

  const lines: string[] = [];
  lines.push(`${heading("Context Status")} ${muted(`(${resolved.key})`)}`);
  lines.push(`${label("Store")} ${info(storeLabel)}`);
  lines.push(`${label("Session id")} ${info(sessionId)}`);
  lines.push(`${label("Transcript")} ${info(transcriptLabel)}`);
  lines.push(`${label("Context")} ${success(contextLabel)}`);
  lines.push(
    `${label("Compactions")} ${info(String(effectiveCompactions))} ${muted(
      `(metadata ${compactionsFromMetadata}, transcript ${compactionsFromTranscript})`,
    )}`,
  );
  const autoCompactionLabel = autoCompactionEnabled ? "Enabled" : "Disabled";
  const autoCompactionDetails = autoCompactionEnabled
    ? ` (max ${compactionConfig?.maxAutoCompactions ?? 0}, warn at ${
        compactionConfig?.warnAtCompaction ?? "?"
      })`
    : "";

  lines.push(
    `${label("Auto-compaction")} ${info(autoCompactionLabel)}${muted(autoCompactionDetails)}`,
  );
  lines.push(
    `${label("Degradation")} ${riskLabel} ${muted(
      `(~${degradation.informationLossEstimate}% estimated information loss)`,
    )}`,
  );
  lines.push(`${label("Recommendations")} ${degradation.recommendation}`);
  if (lastCompactionAgo) {
    lines.push(`${label("Last compaction")} ${info(lastCompactionAgo)} ago`);
  }

  defaultRuntime.log(lines.join("\n"));
}

export function registerContextCli(program: Command) {
  const context = program
    .command("context")
    .description("Context and compaction inspection tools")
    .addHelpText(
      "after",
      () =>
        `\n${theme.muted("Docs: ")}${formatDocsLink(
          "/cli/context",
          "docs.openclaw.ai/cli/context",
        )}\n`,
    );

  context
    .command("status")
    .description("Show context usage and compaction state for a session")
    .option("--session <key>", "Target session key (from 'openclaw sessions')")
    .option("--json", "Print JSON")
    .action(async (opts: ContextStatusOptions) => {
      await runContextStatus(opts);
    });

  context
    .command("history")
    .description("Show compaction history and degradation risk for a session")
    .option("--session <key>", "Target session key (from 'openclaw sessions')")
    .option("--json", "Print JSON")
    .action(async (opts: ContextHistoryOptions) => {
      await runContextHistory(opts);
    });
}
