export type CompactionLayerId = "prune" | "summarize" | "full";

export type CompactionLayer = {
  id: CompactionLayerId;
  /** Percent of context usage to trigger this layer. */
  thresholdPercent: number;
  /** If true, require oversized tool output signal for prune layer. */
  requireOversizedToolOutput?: boolean;
  /** Description for logging/diagnostics. */
  description?: string;
};

export type CompactionLayerConfig = {
  layers: CompactionLayer[];
};

export const DEFAULT_COMPACTION_LAYERS: CompactionLayer[] = [
  {
    id: "prune",
    thresholdPercent: 80,
    requireOversizedToolOutput: true,
    description: "Prune tool output-heavy history when context is ~80% full.",
  },
  {
    id: "summarize",
    thresholdPercent: 88,
    description: "Summarize older context when usage exceeds 88%.",
  },
  {
    id: "full",
    thresholdPercent: 95,
    description: "Aggressive compaction when usage exceeds 95%.",
  },
];

export type CompactionLayerSelectionInput = {
  usagePercent: number;
  hasOversizedToolOutput: boolean;
};

export function selectCompactionLayer(
  input: CompactionLayerSelectionInput,
  layers: CompactionLayer[] = DEFAULT_COMPACTION_LAYERS,
): CompactionLayer | null {
  const sorted = [...layers].sort((a, b) => b.thresholdPercent - a.thresholdPercent);
  for (const layer of sorted) {
    if (input.usagePercent < layer.thresholdPercent) {
      continue;
    }
    if (layer.requireOversizedToolOutput && !input.hasOversizedToolOutput) {
      continue;
    }
    return layer;
  }
  return null;
}
