/**
 * browser.fill Tool
 *
 * Fill input fields with text using selector or @ref.
 */

import type { Tool, CallToolResult } from "../types.js";
import { typeViaPlaywright } from "../../browser/pw-ai.js";
import { ErrorCode, MCPErrorException } from "../types.js";

export const name = "browser.fill";

export const tool: Tool = {
  name,
  description:
    "Fill an input field with text. " +
    "Use a CSS selector or @ref (e.g., @e1) from a snapshot. " +
    "Optionally submit the form after filling.",
  inputSchema: {
    type: "object",
    properties: {
      ref: {
        type: "string",
        description: "Element reference (e.g., @e1) or CSS selector for the input field.",
      },
      value: {
        type: "string",
        description: "Text to fill into the input field.",
      },
      submit: {
        type: "boolean",
        description: "Whether to submit the form after filling (press Enter). Default is false.",
        default: false,
      },
      slowly: {
        type: "boolean",
        description: "Whether to type slowly (human-like). Default is false.",
        default: false,
      },
      timeout: {
        type: "number",
        description: "Timeout in milliseconds. Default is 8000.",
        default: 8000,
        minimum: 500,
        maximum: 60000,
      },
      cdpUrl: {
        type: "string",
        description: "Optional CDP WebSocket URL for the browser instance.",
      },
      targetId: {
        type: "string",
        description: "Optional target ID (tab) to fill in.",
      },
    },
    required: ["ref", "value"],
    additionalProperties: false,
  },
};

export interface FillArgs {
  ref: string;
  value: string;
  submit?: boolean;
  slowly?: boolean;
  timeout?: number;
  cdpUrl?: string;
  targetId?: string;
}

export async function execute(args: Record<string, unknown>): Promise<CallToolResult> {
  const {
    ref,
    value,
    submit = false,
    slowly = false,
    timeout = 8000,
    cdpUrl,
    targetId,
  } = args as unknown as FillArgs;

  if (!ref?.trim()) {
    throw new MCPErrorException(ErrorCode.InvalidParams, "Element reference is required");
  }

  const resolvedCdpUrl = cdpUrl || getDefaultCdpUrl();
  if (!resolvedCdpUrl) {
    throw new MCPErrorException(
      ErrorCode.InternalError,
      "No browser CDP URL available. Start a browser instance first.",
    );
  }

  try {
    await typeViaPlaywright({
      cdpUrl: resolvedCdpUrl,
      targetId,
      ref: ref.trim(),
      text: value,
      submit,
      slowly,
      timeoutMs: timeout,
    });

    return {
      content: [
        {
          type: "text",
          text: `Successfully filled ${ref} with "${value.substring(0, 50)}${value.length > 50 ? "..." : ""}"`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new MCPErrorException(ErrorCode.ToolExecutionError, `Fill failed: ${message}`, {
      ref,
      originalError: message,
    });
  }
}

function getDefaultCdpUrl(): string | undefined {
  const envCdp = process.env.BROWSER_CDP_URL;
  if (envCdp) {
    return envCdp;
  }

  try {
    const { getBrowserControlState } = require("../../browser/control-service.js");
    const state = getBrowserControlState();
    if (state?.resolved?.profiles?.default?.cdpUrl) {
      return state.resolved.profiles.default.cdpUrl;
    }
    const profiles = state?.resolved?.profiles;
    if (profiles) {
      const firstProfile = Object.values(profiles)[0] as { cdpUrl?: string } | undefined;
      if (firstProfile?.cdpUrl) {
        return firstProfile.cdpUrl;
      }
    }
  } catch {
    // Ignore errors
  }

  return undefined;
}
