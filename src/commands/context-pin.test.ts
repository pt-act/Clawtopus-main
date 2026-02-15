import { describe, it, expect, vi } from "vitest";
import { contextPinCommand, contextUnpinCommand } from "./context-pin.js";

const runtime = {
  log: vi.fn(),
  error: vi.fn(),
  exit: vi.fn(),
} as unknown as {
  log: (msg: string) => void;
  error: (msg: string) => void;
  exit: (code: number) => void;
};

describe("context pin commands", () => {
  it("requires session", async () => {
    await contextPinCommand({}, runtime);
    expect(runtime.error).toHaveBeenCalled();
    expect(runtime.exit).toHaveBeenCalledWith(1);
  });

  it("requires message id", async () => {
    await contextUnpinCommand({ session: "agent:main:1" }, runtime);
    expect(runtime.error).toHaveBeenCalled();
    expect(runtime.exit).toHaveBeenCalledWith(1);
  });

  it("prints coming soon message", async () => {
    await contextPinCommand({ session: "agent:main:1", messageId: "m1" }, runtime);
    expect(runtime.log).toHaveBeenCalled();
  });
});
