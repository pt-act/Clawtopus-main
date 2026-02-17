import type { Command } from "commander";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { resolveDefaultAgentId } from "../agents/agent-scope.js";
import { loadBrain } from "../agents/session-brain/store.js";
import { loadConfig } from "../config/config.js";
import { resolveStateDir } from "../config/paths.js";
import { resolveSessionTranscriptsDirForAgent } from "../config/sessions/paths.js";
import { setVerbose } from "../globals.js";
import { getMemorySearchManager, type MemorySearchManagerResult } from "../memory/index.js";
import { listMemoryFiles, normalizeExtraMemoryPaths } from "../memory/internal.js";
import { defaultRuntime } from "../runtime.js";
import { formatDocsLink } from "../terminal/links.js";
import { colorize, isRich, theme } from "../terminal/theme.js";
import { shortenHomeInString, shortenHomePath } from "../utils.js";
import { formatErrorMessage, withManager } from "./cli-utils.js";
import { withProgress, withProgressTotals } from "./progress.js";

type MemoryCommandOptions = {
  agent?: string;
  json?: boolean;
  deep?: boolean;
  index?: boolean;
  force?: boolean;
  verbose?: boolean;
};

type MemoryManager = NonNullable<MemorySearchManagerResult["manager"]>;

type MemorySourceName = "memory" | "sessions";

type SourceScan = {
  source: MemorySourceName;
  totalFiles: number | null;
  issues: string[];
};

type MemorySourceScan = {
  sources: SourceScan[];
  totalFiles: number | null;
  issues: string[];
};

function formatSourceLabel(source: string, workspaceDir: string, agentId: string): string {
  if (source === "memory") {
    return shortenHomeInString(
      `memory (MEMORY.md + ${path.join(workspaceDir, "memory")}${path.sep}*.md)`,
    );
  }
  if (source === "sessions") {
    const stateDir = resolveStateDir(process.env, os.homedir);
    return shortenHomeInString(
      `sessions (${path.join(stateDir, "agents", agentId, "sessions")}${path.sep}*.jsonl)`,
    );
  }
  return source;
}

function resolveAgent(cfg: ReturnType<typeof loadConfig>, agent?: string) {
  const trimmed = agent?.trim();
  if (trimmed) {
    return trimmed;
  }
  return resolveDefaultAgentId(cfg);
}

function resolveAgentIds(cfg: ReturnType<typeof loadConfig>, agent?: string): string[] {
  const trimmed = agent?.trim();
  if (trimmed) {
    return [trimmed];
  }
  const list = cfg.agents?.list ?? [];
  if (list.length > 0) {
    return list.map((entry) => entry.id).filter(Boolean);
  }
  return [resolveDefaultAgentId(cfg)];
}

function formatExtraPaths(workspaceDir: string, extraPaths: string[]): string[] {
  return normalizeExtraMemoryPaths(workspaceDir, extraPaths).map((entry) => shortenHomePath(entry));
}

async function checkReadableFile(pathname: string): Promise<{ exists: boolean; issue?: string }> {
  try {
    await fs.access(pathname, fsSync.constants.R_OK);
    return { exists: true };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return { exists: false };
    }
    return {
      exists: true,
      issue: `${shortenHomePath(pathname)} not readable (${code ?? "error"})`,
    };
  }
}

async function scanSessionFiles(agentId: string): Promise<SourceScan> {
  const issues: string[] = [];
  const sessionsDir = resolveSessionTranscriptsDirForAgent(agentId);
  try {
    const entries = await fs.readdir(sessionsDir, { withFileTypes: true });
    const totalFiles = entries.filter(
      (entry) => entry.isFile() && entry.name.endsWith(".jsonl"),
    ).length;
    return { source: "sessions", totalFiles, issues };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      issues.push(`sessions directory missing (${shortenHomePath(sessionsDir)})`);
      return { source: "sessions", totalFiles: 0, issues };
    }
    issues.push(
      `sessions directory not accessible (${shortenHomePath(sessionsDir)}): ${code ?? "error"}`,
    );
    return { source: "sessions", totalFiles: null, issues };
  }
}

