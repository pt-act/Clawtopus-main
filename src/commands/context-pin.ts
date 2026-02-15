import type { RuntimeEnv } from "../runtime.js";
import { info } from "../globals.js";

export type ContextPinOptions = {
  session?: string;
  messageId?: string;
};

function requireSession(opts: ContextPinOptions, runtime: RuntimeEnv): string | null {
  const sessionKey = opts.session?.trim();
  if (!sessionKey) {
    runtime.error("Missing --session <key>. Run 'openclaw sessions' to list active sessions.");
    runtime.exit(1);
    return null;
  }
  return sessionKey;
}

export async function contextPinCommand(
  opts: ContextPinOptions,
  runtime: RuntimeEnv,
): Promise<void> {
  const sessionKey = requireSession(opts, runtime);
  if (!sessionKey) {
    return;
  }
  const messageId = opts.messageId?.trim();
  if (!messageId) {
    runtime.error("Missing --message-id <id> for pinning.");
    runtime.exit(1);
    return;
  }

  runtime.log(info("Pinning is coming soon."));
  runtime.log(info(`Session: ${sessionKey}`));
  runtime.log(info(`Message: ${messageId}`));
}

export async function contextUnpinCommand(
  opts: ContextPinOptions,
  runtime: RuntimeEnv,
): Promise<void> {
  const sessionKey = requireSession(opts, runtime);
  if (!sessionKey) {
    return;
  }
  const messageId = opts.messageId?.trim();
  if (!messageId) {
    runtime.error("Missing --message-id <id> for unpinning.");
    runtime.exit(1);
    return;
  }

  runtime.log(info("Unpinning is coming soon."));
  runtime.log(info(`Session: ${sessionKey}`));
  runtime.log(info(`Message: ${messageId}`));
}
