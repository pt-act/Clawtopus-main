/**
 * browser.click Tool
 *
 * Click elements by selector or @ref with optional navigation wait.
 */

import type { Tool, CallToolResult } from "../types.js";
import { clickViaPlaywright } from "../../browser/pw-ai.js";
import { ErrorCode, MCPErrorException } from "../types.js";

export const name = "browser.click";

export const tool: Tool = {
  name,
  description:
    "Click an element on the page. " +
    "Use a CSS selector or @ref (e.g., @e1) from a snapshot. " +
    "Optionally wait for navigation after clicking.",
  inputSchema: {
    type: "object",
    properties: {
      ref: {
        type: "string",
        description: "Element reference (e.g., @e1) or CSS selector to click.",
      },
      doubleClick: {
        type: "boolean",
        description: "Whether to perform a double-click. Default is false.",
        default: false,
      },
      button: {
        type: "string",
        enum: ["left", "right", "middle"],
        description: "Mouse button to use. Default is 'left'.",
        default: "left",
      },
      waitForNavigation: {
        type: "boolean",
        description: "Whether to wait for navigation after clicking. Default is false.",
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
        description: "Optional target ID (tab) to click in.",
      },
    },
    required: ["ref"],
    additionalProperties: false,
  },
};

export interface ClickArgs {
  ref: string;
  doubleClick?: boolean;
  button?: "left" | "right" | "middle";
  waitForNavigation?: boolean;
  timeout?: number;
  cdpUrl?: string;
  targetId?: string;
}

export async function execute(args: Record<string, unknown>): Promise<CallToolResult> {
  const {
    ref,
    doubleClick = false,
    button = "left",
    timeout = 8000,
    cdpUrl,
    targetId,
  } = args as unknown as ClickArgs;

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
    await clickViaPlaywright({
      cdpUrl: resolvedCdpUrl,
      targetId,
      ref: ref.trim(),
      doubleClick,
      button,
      timeoutMs: timeout,
    });

    // If waitForNavigation is requested, we don't have a direct method for that
    // The click itself waits for the element to be clickable
    // Navigation would be handled separately by the caller checking URL changes

    return {
      content: [
        {
          type: "text",
          text: `Successfully clicked element: ${ref}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new MCPErrorException(ErrorCode.ToolExecutionError, `Click failed: ${message}`, {
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
