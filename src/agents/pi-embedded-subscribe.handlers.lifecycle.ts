import type { AgentEvent } from "@mariozechner/pi-agent-core";
import type { EmbeddedPiSubscribeContext } from "./pi-embedded-subscribe.handlers.types.js";
import { emitAgentEvent } from "../infra/agent-events.js";
import { createInlineCodeState } from "../markdown/code-spans.js";
import {
  buildApiErrorObservationFields,
  buildTextObservationFields,
  sanitizeForConsole,
} from "./pi-embedded-error-observation.js";
import { classifyFailoverReason, formatAssistantErrorText } from "./pi-embedded-helpers.js";
import type { EmbeddedPiSubscribeContext } from "./pi-embedded-subscribe.handlers.types.js";
import { isAssistantMessage } from "./pi-embedded-utils.js";

export {
  handleAutoCompactionEnd,
  handleAutoCompactionStart,
} from "./pi-embedded-subscribe.handlers.compaction.js";

export function handleAgentStart(ctx: EmbeddedPiSubscribeContext) {
  ctx.log.debug(`embedded run agent start: runId=${ctx.params.runId}`);
  emitAgentEvent({
    runId: ctx.params.runId,
    stream: "lifecycle",
    data: {
      phase: "start",
      startedAt: Date.now(),
    },
  });
  void ctx.params.onAgentEvent?.({
    stream: "lifecycle",
    data: { phase: "start" },
  });
}

export function handleAutoCompactionStart(ctx: EmbeddedPiSubscribeContext) {
  ctx.state.compactionInFlight = true;
  ctx.incrementCompactionCount();
  ctx.ensureCompactionPromise();
  ctx.log.debug(`embedded run compaction start: runId=${ctx.params.runId}`);
  emitAgentEvent({
    runId: ctx.params.runId,
    stream: "compaction",
    data: { phase: "start" },
  });
  void ctx.params.onAgentEvent?.({
    stream: "compaction",
    data: { phase: "start" },
  });

  if (isError && lastAssistant) {
    const friendlyError = formatAssistantErrorText(lastAssistant, {
      cfg: ctx.params.config,
      sessionKey: ctx.params.sessionKey,
      provider: lastAssistant.provider,
      model: lastAssistant.model,
    });
    const rawError = lastAssistant.errorMessage?.trim();
    const failoverReason = classifyFailoverReason(rawError ?? "");
    const errorText = (friendlyError || lastAssistant.errorMessage || "LLM request failed.").trim();
    const observedError = buildApiErrorObservationFields(rawError);
    const safeErrorText =
      buildTextObservationFields(errorText).textPreview ?? "LLM request failed.";
    const safeRunId = sanitizeForConsole(ctx.params.runId) ?? "-";
    ctx.log.warn("embedded run agent end", {
      event: "embedded_run_agent_end",
      tags: ["error_handling", "lifecycle", "agent_end", "assistant_error"],
      runId: ctx.params.runId,
      isError: true,
      error: safeErrorText,
      failoverReason,
      provider: lastAssistant.provider,
      model: lastAssistant.model,
      ...observedError,
      consoleMessage: `embedded run agent end: runId=${safeRunId} isError=true error=${safeErrorText}`,
    });
    emitAgentEvent({
      runId: ctx.params.runId,
      stream: "lifecycle",
      data: {
        phase: "error",
        error: safeErrorText,
        endedAt: Date.now(),
      },
    });
    void ctx.params.onAgentEvent?.({
      stream: "lifecycle",
      data: {
        phase: "error",
        error: safeErrorText,
      },
    });
  } else {
    ctx.log.debug(`embedded run agent end: runId=${ctx.params.runId} isError=${isError}`);
    emitAgentEvent({
      runId: ctx.params.runId,
      stream: "lifecycle",
      data: {
        phase: "end",
        endedAt: Date.now(),
      },
    });
    void ctx.params.onAgentEvent?.({
      stream: "lifecycle",
      data: { phase: "end" },
    });
  }
}

export function handleAutoCompactionEnd(
  ctx: EmbeddedPiSubscribeContext,
  evt: AgentEvent & { willRetry?: unknown },
) {
  ctx.state.compactionInFlight = false;
  const willRetry = Boolean(evt.willRetry);
  if (willRetry) {
    ctx.noteCompactionRetry();
    ctx.resetForCompactionRetry();
    ctx.log.debug(`embedded run compaction retry: runId=${ctx.params.runId}`);
  } else {
    ctx.maybeResolveCompactionWait();
  }
  emitAgentEvent({
    runId: ctx.params.runId,
    stream: "compaction",
    data: { phase: "end", willRetry },
  });
  void ctx.params.onAgentEvent?.({
    stream: "compaction",
    data: { phase: "end", willRetry },
  });

  // Run after_compaction plugin hook (fire-and-forget)
  if (!willRetry) {
    const hookRunnerEnd = getGlobalHookRunner();
    if (hookRunnerEnd?.hasHooks("after_compaction")) {
      void hookRunnerEnd
        .runAfterCompaction(
          {
            messageCount: ctx.params.session.messages?.length ?? 0,
            compactedCount: ctx.getCompactionCount(),
          },
          {},
        )
        .catch((err) => {
          ctx.log.warn(`after_compaction hook failed: ${String(err)}`);
        });
    }
  }
}

export function handleAgentEnd(ctx: EmbeddedPiSubscribeContext) {
  ctx.log.debug(`embedded run agent end: runId=${ctx.params.runId}`);
  emitAgentEvent({
    runId: ctx.params.runId,
    stream: "lifecycle",
    data: {
      phase: "end",
      endedAt: Date.now(),
    },
  });
  void ctx.params.onAgentEvent?.({
    stream: "lifecycle",
    data: { phase: "end" },
  });

  if (ctx.params.onBlockReply) {
    if (ctx.blockChunker?.hasBuffered()) {
      ctx.blockChunker.drain({ force: true, emit: ctx.emitBlockChunk });
      ctx.blockChunker.reset();
    } else if (ctx.state.blockBuffer.length > 0) {
      ctx.emitBlockChunk(ctx.state.blockBuffer);
      ctx.state.blockBuffer = "";
    }
  }

  ctx.state.blockState.thinking = false;
  ctx.state.blockState.final = false;
  ctx.state.blockState.inlineCode = createInlineCodeState();

  if (ctx.state.pendingCompactionRetry > 0) {
    ctx.resolveCompactionRetry();
  } else {
    ctx.maybeResolveCompactionWait();
  }
}
