import type { Bot } from "grammy";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deliverReplies } from "./delivery.js";

const loadWebMedia = vi.fn();
const triggerInternalHook = vi.hoisted(() => vi.fn(async () => {}));
const messageHookRunner = vi.hoisted(() => ({
  hasHooks: vi.fn<(name: string) => boolean>(() => false),
  runMessageSending: vi.fn(),
  runMessageSent: vi.fn(),
}));
const baseDeliveryParams = {
  chatId: "123",
  token: "tok",
  replyToMode: "off",
  textLimit: 4000,
} as const;
type DeliverRepliesParams = Parameters<typeof deliverReplies>[0];
type DeliverWithParams = Omit<
  DeliverRepliesParams,
  "chatId" | "token" | "replyToMode" | "textLimit"
> &
  Partial<Pick<DeliverRepliesParams, "replyToMode" | "textLimit">>;
type RuntimeStub = Pick<RuntimeEnv, "error" | "log" | "exit">;

vi.mock("../../web/media.js", () => ({
  loadWebMedia: (...args: unknown[]) => loadWebMedia(...args),
}));

vi.mock("../../plugins/hook-runner-global.js", () => ({
  getGlobalHookRunner: () => messageHookRunner,
}));

vi.mock("../../hooks/internal-hooks.js", async () => {
  const actual = await vi.importActual<typeof import("../../hooks/internal-hooks.js")>(
    "../../hooks/internal-hooks.js",
  );
  return {
    ...actual,
    triggerInternalHook,
  };
});

vi.mock("grammy", () => ({
  InputFile: class {
    constructor(
      public buffer: Buffer,
      public fileName?: string,
    ) {}
  },
  GrammyError: class GrammyError extends Error {
    description = "";
  },
}));

