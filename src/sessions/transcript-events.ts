export type SessionTranscriptUpdate = {
  sessionFile: string;
};

export type SessionTranscriptListener = (update: SessionTranscriptUpdate) => void;

const SESSION_TRANSCRIPT_LISTENERS = new Set<SessionTranscriptListener>();

export function onSessionTranscriptUpdate(listener: SessionTranscriptListener): () => void {
  SESSION_TRANSCRIPT_LISTENERS.add(listener);
  return () => {
    SESSION_TRANSCRIPT_LISTENERS.delete(listener);
  };
}

export function emitSessionTranscriptUpdate(sessionFile: string): void {
  const trimmed = sessionFile.trim();
  if (!trimmed) {
    return;
  }
  const update = { sessionFile: trimmed };
  for (const listener of SESSION_TRANSCRIPT_LISTENERS) {
    listener(update);
  }
}

// ============================================================================
// Transcript event types
// ============================================================================

export interface CompactionEvent {
  id: string;
  type: "compaction";
  /**
   * Timestamp of the compaction event.
   *
   * Existing transcripts from the Pi runtime may store this as an
   * ISO 8601 string. Newer writers should prefer a millisecond
   * epoch, but readers must accept either.
   */
  timestamp: number | string;
  summary: string;
  messagesCompacted: number;
  tokensBeforeCompaction: number;
  tokensAfterCompaction: number;
  trigger: "manual" | "auto";
  layer: "prune" | "summarize" | "full";
  customInstruction?: string;
  /**
   * Identifier of the last message included in the compaction.
   * Messages after this boundary are preserved verbatim when loading.
   */
  boundaryMessageId: string;
}

export interface PinEvent {
  id: string;
  type: "pin" | "unpin";
  /**
   * Timestamp of the pin event.
   */
  timestamp: number | string;
  messageId: string;
  reason?: string;
}

export function isCompactionEvent(event: unknown): event is CompactionEvent {
  return (
    typeof event === "object" &&
    event !== null &&
    (event as { type?: unknown }).type === "compaction"
  );
}

export function isPinEvent(event: unknown): event is PinEvent {
  return (
    typeof event === "object" &&
    event !== null &&
    ((event as { type?: unknown }).type === "pin" || (event as { type?: unknown }).type === "unpin")
  );
}

/**
 * Generic transcript event union.
 *
 * At this stage only compaction events are modelled explicitly. Other
 * event shapes are represented as a generic record to avoid breaking
 * existing callers while still allowing type-safe handling of
 * CompactionEvent where needed.
 */
export type TranscriptEvent =
  | CompactionEvent
  | PinEvent
  | (Record<string, unknown> & { type?: string });
