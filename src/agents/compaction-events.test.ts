import { describe, expect, it } from "vitest";
import { isCompactionEvent, type CompactionEvent } from "../sessions/transcript-events.js";
import {
  createCompactionEvent,
  parseCompactionEvent,
  serializeCompactionEvent,
} from "./compaction-events.js";

function makeSampleEvent(overrides: Partial<CompactionEvent> = {}): CompactionEvent {
  return {
    id: "compact-1",
    type: "compaction",
    timestamp: 1700000000000,
    summary: "Summarized previous context",
    messagesCompacted: 10,
    tokensBeforeCompaction: 100_000,
    tokensAfterCompaction: 20_000,
    trigger: "auto",
    layer: "summarize",
    boundaryMessageId: "msg-10",
    ...overrides,
  };
}

describe("compaction events", () => {
  it("serializes and parses CompactionEvent via JSON", () => {
    const event = makeSampleEvent();

    const line = serializeCompactionEvent(event);
    const parsed = parseCompactionEvent(line);

    expect(parsed).not.toBeNull();
    expect(parsed).toEqual(event);
    expect(isCompactionEvent(parsed)).toBe(true);
  });

  it("parseCompactionEvent returns null for non-compaction records", () => {
    const line = JSON.stringify({ id: "x", type: "message", role: "user" });

    const parsed = parseCompactionEvent(line);

    expect(parsed).toBeNull();
  });

  it("createCompactionEvent fills id and timestamp defaults", () => {
    const before = Date.now();
    const created = createCompactionEvent({
      summary: "Summary",
      messagesCompacted: 5,
      tokensBeforeCompaction: 50_000,
      tokensAfterCompaction: 10_000,
      trigger: "manual",
      layer: "full",
      boundaryMessageId: "msg-5",
    });
    const after = Date.now();

    expect(isCompactionEvent(created)).toBe(true);
    expect(created.id).toMatch(/^compact-/);
    expect(created.timestamp).toBeGreaterThanOrEqual(before);
    expect(created.timestamp).toBeLessThanOrEqual(after);
  });

  it("isCompactionEvent acts as a type guard", () => {
    const event: unknown = makeSampleEvent();
    const other: unknown = { type: "message", role: "user" };

    if (isCompactionEvent(event)) {
      // Within this block TypeScript should narrow to CompactionEvent.
      // Runtime check: required fields exist.
      expect(event.summary).toBe("Summarized previous context");
    } else {
      throw new Error("Expected event to be a CompactionEvent");
    }

    expect(isCompactionEvent(other)).toBe(false);
    expect(isCompactionEvent(null)).toBe(false);
    expect(isCompactionEvent(undefined)).toBe(false);
  });
});
