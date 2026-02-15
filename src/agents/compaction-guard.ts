export type DegradationRiskLevel = "low" | "medium" | "high" | "critical";

export interface DegradationReport {
  compactionCount: number;
  riskLevel: DegradationRiskLevel;
  /**
   * Rough percentage of information loss across all compactions.
   * This is intentionally a coarse heuristic used for UX only.
   */
  informationLossEstimate: number;
  recommendation: string;
}

const SOFT_LIMIT = 3;
const HARD_LIMIT = 5;

/**
 * Evaluate context degradation risk based on the number of prior
 * compactions for a session.
 *
 * The heuristic is simple by design:
 * - Each compaction is treated as roughly ~10% loss of fine-grained
 *   detail while preserving intent.
 * - Risk levels are bucketed to keep user messaging stable.
 */
export function evaluateDegradation(compactionCount: number): DegradationReport {
  const count = Number.isFinite(compactionCount) ? Math.max(0, Math.floor(compactionCount)) : 0;

  const riskLevel: DegradationRiskLevel =
    count >= HARD_LIMIT ? "critical" : count >= SOFT_LIMIT ? "high" : count >= 2 ? "medium" : "low";

  const informationLossEstimate = Math.min(90, count * 10);

  let recommendation: string;
  if (count >= HARD_LIMIT) {
    recommendation =
      `CRITICAL: ${count} compactions. Context quality is likely significantly degraded.\n` +
      "Strongly recommended:\n" +
      "  1. openclaw context export backup.json\n" +
      "  2. Start a fresh session\n" +
      "  3. openclaw context import backup.json";
  } else if (count >= SOFT_LIMIT) {
    recommendation =
      `Session compacted ${count} times. Quality may be degrading.\n` +
      "Consider exporting, starting a fresh session, and importing the context back in.";
  } else if (count >= 1) {
    recommendation =
      `Session compacted ${count} time${count === 1 ? "" : "s"}. ` +
      "This usually preserves intent but may lose some low-level details.";
  } else {
    recommendation = "Context quality is healthy (no compactions recorded).";
  }

  return {
    compactionCount: count,
    riskLevel,
    informationLossEstimate,
    recommendation,
  };
}

/**
 * Decide whether further automatic compactions should be blocked for a
 * session given the configured maximum.
 */
export function shouldBlockFurtherCompaction(
  compactionCount: number,
  config: { maxAutoCompactions: number },
): boolean {
  const limit = Number.isFinite(config.maxAutoCompactions)
    ? Math.max(0, Math.floor(config.maxAutoCompactions))
    : 0;
  if (limit <= 0) {
    return false;
  }
  const count = Number.isFinite(compactionCount) ? Math.max(0, Math.floor(compactionCount)) : 0;
  return count >= limit;
}

export const __testing = {
  SOFT_LIMIT,
  HARD_LIMIT,
} as const;