async function scanMemoryFiles(
  workspaceDir: string,
  extraPaths: string[] = [],
): Promise<SourceScan> {
  const issues: string[] = [];
  const memoryFile = path.join(workspaceDir, "MEMORY.md");
  const altMemoryFile = path.join(workspaceDir, "memory.md");
  const memoryDir = path.join(workspaceDir, "memory");

  const primary = await checkReadableFile(memoryFile);
  const alt = await checkReadableFile(altMemoryFile);
  if (primary.issue) {
    issues.push(primary.issue);
  }
  if (alt.issue) {
    issues.push(alt.issue);
  }

  const resolvedExtraPaths = normalizeExtraMemoryPaths(workspaceDir, extraPaths);
  for (const extraPath of resolvedExtraPaths) {
    try {
      const stat = await fs.lstat(extraPath);
      if (stat.isSymbolicLink()) {
        continue;
      }
      const extraCheck = await checkReadableFile(extraPath);
      if (extraCheck.issue) {
        issues.push(extraCheck.issue);
      }
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        issues.push(`additional memory path missing (${shortenHomePath(extraPath)})`);
      } else {
        issues.push(
          `additional memory path not accessible (${shortenHomePath(extraPath)}): ${code ?? "error"}`,
        );
      }
    }
  }

  let dirReadable: boolean | null = null;
  try {
    await fs.access(memoryDir, fsSync.constants.R_OK);
    dirReadable = true;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      issues.push(`memory directory missing (${shortenHomePath(memoryDir)})`);
      dirReadable = false;
    } else {
      issues.push(
        `memory directory not accessible (${shortenHomePath(memoryDir)}): ${code ?? "error"}`,
      );
      dirReadable = null;
    }
  }

  let listed: string[] = [];
  let listedOk = false;
  try {
    listed = await listMemoryFiles(workspaceDir, resolvedExtraPaths);
    listedOk = true;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (dirReadable !== null) {
      issues.push(
        `memory directory scan failed (${shortenHomePath(memoryDir)}): ${code ?? "error"}`,
      );
      dirReadable = null;
    }
  }

  let totalFiles: number | null = 0;
  if (dirReadable === null) {
    totalFiles = null;
  } else {
    const files = new Set<string>(listedOk ? listed : []);
    if (!listedOk) {
      if (primary.exists) {
        files.add(memoryFile);
      }
      if (alt.exists) {
        files.add(altMemoryFile);
      }
    }
    totalFiles = files.size;
  }

  if ((totalFiles ?? 0) === 0 && issues.length === 0) {
    issues.push(`no memory files found in ${shortenHomePath(workspaceDir)}`);
  }

  return { source: "memory", totalFiles, issues };
}

async function scanMemorySources(params: {
  workspaceDir: string;
  agentId: string;
  sources: MemorySourceName[];
  extraPaths?: string[];
}): Promise<MemorySourceScan> {
  const scans: SourceScan[] = [];
  const extraPaths = params.extraPaths ?? [];
  for (const source of params.sources) {
    if (source === "memory") {
      scans.push(await scanMemoryFiles(params.workspaceDir, extraPaths));
    }
    if (source === "sessions") {
      scans.push(await scanSessionFiles(params.agentId));
    }
  }
  const issues = scans.flatMap((scan) => scan.issues);
  const totals = scans.map((scan) => scan.totalFiles);
  const numericTotals = totals.filter((total): total is number => total !== null);
  const totalFiles = totals.some((total) => total === null)
    ? null
    : numericTotals.reduce((sum, total) => sum + total, 0);
  return { sources: scans, totalFiles, issues };
}

