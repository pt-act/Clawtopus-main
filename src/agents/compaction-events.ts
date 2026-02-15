import { isCompactionEvent, type CompactionEvent } from "../sessions/transcript-events.js";

/**
 * Create a new CompactionEvent with sensible defaults for id and timestamp.
 *
 * This helper is used by compaction runners to append structured
 * compaction metadata to the session transcript.
 */
export function createCompactionEvent(params: {
  id?: string;
  timestamp?: number;
  summary: string;
  messagesCompacted: number;
  tokensBeforeCompaction: number;
  tokensAfterCompaction: number;
  trigger: CompactionEvent["trigger"];
  layer: CompactionEvent["layer"];
  customInstruction?: string;
  boundaryMessageId: string;
}): CompactionEvent {
  const timestamp = typeof params.timestamp === "number" ? params.timestamp : Date.now();
  const id =
    typeof params.id === "string" && params.id.trim() ? params.id.trim() : `compact-${timestamp}`;

  return {
    id,
    type: "compaction",
    timestamp,
    summary: params.summary,
    messagesCompacted: params.messagesCompacted,
    tokensBeforeCompaction: params.tokensBeforeCompaction,
    tokensAfterCompaction: params.tokensAfterCompaction,
    trigger: params.trigger,
    layer: params.layer,
    customInstruction: params.customInstruction,
    boundaryMessageId: params.boundaryMessageId,
  };
}

export function serializeCompactionEvent(event: CompactionEvent): string {
  return JSON.stringify(event);
}

export function parseCompactionEvent(line: string): CompactionEvent | null {
  try {
    const parsed = JSON.parse(line) as unknown;
    return isCompactionEvent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
