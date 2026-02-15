import { describe, expect, it } from "vitest";
import type { CompactionEvent, TranscriptEvent } from "../sessions/transcript-events.js";
import {
  countCompactionEvents,
  findLatestCompactionEvent,
  loadSessionWithBoundary,
} from "./compaction-boundary.js";

function makeCompactionEvent(overrides: Partial<CompactionEvent> = {}): CompactionEvent {
  return {
    id: overrides.id ?? "compact-1",
    type: "compaction",
    timestamp: overrides.timestamp ?? 1_700_000_000_000,
    summary: overrides.summary ?? "Summary",
    messagesCompacted: overrides.messagesCompacted ?? 10,
    tokensBeforeCompaction: overrides.tokensBeforeCompaction ?? 100_000,
    tokensAfterCompaction: overrides.tokensAfterCompaction ?? 20_000,
    trigger: overrides.trigger ?? "auto",
    layer: overrides.layer ?? "summarize",
    boundaryMessageId: overrides.boundaryMessageId ?? "msg-10",
    customInstruction: overrides.customInstruction,
  };
}

describe("compaction boundary loading", () => {
  it("loads full history when there are no compaction events", () => {
    const events: TranscriptEvent[] = [
      { id: "msg-1", type: "message", role: "user" },
      { id: "msg-2", type: "message", role: "assistant" },
    ];

    const result = loadSessionWithBoundary(events);

    expect(result.compactionSummary).toBeNull();
    expect(result.messagesAfterBoundary).toHaveLength(2);
    expect(result.compactionCount).toBe(0);
    expect(result.lastCompactionAt).toBeNull();
  });

  it("loads only messages after the latest compaction boundary", () => {
    const compact = makeCompactionEvent({
      id: "compact-1",
      summary: "Previous summary",
      boundaryMessageId: "msg-2",
      timestamp: 1_700_000_100_000,
    });
    const events: TranscriptEvent[] = [
      { id: "msg-1", type: "message", role: "user" },
      { id: "msg-2", type: "message", role: "assistant" },
      compact,
      { id: "msg-3", type: "message", role: "user" },
      { id: "msg-4", type: "message", role: "assistant" },
    ];

    const result = loadSessionWithBoundary(events);

    expect(result.compactionSummary).toBe("Previous summary");
    expect(result.messagesAfterBoundary.map((e) => (e as { id?: string }).id)).toEqual([
      "msg-3",
      "msg-4",
    ]);
    expect(result.compactionCount).toBe(1);
    expect(result.lastCompactionAt).toBe(compact.timestamp);
  });

  it("uses only the latest compaction event when multiple exist", () => {
    const first = makeCompactionEvent({ id: "compact-1", summary: "First" });
    const second = makeCompactionEvent({ id: "compact-2", summary: "Second" });
    const events: TranscriptEvent[] = [
      { id: "msg-1", type: "message", role: "user" },
      first,
      { id: "msg-2", type: "message", role: "assistant" },
      second,
      { id: "msg-3", type: "message", role: "user" },
    ];

    const result = loadSessionWithBoundary(events);

    expect(result.compactionSummary).toBe("Second");
    expect(result.messagesAfterBoundary.map((e) => (e as { id?: string }).id)).toEqual(["msg-3"]);
    expect(result.compactionCount).toBe(2);
  });

  it("countCompactionEvents counts only compaction typed events", () => {
    const events: TranscriptEvent[] = [
      { id: "msg-1", type: "message" },
      makeCompactionEvent({ id: "compact-1" }),
      { id: "msg-2", type: "message" },
      makeCompactionEvent({ id: "compact-2" }),
      { id: "tool-1", type: "tool_result" },
    ];

    expect(countCompactionEvents(events)).toBe(2);
  });

  it("prevents exponential context growth by ignoring earlier compaction summaries", () => {
    const makeEventsWithCompactions = (count: number): TranscriptEvent[] => {
      const events: TranscriptEvent[] = [];
      for (let i = 0; i < count; i += 1) {
        events.push({ id: `msg-${i}`, type: "message", role: "user" });
        events.push(
          makeCompactionEvent({
            id: `compact-${i}`,
            summary: `Summary ${i}`,
            boundaryMessageId: `msg-${i}`,
          }),
        );
      }
      // Add a bounded number of recent messages after the last compaction.
      for (let i = 0; i < 10; i += 1) {
        events.push({ id: `recent-${i}`, type: "message", role: "assistant" });
      }
      return events;
    };

    const events = makeEventsWithCompactions(5);
    const result = loadSessionWithBoundary(events);

    // Only the latest compaction summary should be used, and the number of
    // messages after the boundary stays bounded instead of accumulating
    // summaries from earlier compactions.
    expect(result.compactionSummary).toBe("Summary 4");
    expect(result.messagesAfterBoundary.length).toBeLessThanOrEqual(20);
    expect(result.compactionCount).toBe(5);
  });
});