export async function runMemoryStatus(opts: MemoryCommandOptions) {
  setVerbose(Boolean(opts.verbose));
  const cfg = loadConfig();
  const agentIds = resolveAgentIds(cfg, opts.agent);
  const allResults: Array<{
    agentId: string;
    status: ReturnType<MemoryManager["status"]>;
    embeddingProbe?: Awaited<ReturnType<MemoryManager["probeEmbeddingAvailability"]>>;
    indexError?: string;
    scan?: MemorySourceScan;
  }> = [];

  for (const agentId of agentIds) {
    await withManager<MemoryManager>({
      getManager: () => getMemorySearchManager({ cfg, agentId }),
      onMissing: (error) => defaultRuntime.log(error ?? "Memory search disabled."),
      onCloseError: (err) =>
        defaultRuntime.error(`Memory manager close failed: ${formatErrorMessage(err)}`),
      close: async (manager) => {
        await manager.close?.();
      },
      run: async (manager) => {
        const deep = Boolean(opts.deep || opts.index);
        let embeddingProbe:
          | Awaited<ReturnType<typeof manager.probeEmbeddingAvailability>>
          | undefined;
        let indexError: string | undefined;
        const syncFn = manager.sync ? manager.sync.bind(manager) : undefined;
        if (deep) {
          await withProgress({ label: "Checking memory…", total: 2 }, async (progress) => {
            progress.setLabel("Probing vector…");
            await manager.probeVectorAvailability();
            progress.tick();
            progress.setLabel("Probing embeddings…");
            embeddingProbe = await manager.probeEmbeddingAvailability();
            progress.tick();
          });
          if (opts.index && syncFn) {
            await withProgressTotals(
              {
                label: "Indexing memory…",
                total: 0,
                fallback: opts.verbose ? "line" : undefined,
              },
              async (update, progress) => {
                try {
                  await syncFn({
                    reason: "cli",
                    force: Boolean(opts.force),
                    progress: (syncUpdate) => {
                      update({
                        completed: syncUpdate.completed,
                        total: syncUpdate.total,
                        label: syncUpdate.label,
                      });
                      if (syncUpdate.label) {
                        progress.setLabel(syncUpdate.label);
                      }
                    },
                  });
                } catch (err) {
                  indexError = formatErrorMessage(err);
                  defaultRuntime.error(`Memory index failed: ${indexError}`);
                  process.exitCode = 1;
                }
              },
            );
          } else if (opts.index && !syncFn) {
            defaultRuntime.log("Memory backend does not support manual reindex.");
          }
        } else {
          await manager.probeVectorAvailability();
        }
        const status = manager.status();
        const sources = (
          status.sources?.length ? status.sources : ["memory"]
        ) as MemorySourceName[];
        const workspaceDir = status.workspaceDir;
        const scan = workspaceDir
          ? await scanMemorySources({
              workspaceDir,
              agentId,
              sources,
              extraPaths: status.extraPaths,
            })
          : undefined;
        allResults.push({ agentId, status, embeddingProbe, indexError, scan });
      },
    });
  }

  if (opts.json) {
    defaultRuntime.log(JSON.stringify(allResults, null, 2));
    return;
  }

  const rich = isRich();
  const heading = (text: string) => colorize(rich, theme.heading, text);
  const muted = (text: string) => colorize(rich, theme.muted, text);
  const info = (text: string) => colorize(rich, theme.info, text);
  const success = (text: string) => colorize(rich, theme.success, text);
  const warn = (text: string) => colorize(rich, theme.warn, text);
  const accent = (text: string) => colorize(rich, theme.accent, text);
  const label = (text: string) => muted(`${text}:`);

  for (const result of allResults) {
    const { agentId, status, embeddingProbe, indexError, scan } = result;
    const filesIndexed = status.files ?? 0;
    const chunksIndexed = status.chunks ?? 0;
    const totalFiles = scan?.totalFiles ?? null;
    const indexedLabel =
      totalFiles === null
        ? `${filesIndexed}/? files · ${chunksIndexed} chunks`
        : `${filesIndexed}/${totalFiles} files · ${chunksIndexed} chunks`;
    if (opts.index) {
      const line = indexError ? `Memory index failed: ${indexError}` : "Memory index complete.";
      defaultRuntime.log(line);
    }
    const requestedProvider = status.requestedProvider ?? status.provider;
    const modelLabel = status.model ?? status.provider;
    const storePath = status.dbPath ? shortenHomePath(status.dbPath) : "<unknown>";
    const workspacePath = status.workspaceDir ? shortenHomePath(status.workspaceDir) : "<unknown>";
    const sourceList = status.sources?.length ? status.sources.join(", ") : null;
    const extraPaths = status.workspaceDir
      ? formatExtraPaths(status.workspaceDir, status.extraPaths ?? [])
      : [];
    const lines = [
      `${heading("Memory Search")} ${muted(`(${agentId})`)}`,
      `${label("Provider")} ${info(status.provider)} ${muted(`(requested: ${requestedProvider})`)}`,
      `${label("Model")} ${info(modelLabel)}`,
      sourceList ? `${label("Sources")} ${info(sourceList)}` : null,
      extraPaths.length ? `${label("Extra paths")} ${info(extraPaths.join(", "))}` : null,
      `${label("Indexed")} ${success(indexedLabel)}`,
      `${label("Dirty")} ${status.dirty ? warn("yes") : muted("no")}`,
      `${label("Store")} ${info(storePath)}`,
      `${label("Workspace")} ${info(workspacePath)}`,
    ].filter(Boolean) as string[];
    if (embeddingProbe) {
      const state = embeddingProbe.ok ? "ready" : "unavailable";
      const stateColor = embeddingProbe.ok ? theme.success : theme.warn;
      lines.push(`${label("Embeddings")} ${colorize(rich, stateColor, state)}`);
      if (embeddingProbe.error) {
        lines.push(`${label("Embeddings error")} ${warn(embeddingProbe.error)}`);
      }
    }
    if (status.sourceCounts?.length) {
      lines.push(label("By source"));
      for (const entry of status.sourceCounts) {
        const total = scan?.sources?.find(
          (scanEntry) => scanEntry.source === entry.source,
        )?.totalFiles;
        const counts =
          total === null
            ? `${entry.files}/? files · ${entry.chunks} chunks`
            : `${entry.files}/${total} files · ${entry.chunks} chunks`;
        lines.push(`  ${accent(entry.source)} ${muted("·")} ${muted(counts)}`);
      }
    }
    if (status.fallback) {
      lines.push(`${label("Fallback")} ${warn(status.fallback.from)}`);
    }
    if (status.vector) {
      const vectorState = status.vector.enabled
        ? status.vector.available === undefined
          ? "unknown"
          : status.vector.available
            ? "ready"
            : "unavailable"
        : "disabled";
      const vectorColor =
        vectorState === "ready"
          ? theme.success
          : vectorState === "unavailable"
            ? theme.warn
            : theme.muted;
      lines.push(`${label("Vector")} ${colorize(rich, vectorColor, vectorState)}`);
      if (status.vector.dims) {
        lines.push(`${label("Vector dims")} ${info(String(status.vector.dims))}`);
      }
      if (status.vector.extensionPath) {
        lines.push(`${label("Vector path")} ${info(shortenHomePath(status.vector.extensionPath))}`);
      }
      if (status.vector.loadError) {
        lines.push(`${label("Vector error")} ${warn(status.vector.loadError)}`);
      }
    }
    if (status.fts) {
      const ftsState = status.fts.enabled
        ? status.fts.available
          ? "ready"
          : "unavailable"
        : "disabled";
      const ftsColor =
        ftsState === "ready"
          ? theme.success
          : ftsState === "unavailable"
            ? theme.warn
            : theme.muted;
      lines.push(`${label("FTS")} ${colorize(rich, ftsColor, ftsState)}`);
      if (status.fts.error) {
        lines.push(`${label("FTS error")} ${warn(status.fts.error)}`);
      }
    }
    if (status.cache) {
      const cacheState = status.cache.enabled ? "enabled" : "disabled";
      const cacheColor = status.cache.enabled ? theme.success : theme.muted;
      const suffix =
        status.cache.enabled && typeof status.cache.entries === "number"
          ? ` (${status.cache.entries} entries)`
          : "";
      lines.push(`${label("Embedding cache")} ${colorize(rich, cacheColor, cacheState)}${suffix}`);
      if (status.cache.enabled && typeof status.cache.maxEntries === "number") {
        lines.push(`${label("Cache cap")} ${info(String(status.cache.maxEntries))}`);
      }
    }
    if (status.batch) {
      const batchState = status.batch.enabled ? "enabled" : "disabled";
      const batchColor = status.batch.enabled ? theme.success : theme.warn;
      const batchSuffix = ` (failures ${status.batch.failures}/${status.batch.limit})`;
      lines.push(
        `${label("Batch")} ${colorize(rich, batchColor, batchState)}${muted(batchSuffix)}`,
      );
      if (status.batch.lastError) {
        lines.push(`${label("Batch error")} ${warn(status.batch.lastError)}`);
      }
    }
    if (status.fallback?.reason) {
      lines.push(muted(status.fallback.reason));
    }
    if (indexError) {
      lines.push(`${label("Index error")} ${warn(indexError)}`);
    }
    if (scan?.issues.length) {
      lines.push(label("Issues"));
      for (const issue of scan.issues) {
        lines.push(`  ${warn(issue)}`);
      }
    }
    defaultRuntime.log(lines.join("\n"));
    defaultRuntime.log("");
  }
}

