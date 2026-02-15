import { afterEach, describe, expect, it, vi } from "vitest";

const incrementRunCompactionCount = vi.fn(async () => 4);
const persistRunSessionUsage = vi.fn(async () => undefined);

vi.mock("./session-run-accounting.js", () => ({
  incrementRunCompactionCount,
  persistRunSessionUsage,
}));

vi.mock("./agent-runner-execution.js", () => ({
  runAgentTurnWithFallback: vi.fn(async () => ({
    kind: "success",
    runResult: {
      payloads: [{ text: "Main reply" }],
      meta: {
        agentMeta: {
          model: "gpt-test",
          provider: "openai",
          lastCallUsage: { total: 1000 },
        },
        systemPromptReport: undefined,
      },
    },
    fallbackProvider: "openai",
    fallbackModel: "gpt-test",
    didLogHeartbeatStrip: false,
    autoCompactionCompleted: true,
    directlySentBlockKeys: undefined,
  })),
}));

vi.mock("./agent-runner-memory.js", () => ({
  runMemoryFlushIfNeeded: vi.fn(async ({ sessionEntry }) => sessionEntry),
}));

vi.mock("./block-streaming.js", () => ({
  resolveBlockStreamingCoalescing: () => undefined,
}));

vi.mock("./block-reply-pipeline.js", () => ({
  createBlockReplyPipeline: () => null,
  createAudioAsVoiceBuffer: () => undefined,
}));

vi.mock("./followup-runner.js", () => ({
  createFollowupRunner: () => async () => undefined,
}));

vi.mock("./queue.js", () => ({
  enqueueFollowupRun: vi.fn(),
}));

vi.mock("./reply-threading.js", () => ({
  resolveReplyToMode: () => "off",
  createReplyToModeFilterForChannel: () => (payload: unknown) => payload,
}));

vi.mock("./typing-mode.js", () => ({
  createTypingSignaler: () => ({
    signalRunStart: vi.fn(async () => undefined),
    signalTextDelta: vi.fn(async () => undefined),
    signalReasoningDelta: vi.fn(async () => undefined),
    signalMessageStart: vi.fn(async () => undefined),
    signalToolStart: vi.fn(async () => undefined),
    shouldStartOnReasoning: false,
  }),
}));

vi.mock("../../agents/context.js", () => ({
  lookupContextTokens: () => 100_000,
}));

vi.mock("../../agents/defaults.js", () => ({
  DEFAULT_CONTEXT_TOKENS: 100_000,
}));

vi.mock("../../agents/model-selection.js", () => ({
  isCliProvider: () => false,
}));

vi.mock("../../agents/model-auth.js", () => ({
  resolveModelAuthMode: () => "api-key",
}));

vi.mock("../../agents/usage.js", () => ({
  hasNonzeroUsage: () => false,
}));

vi.mock("../../infra/diagnostic-events.js", () => ({
  emitDiagnosticEvent: vi.fn(),
  isDiagnosticsEnabled: () => false,
}));

vi.mock("../../utils/usage-format.js", () => ({
  estimateUsageCost: () => 0,
  resolveModelCostConfig: () => undefined,
}));

vi.mock("./agent-runner-utils.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./agent-runner-utils.js")>();
  return {
    ...actual,
    appendUsageLine: (payloads: unknown) => payloads,
    formatResponseUsageLine: () => "",
  };
});

vi.mock("./agent-runner-payloads.js", () => ({
  buildReplyPayloads: ({ payloads }: { payloads: Array<{ text?: string }> }) => ({
    replyPayloads: payloads,
    didLogHeartbeatStrip: false,
  }),
}));

vi.mock("./agent-runner-helpers.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./agent-runner-helpers.js")>();
  return {
    ...actual,
    createShouldEmitToolOutput: () => () => false,
    createShouldEmitToolResult: () => () => false,
    finalizeWithFollowup: (payload: unknown) => payload,
    isAudioPayload: () => false,
    signalTypingIfNeeded: vi.fn(async () => undefined),
  };
});

vi.mock("../../agents/pi-embedded.js", () => ({
  queueEmbeddedPiMessage: () => false,
}));

vi.mock("../../config/sessions.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../config/sessions.js")>();
  return {
    ...actual,
    updateSessionStore: vi.fn(async () => undefined),
    updateSessionStoreEntry: vi.fn(async () => undefined),
  };
});

vi.mock("../../runtime.js", () => ({
  defaultRuntime: {
    error: vi.fn(),
  },
}));

describe("runReplyAgent compaction warnings", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("prepends warning when compaction count is high", async () => {
    const { runReplyAgent } = await import("./agent-runner.js");

    const payload = await runReplyAgent({
      commandBody: "hello",
      followupRun: {
        run: {
          sessionId: "session-1",
          sessionKey: "agent:main:demo",
          sessionFile: "/tmp/session-1.jsonl",
          workspaceDir: "/tmp",
          config: {},
          provider: "openai",
          model: "gpt-test",
          agentDir: "/tmp",
          thinkLevel: "off",
          verboseLevel: "off",
          reasoningLevel: "off",
          timeoutMs: 10_000,
        },
        prompt: "hello",
      },
      queueKey: "queue",
      resolvedQueue: { mode: "normal", throttleMs: 0 },
      shouldSteer: false,
      shouldFollowup: false,
      isActive: false,
      isStreaming: false,
      typing: { cleanup: vi.fn(), markRunComplete: vi.fn() },
      sessionEntry: { compactionCount: 3, sessionId: "session-1" },
      sessionStore: { "agent:main:demo": { sessionId: "session-1", compactionCount: 3 } },
      sessionKey: "agent:main:demo",
      storePath: "/tmp/sessions.json",
      defaultModel: "gpt-test",
      resolvedVerboseLevel: "off",
      isNewSession: false,
      blockStreamingEnabled: false,
      resolvedBlockStreamingBreak: "message_end",
      sessionCtx: {},
      shouldInjectGroupIntro: false,
      typingMode: "off",
    });

    const payloads = Array.isArray(payload) ? payload : [payload];
    expect(payloads[0]?.text).toContain("Context quality may be degrading");
  });
});
