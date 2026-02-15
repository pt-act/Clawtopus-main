import type { CompactionEvent, TranscriptEvent } from "../sessions/transcript-events.js";

export type BoundaryLoadResult = {
  /** The compaction summary to use as history preamble. */
  compactionSummary: string | null;
  /** Only events after the boundary compaction event. */
  messagesAfterBoundary: TranscriptEvent[];
  /** Total number of compaction events in the transcript. */
  compactionCount: number;
  /** Timestamp of the last compaction event, if any. */
  lastCompactionAt: number | null;
};

export function findLatestCompactionEvent(
  events: TranscriptEvent[],
): { event: CompactionEvent; index: number } | null {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    if (event && typeof event === "object" && (event as { type?: unknown }).type === "compaction") {
      return { event: event as CompactionEvent, index: i };
    }
  }
  return null;
}

export function countCompactionEvents(events: TranscriptEvent[]): number {
  let count = 0;
  for (const event of events) {
    if (event && typeof event === "object" && (event as { type?: unknown }).type === "compaction") {
      count += 1;
    }
  }
  return count;
}

export function loadSessionWithBoundary(events: TranscriptEvent[]): BoundaryLoadResult {
  const compactionCount = countCompactionEvents(events);
  const latest = findLatestCompactionEvent(events);

  if (!latest) {
    return {
      compactionSummary: null,
      messagesAfterBoundary: events,
      compactionCount: 0,
      lastCompactionAt: null,
    };
  }

  const eventsAfterBoundary = events.slice(latest.index + 1);
  const tsRaw = latest.event.timestamp;
  const tsMs =
    typeof tsRaw === "number"
      ? tsRaw
      : (() => {
          const parsed = Date.parse(tsRaw);
          return Number.isFinite(parsed) ? parsed : Date.now();
        })();

  return {
    compactionSummary: latest.event.summary,
    messagesAfterBoundary: eventsAfterBoundary,
    compactionCount,
    lastCompactionAt: tsMs,
  };
}