export function registerMemoryCli(program: Command) {
  const memory = program
    .command("memory")
    .description("Memory search tools")
    .addHelpText(
      "after",
      () =>
        `\n${theme.muted("Docs:")} ${formatDocsLink("/cli/memory", "docs.openclaw.ai/cli/memory")}\n`,
    );

  memory
    .command("init-memory-bank")
    .description("Initialize memory_bank/ structure in current workspace")
    .option("--workspace <path>", "Workspace directory (default: current directory)")
    .action(async (opts: { workspace?: string }) => {
      const { initializeMemoryBank } = await import("../memory/memory-bank-updater.js");
      const workspaceDir = opts.workspace || process.cwd();

      try {
        const created = await initializeMemoryBank(workspaceDir);

        if (created) {
          const rich = isRich();
          const success = (text: string) => colorize(rich, theme.success, text);
          const info = (text: string) => colorize(rich, theme.info, text);
          const muted = (text: string) => colorize(rich, theme.muted, text);

          defaultRuntime.log(success("✓") + " Memory bank initialized successfully!");
          defaultRuntime.log("");
          defaultRuntime.log(muted("Created files:"));
          defaultRuntime.log(`  ${info("memory_bank/PROJECT_CONTEXT.md")} - Project overview`);
          defaultRuntime.log(
            `  ${info("memory_bank/PROJECT_STATE.md")} - Session history (auto-updated)`,
          );
          defaultRuntime.log(`  ${info("memory_bank/USER_PREFERENCES.md")} - Your work style`);
          defaultRuntime.log(`  ${info("memory_bank/DECISIONS.md")} - Architectural decisions`);
          defaultRuntime.log(`  ${info("memory_bank/SKILLS.md")} - Reusable patterns`);
          defaultRuntime.log(`  ${info("memory_bank/CURRICULUM.md")} - Learning roadmap`);
          defaultRuntime.log("");
          defaultRuntime.log(muted("Next steps:"));
          defaultRuntime.log(
            `  1. Edit ${info("memory_bank/PROJECT_CONTEXT.md")} to describe your project`,
          );
          defaultRuntime.log(
            `  2. Customize ${info("memory_bank/USER_PREFERENCES.md")} for your preferences`,
          );
          defaultRuntime.log(
            `  3. Start working - Clawtopus will auto-update ${info("PROJECT_STATE.md")}`,
          );
        } else {
          const warn = (text: string) => colorize(isRich(), theme.warn, text);
          defaultRuntime.log(warn("⚠") + " memory_bank/ already exists in this workspace.");
          defaultRuntime.log("");
          defaultRuntime.log("No files were created or modified.");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        defaultRuntime.error(`Failed to initialize memory_bank: ${message}`);
        process.exitCode = 1;
      }
    });

  memory
    .command("status")
    .description("Show memory search index status")
    .option("--agent <id>", "Agent id (default: default agent)")
    .option("--json", "Print JSON")
    .option("--deep", "Probe embedding provider availability")
    .option("--index", "Reindex if dirty (implies --deep)")
    .option("--verbose", "Verbose logging", false)
    .action(async (opts: MemoryCommandOptions & { force?: boolean }) => {
      await runMemoryStatus(opts);
    });

  memory
    .command("index")
    .description("Reindex memory files")
    .option("--agent <id>", "Agent id (default: default agent)")
    .option("--force", "Force full reindex", false)
    .option("--verbose", "Verbose logging", false)
    .action(async (opts: MemoryCommandOptions) => {
      setVerbose(Boolean(opts.verbose));
      const cfg = loadConfig();
      const agentIds = resolveAgentIds(cfg, opts.agent);
      for (const agentId of agentIds) {
        await withManager<MemoryManager>({
          getManager: () => getMemorySearchManager({ cfg, agentId }),
          onMissing: (error) => defaultRuntime.log(error ?? "Memory search disabled."),
          onCloseError: (err) =>
            defaultRuntime.error(`Memory manager close failed: ${formatErrorMessage(err)}`),
          close: async (manager) => {
            await manager.close?.();
          },
          run: async (manager) => {
            try {
              const syncFn = manager.sync ? manager.sync.bind(manager) : undefined;
              if (opts.verbose) {
                const status = manager.status();
                const rich = isRich();
                const heading = (text: string) => colorize(rich, theme.heading, text);
                const muted = (text: string) => colorize(rich, theme.muted, text);
                const info = (text: string) => colorize(rich, theme.info, text);
                const warn = (text: string) => colorize(rich, theme.warn, text);
                const label = (text: string) => muted(`${text}:`);
                const sourceLabels = (status.sources ?? []).map((source) =>
                  formatSourceLabel(source, status.workspaceDir ?? "", agentId),
                );
                const extraPaths = status.workspaceDir
                  ? formatExtraPaths(status.workspaceDir, status.extraPaths ?? [])
                  : [];
                const requestedProvider = status.requestedProvider ?? status.provider;
                const modelLabel = status.model ?? status.provider;
                const lines = [
                  `${heading("Memory Index")} ${muted(`(${agentId})`)}`,
                  `${label("Provider")} ${info(status.provider)} ${muted(
                    `(requested: ${requestedProvider})`,
                  )}`,
                  `${label("Model")} ${info(modelLabel)}`,
                  sourceLabels.length
                    ? `${label("Sources")} ${info(sourceLabels.join(", "))}`
                    : null,
                  extraPaths.length
                    ? `${label("Extra paths")} ${info(extraPaths.join(", "))}`
                    : null,
                ].filter(Boolean) as string[];
                if (status.fallback) {
                  lines.push(`${label("Fallback")} ${warn(status.fallback.from)}`);
                }
                defaultRuntime.log(lines.join("\n"));
                defaultRuntime.log("");
              }
              const startedAt = Date.now();
              let lastLabel = "Indexing memory…";
              let lastCompleted = 0;
              let lastTotal = 0;
              const formatElapsed = () => {
                const elapsedMs = Math.max(0, Date.now() - startedAt);
                const seconds = Math.floor(elapsedMs / 1000);
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
              };
              const formatEta = () => {
                if (lastTotal <= 0 || lastCompleted <= 0) {
                  return null;
                }
                const elapsedMs = Math.max(1, Date.now() - startedAt);
                const rate = lastCompleted / elapsedMs;
                if (!Number.isFinite(rate) || rate <= 0) {
                  return null;
                }
                const remainingMs = Math.max(0, (lastTotal - lastCompleted) / rate);
                const seconds = Math.floor(remainingMs / 1000);
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
              };
              const buildLabel = () => {
                const elapsed = formatElapsed();
                const eta = formatEta();
                return eta
                  ? `${lastLabel} · elapsed ${elapsed} · eta ${eta}`
                  : `${lastLabel} · elapsed ${elapsed}`;
              };
              if (!syncFn) {
                defaultRuntime.log("Memory backend does not support manual reindex.");
                return;
              }
              await withProgressTotals(
                {
                  label: "Indexing memory…",
                  total: 0,
                  fallback: opts.verbose ? "line" : undefined,
                },
                async (update, progress) => {
                  const interval = setInterval(() => {
                    progress.setLabel(buildLabel());
                  }, 1000);
                  try {
                    await syncFn({
                      reason: "cli",
                      force: Boolean(opts.force),
                      progress: (syncUpdate) => {
                        if (syncUpdate.label) {
                          lastLabel = syncUpdate.label;
                        }
                        lastCompleted = syncUpdate.completed;
                        lastTotal = syncUpdate.total;
                        update({
                          completed: syncUpdate.completed,
                          total: syncUpdate.total,
                          label: buildLabel(),
                        });
                        progress.setLabel(buildLabel());
                      },
                    });
                  } finally {
                    clearInterval(interval);
                  }
                },
              );
              defaultRuntime.log(`Memory index updated (${agentId}).`);
            } catch (err) {
              const message = formatErrorMessage(err);
              defaultRuntime.error(`Memory index failed (${agentId}): ${message}`);
              process.exitCode = 1;
            }
          },
        });
      }
    });

  memory
    .command("search")
    .description("Search memory files")
    .argument("<query>", "Search query")
    .option("--agent <id>", "Agent id (default: default agent)")
    .option("--max-results <n>", "Max results", (value: string) => Number(value))
    .option("--min-score <n>", "Minimum score", (value: string) => Number(value))
    .option("--json", "Print JSON")
    .action(
      async (
        query: string,
        opts: MemoryCommandOptions & {
          maxResults?: number;
          minScore?: number;
        },
      ) => {
        const cfg = loadConfig();
        const agentId = resolveAgent(cfg, opts.agent);
        await withManager<MemoryManager>({
          getManager: () => getMemorySearchManager({ cfg, agentId }),
          onMissing: (error) => defaultRuntime.log(error ?? "Memory search disabled."),
          onCloseError: (err) =>
            defaultRuntime.error(`Memory manager close failed: ${formatErrorMessage(err)}`),
          close: async (manager) => {
            await manager.close?.();
          },
          run: async (manager) => {
            let results: Awaited<ReturnType<typeof manager.search>>;
            try {
              results = await manager.search(query, {
                maxResults: opts.maxResults,
                minScore: opts.minScore,
              });
            } catch (err) {
              const message = formatErrorMessage(err);
              defaultRuntime.error(`Memory search failed: ${message}`);
              process.exitCode = 1;
              return;
            }
            if (opts.json) {
              defaultRuntime.log(JSON.stringify({ results }, null, 2));
              return;
            }
            if (results.length === 0) {
              defaultRuntime.log("No matches.");
              return;
            }
            const rich = isRich();
            const lines: string[] = [];
            for (const result of results) {
              lines.push(
                `${colorize(rich, theme.success, result.score.toFixed(3))} ${colorize(
                  rich,
                  theme.accent,
                  `${shortenHomePath(result.path)}:${result.startLine}-${result.endLine}`,
                )}`,
              );
              lines.push(colorize(rich, theme.muted, result.snippet));
              lines.push("");
            }
            defaultRuntime.log(lines.join("\n").trim());
          },
        });
      },
    );

  memory
    .command("brain")
    .description("Session Brain - persistent memory across sessions")
    .addHelpText(
      "after",
      () =>
        "\n" +
        theme.muted("Subcommands:") +
        "\n  status  - Show brain status\n  update  - Update brain from session\n  inject  - Show brain context for injection\n",
    );

  memory
    .command("brain:status")
    .description("Show Session Brain status")
    .option("--json", "Print JSON")
    .action(async (opts: { json?: boolean }) => {
      const brain = loadBrain();
      if (opts.json) {
        defaultRuntime.log(JSON.stringify(brain, null, 2));
        return;
      }
      const rich = isRich();
      const heading = (text: string) => colorize(rich, theme.heading, text);
      const muted = (text: string) => colorize(rich, theme.muted, text);
      const info = (text: string) => colorize(rich, theme.info, text);
      const warn = (text: string) => colorize(rich, theme.warn, text);

      const lines = [
        heading("Session Brain"),
        "",
        muted("Entries:"),
        `  ${info(String(brain.entries.length))} total`,
        "",
      ];

      const byType: Record<string, number> = {
        goal: 0,
        decision: 0,
        progress: 0,
        blocked: 0,
        note: 0,
      };
      for (const entry of brain.entries) {
        byType[entry.type] = (byType[entry.type] || 0) + 1;
      }

      if (byType.goal > 0) {
        lines.push(`  ${muted("Goals:")} ${info(String(byType.goal))}`);
      }
      if (byType.decision > 0) {
        lines.push(`  ${muted("Decisions:")} ${info(String(byType.decision))}`);
      }
      if (byType.progress > 0) {
        lines.push(`  ${muted("Progress:")} ${info(String(byType.progress))}`);
      }
      if (byType.blocked > 0) {
        lines.push(`  ${muted("Blocked:")} ${warn(String(byType.blocked))}`);
      }

      if (brain.currentGoal) {
        lines.push("");
        lines.push(muted("Current Goal:"));
        lines.push(`  ${brain.currentGoal.slice(0, 100)}`);
      }

      if (brain.sessionId) {
        lines.push("");
        lines.push(muted("Last Session:"));
        lines.push(`  ${info(brain.sessionId)}`);
      }

      lines.push("");
      lines.push(muted(`Last Updated: ${new Date(brain.lastUpdated).toLocaleString()}`));

      defaultRuntime.log(lines.join("\n"));
    });

  memory
    .command("brain:update")
    .description("Update brain from session transcript")
    .option("--session <key>", "Session key (e.g., agent:main:1)")
    .action(async (opts: { session?: string }) => {
      const sessionKey = opts.session?.trim();
      if (!sessionKey) {
        defaultRuntime.error(
          "Missing --session <key>. Run 'openclaw sessions' to list active sessions.",
        );
        defaultRuntime.exit(1);
        return;
      }

      try {
        const { loadSessionStore, resolveDefaultSessionStorePath } =
          await import("../config/sessions.js");
        const storePath = resolveDefaultSessionStorePath();
        const store = loadSessionStore(storePath, { skipCache: true });
        const entry = store[sessionKey] as { sessionId?: string; sessionFile?: string } | undefined;

        if (!entry?.sessionId) {
          defaultRuntime.error(`Unknown session key: ${sessionKey}`);
          defaultRuntime.exit(1);
          return;
        }

        const sessionFile = entry.sessionFile || entry.sessionId;
        const stateDir = (await import("../config/paths.js")).resolveStateDir();
        const sessionsDir = stateDir + "/agents/default/sessions";
        const fullPath = sessionFile.includes("/")
          ? sessionFile
          : `${sessionsDir}/${sessionFile}.jsonl`;

        const { updateBrainFromSession } = await import("../agents/session-brain/update.js");
        const result = updateBrainFromSession(entry.sessionId, fullPath);

        defaultRuntime.log(`Brain updated.`);
        defaultRuntime.log(`Entries: ${result.entries.length}`);
        if (result.currentGoal) {
          defaultRuntime.log(`Current goal: ${result.currentGoal.slice(0, 80)}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        defaultRuntime.error(`Failed to update brain: ${message}`);
        defaultRuntime.exit(1);
      }
    });

  memory
    .command("brain:inject")
    .description("Show brain context for injection")
    .action(async () => {
      const { injectBrainContext } = await import("../agents/session-brain/update.js");
      const context = injectBrainContext();
      if (context) {
        defaultRuntime.log(context);
      } else {
        defaultRuntime.log("(No brain context available)");
      }
    });

  memory
    .command("facts")
    .description("Atomic Facts - structured memory from sessions")
    .addHelpText(
      "after",
      () =>
        "\n" +
        theme.muted("Subcommands:") +
        "\n  status  - Show facts count\n  search <query>  - Search facts\n  clear  - Clear all facts\n",
    );

  memory
    .command("facts:status")
    .description("Show atomic facts status")
    .option("--json", "Print JSON")
    .action(async (opts: { json?: boolean }) => {
      const { loadAtomicFacts } = await import("../agents/atomic-facts-store.js");
      const store = loadAtomicFacts();
      if (opts.json) {
        defaultRuntime.log(JSON.stringify(store, null, 2));
        return;
      }
      const rich = isRich();
      const heading = (text: string) => colorize(rich, theme.heading, text);
      const muted = (text: string) => colorize(rich, theme.muted, text);
      const info = (text: string) => colorize(rich, theme.info, text);

      const lines = [
        heading("Atomic Facts"),
        "",
        muted("Total Facts:"),
        `  ${info(String(store.facts.length))}`,
        "",
        muted(`Last Updated: ${new Date(store.lastUpdated).toLocaleString()}`),
      ];

      defaultRuntime.log(lines.join("\n"));
    });

  memory
    .command("facts:search")
    .description("Search atomic facts")
    .argument("<query>", "Search query")
    .option("--limit <n>", "Max results", (v: string) => Number(v), 10)
    .action(async (query: string, opts: { limit?: number }) => {
      const { searchFacts } = await import("../agents/atomic-facts-store.js");
      const { formatFactsAsSummary } = await import("../agents/atomic-facts.js");
      const results = searchFacts(query, opts.limit || 10);
      if (results.length === 0) {
        defaultRuntime.log("No facts found.");
        return;
      }
      defaultRuntime.log(formatFactsAsSummary(results));
    });

  memory
    .command("facts:clear")
    .description("Clear all atomic facts")
    .action(async () => {
      const { clearAtomicFacts } = await import("../agents/atomic-facts-store.js");
      clearAtomicFacts();
      defaultRuntime.log("Atomic facts cleared.");
    });

  const skill = program
    .command("skill")
    .description("Skill Factory - auto-generate and search skills")
    .addHelpText(
      "after",
      () =>
        `\n${theme.muted("Docs:")} ${formatDocsLink("/tools/skills", "docs.openclaw.ai/tools/skills")}\n`,
    );

  skill
    .command("factory")
    .description("Skill Factory - workflow pattern detection")
    .addHelpText(
      "after",
      () =>
        "\n" +
        theme.muted("Subcommands:") +
        "\n  patterns  - List detected patterns\n  propose <pattern>  - Generate skill proposal\n",
    );

  skill
    .command("factory:patterns")
    .description("List detected workflow patterns")
    .option("--json", "Print JSON")
    .action(async (opts: { json?: boolean }) => {
      const { getPatterns } = await import("../agents/skill-factory/store.js");
      const patterns = getPatterns();
      if (opts.json) {
        defaultRuntime.log(JSON.stringify(patterns, null, 2));
        return;
      }
      const rich = isRich();
      const heading = (text: string) => colorize(rich, theme.heading, text);
      const muted = (text: string) => colorize(rich, theme.muted, text);
      const info = (text: string) => colorize(rich, theme.info, text);

      if (patterns.length === 0) {
        defaultRuntime.log("No patterns detected yet.");
        return;
      }

      const lines = [heading("Workflow Patterns"), ""];

      for (const pattern of patterns.slice(0, 10)) {
        lines.push(muted(pattern.name));
        lines.push(`  Tools: ${info(pattern.tools.join(" -> "))}`);
        lines.push(`  Frequency: ${info(String(pattern.frequency))}`);
        lines.push(`  Sessions: ${info(String(pattern.sessions.length))}`);
        lines.push("");
      }

      defaultRuntime.log(lines.join("\n"));
    });

  skill
    .command("search")
    .description("Search skills and patterns")
    .argument("<query>", "Search query")
    .option("--limit <n>", "Max results", (v: string) => Number(v), 5)
    .action(async (query: string, opts: { limit?: number }) => {
      const { searchSkills, formatSearchResults } =
        await import("../agents/skill-factory/retrieval.js");
      const results = searchSkills(query, opts.limit || 5);
      if (results.length === 0) {
        defaultRuntime.log("No skills or patterns found.");
        return;
      }
      defaultRuntime.log(formatSearchResults(results));
    });

  const curriculum = program
    .command("curriculum")
    .description("Curriculum Planner - generate learning roadmaps")
    .addHelpText(
      "after",
      () =>
        "\n" +
        theme.muted("Subcommands:") +
        "\n  plan <target>  - Generate curriculum\n  list  - List saved curriculums\n  show <id>  - Show curriculum details\n",
    );

  curriculum
    .command("plan")
    .description("Generate a learning curriculum")
    .argument("<target>", "Target (e.g., project name or 'onboarding')")
    .option("--workspace <path>", "Workspace directory path")
    .action(async (target: string, opts: { workspace?: string }) => {
      const {
        analyzeCodebaseStructure,
        generateCurriculum,
        saveCurriculum,
        formatCurriculumAsMarkdown,
      } = await import("../agents/curriculum/planner.js");

      let workspaceDir = opts.workspace;
      if (!workspaceDir) {
        const cfg = loadConfig();
        workspaceDir = cfg.agents?.defaults?.workspace || process.cwd();
      }

      const analysis = analyzeCodebaseStructure(workspaceDir);
      const curriculum = generateCurriculum(target, analysis);
      saveCurriculum(curriculum);

      defaultRuntime.log(`Curriculum generated: ${curriculum.id}`);
      defaultRuntime.log("");
      defaultRuntime.log(formatCurriculumAsMarkdown(curriculum));
    });

  curriculum
    .command("list")
    .description("List saved curriculums")
    .action(async () => {
      const { listCurriculums } = await import("../agents/curriculum/planner.js");
      const curriculums = listCurriculums();

      if (curriculums.length === 0) {
        defaultRuntime.log("No curriculums saved.");
        return;
      }

      const rich = isRich();
      const heading = (text: string) => colorize(rich, theme.heading, text);
      const muted = (text: string) => colorize(rich, theme.muted, text);
      const info = (text: string) => colorize(rich, theme.info, text);

      const lines = [heading("Saved Curriculums"), ""];
      for (const c of curriculums) {
        lines.push(muted(c.name));
        lines.push(`  ID: ${info(c.id)}`);
        lines.push(`  Modules: ${info(String(c.modules.length))}`);
        lines.push(`  Updated: ${info(new Date(c.updatedAt).toLocaleString())}`);
        lines.push("");
      }

      defaultRuntime.log(lines.join("\n"));
    });

  curriculum
    .command("show")
    .description("Show curriculum details")
    .argument("<id>", "Curriculum ID")
    .action(async (id: string) => {
      const { loadCurriculum, formatCurriculumAsMarkdown } =
        await import("../agents/curriculum/planner.js");
      const curriculum = loadCurriculum(id);

      if (!curriculum) {
        defaultRuntime.error(`Curriculum not found: ${id}`);
        defaultRuntime.exit(1);
        return;
      }

      defaultRuntime.log(formatCurriculumAsMarkdown(curriculum));
    });
}
