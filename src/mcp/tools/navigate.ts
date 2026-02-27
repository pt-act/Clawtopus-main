/**
 * browser.navigate Tool
 *
 * Navigate to URL with waitUntil options, URL validation, and timeout handling.
 */

import type { Tool, CallToolResult } from "../types.js";
import { navigateViaPlaywright } from "../../browser/pw-ai.js";
import { isUrlAllowed, validateUrl } from "../security/index.js";
import { ErrorCode, MCPErrorException } from "../types.js";

export const name = "browser.navigate";

export const tool: Tool = {
  name,
  description:
    "Navigate to a URL in the browser. " +
    "Supports waitUntil options for controlling when navigation is considered complete. " +
    "HTTPS URLs are enforced by default for security.",
  inputSchema: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "The URL to navigate to. Must be a valid URL with HTTPS protocol by default.",
      },
      waitUntil: {
        type: "string",
        enum: ["load", "domcontentloaded", "networkidle"],
        description:
          "When to consider navigation succeeded. " +
          "'load' = navigation is complete when the load event is fired. " +
          "'domcontentloaded' = when the DOMContentLoaded event is fired. " +
          "'networkidle' = when there are no network connections for at least 500ms.",
        default: "load",
      },
      timeout: {
        type: "number",
        description: "Maximum navigation time in milliseconds. Default is 30000 (30 seconds).",
        default: 30000,
        minimum: 1000,
        maximum: 120000,
      },
      cdpUrl: {
        type: "string",
        description: "Optional CDP WebSocket URL for the browser instance.",
      },
      targetId: {
        type: "string",
        description: "Optional target ID (tab) to navigate in.",
      },
    },
    required: ["url"],
    additionalProperties: false,
  },
};

export interface NavigateArgs {
  url: string;
  waitUntil?: "load" | "domcontentloaded" | "networkidle";
  timeout?: number;
  cdpUrl?: string;
  targetId?: string;
}

export async function execute(args: Record<string, unknown>): Promise<CallToolResult> {
  const { url, timeout = 30000, cdpUrl, targetId } = args as unknown as NavigateArgs;

  // Validate URL format and protocol
  const validation = validateUrl(url);
  if (!validation.valid) {
    throw new MCPErrorException(ErrorCode.InvalidParams, `Invalid URL: ${validation.reason}`, {
      url,
    });
  }

  // Check URL against allowlist
  if (!isUrlAllowed(url)) {
    throw new MCPErrorException(
      ErrorCode.AuthorizationError,
      `URL is not in the allowed list: ${url}`,
      { url },
    );
  }

  try {
    // Get CDP URL from config or args
    const resolvedCdpUrl = cdpUrl || getDefaultCdpUrl();
    if (!resolvedCdpUrl) {
      throw new MCPErrorException(
        ErrorCode.InternalError,
        "No browser CDP URL available. Start a browser instance first.",
      );
    }

    const result = await navigateViaPlaywright({
      cdpUrl: resolvedCdpUrl,
      targetId,
      url,
      timeoutMs: timeout,
    });

    return {
      content: [
        {
          type: "text",
          text: `Successfully navigated to: ${result.url}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new MCPErrorException(ErrorCode.ToolExecutionError, `Navigation failed: ${message}`, {
      url,
      originalError: message,
    });
  }
}

function getDefaultCdpUrl(): string | undefined {
  // Try to get from environment or config
  const envCdp = process.env.BROWSER_CDP_URL;
  if (envCdp) {
    return envCdp;
  }

  // Try to get from browser control state
  try {
    const { getBrowserControlState } = require("../../browser/control-service.js");
    const state = getBrowserControlState();
    if (state?.resolved?.profiles?.default?.cdpUrl) {
      return state.resolved.profiles.default.cdpUrl;
    }
  } catch {
    // Ignore errors during dynamic import
  }

  return undefined;
}