describe("deliverReplies", () => {
  beforeEach(() => {
    loadWebMedia.mockClear();
    triggerInternalHook.mockReset();
    messageHookRunner.hasHooks.mockReset();
    messageHookRunner.hasHooks.mockReturnValue(false);
    messageHookRunner.runMessageSending.mockReset();
    messageHookRunner.runMessageSent.mockReset();
  });

  it("skips audioAsVoice-only payloads without logging an error", async () => {
    const runtime = { error: vi.fn() };
    const bot = { api: {} } as unknown as Bot;

    await deliverReplies({
      replies: [{ audioAsVoice: true }],
      chatId: "123",
      token: "tok",
      runtime,
      bot,
      replyToMode: "off",
      textLimit: 4000,
    });

    expect(runtime.error).not.toHaveBeenCalled();
  });

  it("skips malformed replies and continues with valid entries", async () => {
    const runtime = createRuntime(false);
    const sendMessage = vi.fn().mockResolvedValue({ message_id: 1, chat: { id: "123" } });
    const bot = createBot({ sendMessage });

    await deliverWith({
      replies: [undefined, { text: "hello" }] as unknown as DeliverRepliesParams["replies"],
      runtime,
      bot,
    });

    expect(runtime.error).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage.mock.calls[0]?.[1]).toBe("hello");
  });

  it("reports message_sent success=false when hooks blank out a text-only reply", async () => {
    messageHookRunner.hasHooks.mockImplementation(
      (name: string) => name === "message_sending" || name === "message_sent",
    );
    messageHookRunner.runMessageSending.mockResolvedValue({ content: "" });

    const runtime = createRuntime(false);
    const sendMessage = vi.fn();
    const bot = createBot({ sendMessage });

    await deliverWith({
      replies: [{ text: "hello" }],
      runtime,
      bot,
    });

    expect(sendMessage).not.toHaveBeenCalled();
    expect(messageHookRunner.runMessageSent).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, content: "" }),
      expect.objectContaining({ channelId: "telegram", conversationId: "123" }),
    );
  });

  it("passes accountId into message hooks", async () => {
    messageHookRunner.hasHooks.mockImplementation(
      (name: string) => name === "message_sending" || name === "message_sent",
    );

    const runtime = createRuntime(false);
    const sendMessage = vi.fn().mockResolvedValue({ message_id: 9, chat: { id: "123" } });
    const bot = createBot({ sendMessage });

    await deliverWith({
      accountId: "work",
      replies: [{ text: "hello" }],
      runtime,
      bot,
    });

    expect(messageHookRunner.runMessageSending).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        channelId: "telegram",
        accountId: "work",
        conversationId: "123",
      }),
    );
    expect(messageHookRunner.runMessageSent).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
      expect.objectContaining({
        channelId: "telegram",
        accountId: "work",
        conversationId: "123",
      }),
    );
  });

  it("emits internal message:sent when session hook context is available", async () => {
    const runtime = createRuntime(false);
    const sendMessage = vi.fn().mockResolvedValue({ message_id: 9, chat: { id: "123" } });
    const bot = createBot({ sendMessage });

    await deliverWith({
      sessionKeyForInternalHooks: "agent:test:telegram:123",
      mirrorIsGroup: true,
      mirrorGroupId: "123",
      replies: [{ text: "hello" }],
      runtime,
      bot,
    });

    expect(triggerInternalHook).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "message",
        action: "sent",
        sessionKey: "agent:test:telegram:123",
        context: expect.objectContaining({
          to: "123",
          content: "hello",
          success: true,
          channelId: "telegram",
          conversationId: "123",
          messageId: "9",
          isGroup: true,
          groupId: "123",
        }),
      }),
    );
  });

  it("does not emit internal message:sent without a session key", async () => {
    const runtime = createRuntime(false);
    const sendMessage = vi.fn().mockResolvedValue({ message_id: 11, chat: { id: "123" } });
    const bot = createBot({ sendMessage });

    await deliverWith({
      replies: [{ text: "hello" }],
      runtime,
      bot,
    });

    expect(triggerInternalHook).not.toHaveBeenCalled();
  });

  it("emits internal message:sent with success=false on delivery failure", async () => {
    const runtime = createRuntime(false);
    const sendMessage = vi.fn().mockRejectedValue(new Error("network error"));
    const bot = createBot({ sendMessage });

    await expect(
      deliverWith({
        sessionKeyForInternalHooks: "agent:test:telegram:123",
        replies: [{ text: "hello" }],
        runtime,
        bot,
      }),
    ).rejects.toThrow("network error");

    expect(triggerInternalHook).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "message",
        action: "sent",
        sessionKey: "agent:test:telegram:123",
        context: expect.objectContaining({
          to: "123",
          content: "hello",
          success: false,
          error: "network error",
          channelId: "telegram",
          conversationId: "123",
        }),
      }),
    );
  });

  it("passes media metadata to message_sending hooks", async () => {
    messageHookRunner.hasHooks.mockImplementation((name: string) => name === "message_sending");

    const runtime = createRuntime(false);
    const sendPhoto = vi.fn().mockResolvedValue({ message_id: 2, chat: { id: "123" } });
    const bot = createBot({ sendPhoto });

    mockMediaLoad("photo.jpg", "image/jpeg", "image");

    await deliverWith({
      replies: [{ text: "caption", mediaUrl: "https://example.com/photo.jpg" }],
      runtime,
      bot,
    });

    expect(messageHookRunner.runMessageSending).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "123",
        content: "caption",
        metadata: expect.objectContaining({
          channel: "telegram",
          mediaUrls: ["https://example.com/photo.jpg"],
        }),
      }),
      expect.objectContaining({ channelId: "telegram", conversationId: "123" }),
    );
  });

  it("invokes onVoiceRecording before sending a voice note", async () => {
    const events: string[] = [];
    const runtime = { error: vi.fn() };
    const sendVoice = vi.fn(async () => {
      events.push("sendVoice");
      return { message_id: 1, chat: { id: "123" } };
    });
    const bot = { api: { sendVoice } } as unknown as Bot;
    const onVoiceRecording = vi.fn(async () => {
      events.push("recordVoice");
    });

    loadWebMedia.mockResolvedValueOnce({
      buffer: Buffer.from("voice"),
      contentType: "audio/ogg",
      fileName: "note.ogg",
    });

    await deliverReplies({
      replies: [{ mediaUrl: "https://example.com/note.ogg", audioAsVoice: true }],
      chatId: "123",
      token: "tok",
      runtime,
      bot,
      replyToMode: "off",
      textLimit: 4000,
      onVoiceRecording,
    });

    expect(onVoiceRecording).toHaveBeenCalledTimes(1);
    expect(sendVoice).toHaveBeenCalledTimes(1);
    expect(events).toEqual(["recordVoice", "sendVoice"]);
  });

  it("renders markdown in media captions", async () => {
    const runtime = { error: vi.fn(), log: vi.fn() };
    const sendPhoto = vi.fn().mockResolvedValue({
      message_id: 2,
      chat: { id: "123" },
    });
    const bot = { api: { sendPhoto } } as unknown as Bot;

    loadWebMedia.mockResolvedValueOnce({
      buffer: Buffer.from("image"),
      contentType: "image/jpeg",
      fileName: "photo.jpg",
    });

    await deliverReplies({
      replies: [{ mediaUrl: "https://example.com/photo.jpg", text: "hi **boss**" }],
      chatId: "123",
      token: "tok",
      runtime,
      bot,
      replyToMode: "off",
      textLimit: 4000,
    });

    expect(sendPhoto).toHaveBeenCalledWith(
      "123",
      expect.anything(),
      expect.objectContaining({
        caption: "hi <b>boss</b>",
        parse_mode: "HTML",
      }),
    );
  });

  it("includes link_preview_options when linkPreview is false", async () => {
    const runtime = { error: vi.fn(), log: vi.fn() };
    const sendMessage = vi.fn().mockResolvedValue({
      message_id: 3,
      chat: { id: "123" },
    });
    const bot = { api: { sendMessage } } as unknown as Bot;

    await deliverReplies({
      replies: [{ text: "Check https://example.com" }],
      chatId: "123",
      token: "tok",
      runtime,
      bot,
      replyToMode: "off",
      textLimit: 4000,
      linkPreview: false,
    });

    expect(sendMessage).toHaveBeenCalledWith(
      "123",
      expect.any(String),
      expect.objectContaining({
        link_preview_options: { is_disabled: true },
      }),
    );
  });

  it("keeps message_thread_id=1 when allowed", async () => {
    const runtime = { error: vi.fn(), log: vi.fn() };
    const sendMessage = vi.fn().mockResolvedValue({
      message_id: 4,
      chat: { id: "123" },
    });
    const bot = { api: { sendMessage } } as unknown as Bot;

    await deliverReplies({
      replies: [{ text: "Hello" }],
      chatId: "123",
      token: "tok",
      runtime,
      bot,
      replyToMode: "off",
      textLimit: 4000,
      thread: { id: 1, scope: "dm" },
    });

    expect(sendMessage).toHaveBeenCalledWith(
      "123",
      expect.any(String),
      expect.objectContaining({
        message_thread_id: 1,
      }),
    );
  });

  it("does not include link_preview_options when linkPreview is true", async () => {
    const runtime = { error: vi.fn(), log: vi.fn() };
    const sendMessage = vi.fn().mockResolvedValue({
      message_id: 4,
      chat: { id: "123" },
    });
    const bot = { api: { sendMessage } } as unknown as Bot;

    await deliverReplies({
      replies: [{ text: "Check https://example.com" }],
      chatId: "123",
      token: "tok",
      runtime,
      bot,
      replyToMode: "off",
      textLimit: 4000,
      linkPreview: true,
    });

    expect(sendMessage).toHaveBeenCalledWith(
      "123",
      expect.any(String),
      expect.not.objectContaining({
        link_preview_options: expect.anything(),
      }),
    );
  });

  it("uses reply_to_message_id when quote text is provided", async () => {
    const runtime = { error: vi.fn(), log: vi.fn() };
    const sendMessage = vi.fn().mockResolvedValue({
      message_id: 10,
      chat: { id: "123" },
    });
    const bot = { api: { sendMessage } } as unknown as Bot;

    await deliverReplies({
      replies: [{ text: "Hello there", replyToId: "500" }],
      chatId: "123",
      token: "tok",
      runtime,
      bot,
      replyToMode: "all",
      textLimit: 4000,
      replyQuoteText: "quoted text",
    });

    expect(sendMessage).toHaveBeenCalledWith(
      "123",
      expect.any(String),
      expect.objectContaining({
        reply_to_message_id: 500,
      }),
    );
    expect(sendMessage).toHaveBeenCalledWith(
      "123",
      expect.any(String),
      expect.not.objectContaining({
        reply_parameters: expect.anything(),
      }),
    );
  });

  it("falls back to text when sendVoice fails with VOICE_MESSAGES_FORBIDDEN", async () => {
    const runtime = { error: vi.fn(), log: vi.fn() };
    const sendVoice = vi
      .fn()
      .mockRejectedValue(
        new Error(
          "GrammyError: Call to 'sendVoice' failed! (400: Bad Request: VOICE_MESSAGES_FORBIDDEN)",
        ),
      );
    const sendMessage = vi.fn().mockResolvedValue({
      message_id: 5,
      chat: { id: "123" },
    });
    const bot = { api: { sendVoice, sendMessage } } as unknown as Bot;

    loadWebMedia.mockResolvedValueOnce({
      buffer: Buffer.from("voice"),
      contentType: "audio/ogg",
      fileName: "note.ogg",
    });

    await deliverReplies({
      replies: [
        { mediaUrl: "https://example.com/note.ogg", text: "Hello there", audioAsVoice: true },
      ],
      chatId: "123",
      token: "tok",
      runtime,
      bot,
      replyToMode: "off",
      textLimit: 4000,
    });

    // Voice was attempted but failed
    expect(sendVoice).toHaveBeenCalledTimes(1);
    // Fallback to text succeeded
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
      "123",
      expect.stringContaining("Hello there"),
      expect.any(Object),
    );
  });

  it("rethrows non-VOICE_MESSAGES_FORBIDDEN errors from sendVoice", async () => {
    const runtime = { error: vi.fn(), log: vi.fn() };
    const sendVoice = vi.fn().mockRejectedValue(new Error("Network error"));
    const sendMessage = vi.fn();
    const bot = { api: { sendVoice, sendMessage } } as unknown as Bot;

    loadWebMedia.mockResolvedValueOnce({
      buffer: Buffer.from("voice"),
      contentType: "audio/ogg",
      fileName: "note.ogg",
    });

    await expect(
      deliverReplies({
        replies: [{ mediaUrl: "https://example.com/note.ogg", text: "Hello", audioAsVoice: true }],
        chatId: "123",
        token: "tok",
        runtime,
        bot,
        replyToMode: "off",
        textLimit: 4000,
      }),
    ).rejects.toThrow("Network error");

    expect(sendVoice).toHaveBeenCalledTimes(1);
    // Text fallback should NOT be attempted for other errors
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("rethrows VOICE_MESSAGES_FORBIDDEN when no text fallback is available", async () => {
    const runtime = { error: vi.fn(), log: vi.fn() };
    const sendVoice = vi
      .fn()
      .mockRejectedValue(
        new Error(
          "GrammyError: Call to 'sendVoice' failed! (400: Bad Request: VOICE_MESSAGES_FORBIDDEN)",
        ),
      );
    const sendMessage = vi.fn();
    const bot = { api: { sendVoice, sendMessage } } as unknown as Bot;

    loadWebMedia.mockResolvedValueOnce({
      buffer: Buffer.from("voice"),
      contentType: "audio/ogg",
      fileName: "note.ogg",
    });

    await expect(
      deliverReplies({
        replies: [{ mediaUrl: "https://example.com/note.ogg", audioAsVoice: true }],
        chatId: "123",
        token: "tok",
        runtime,
        bot,
        replyToMode: "off",
        textLimit: 4000,
      }),
    ).rejects.toThrow("VOICE_MESSAGES_FORBIDDEN");

    expect(sendVoice).toHaveBeenCalledTimes(1);
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
