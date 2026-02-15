import type { AgentCompactionConfig } from "../config/types.agent-defaults.js";
import type { OpenClawConfig } from "../config/types.js";

export type ResolvedCompactionConfig = Required<AgentCompactionConfig> & {
  memoryFlush: Required<NonNullable<AgentCompactionConfig["memoryFlush"]>>;
  auto: boolean;
};

const DEFAULT_COMPACTION_CONFIG: ResolvedCompactionConfig = {
  mode: "safeguard",
  auto: true,
  reserveTokensFloor: 8000,
  maxHistoryShare: 0.5,
  memoryFlush: {
    enabled: true,
    softThresholdTokens: 12000,
    prompt:
      "Before compacting the session, capture any critical context, decisions, and TODOs. " +
      "Write concise bullet points only.",
    systemPrompt:
      "You are preparing context compaction. Summarize facts, decisions, and TODOs succinctly.",
  },
  maxAutoCompactions: 5,
  warnAtCompaction: 3,
};

export function resolveCompactionConfig(
  config: OpenClawConfig,
  overrides?: Partial<AgentCompactionConfig>,
): ResolvedCompactionConfig {
  const defaults = config.agents?.defaults?.compaction ?? {};
  const merged: AgentCompactionConfig = {
    ...DEFAULT_COMPACTION_CONFIG,
    ...defaults,
    ...overrides,
    memoryFlush: {
      ...DEFAULT_COMPACTION_CONFIG.memoryFlush,
      ...(defaults.memoryFlush ?? {}),
      ...(overrides?.memoryFlush ?? {}),
    },
  };

  return {
    mode: merged.mode ?? DEFAULT_COMPACTION_CONFIG.mode,
    auto: merged.auto ?? DEFAULT_COMPACTION_CONFIG.auto,
    reserveTokensFloor: merged.reserveTokensFloor ?? DEFAULT_COMPACTION_CONFIG.reserveTokensFloor,
    maxHistoryShare: merged.maxHistoryShare ?? DEFAULT_COMPACTION_CONFIG.maxHistoryShare,
    memoryFlush: {
      enabled: merged.memoryFlush?.enabled ?? DEFAULT_COMPACTION_CONFIG.memoryFlush.enabled,
      softThresholdTokens:
        merged.memoryFlush?.softThresholdTokens ??
        DEFAULT_COMPACTION_CONFIG.memoryFlush.softThresholdTokens,
      prompt: merged.memoryFlush?.prompt ?? DEFAULT_COMPACTION_CONFIG.memoryFlush.prompt,
      systemPrompt:
        merged.memoryFlush?.systemPrompt ?? DEFAULT_COMPACTION_CONFIG.memoryFlush.systemPrompt,
    },
    maxAutoCompactions: merged.maxAutoCompactions ?? DEFAULT_COMPACTION_CONFIG.maxAutoCompactions,
    warnAtCompaction: merged.warnAtCompaction ?? DEFAULT_COMPACTION_CONFIG.warnAtCompaction,
  };
}

export const __testing = {
  DEFAULT_COMPACTION_CONFIG,
};
