/**
 * browser.close Tool
 *
 * Close browser context and clean up resources.
 */

import type { Tool, CallToolResult } from "../types.js";
import { closePageViaPlaywright } from "../../browser/pw-ai.js";
import { releaseSession } from "../session/index.js";
import { ErrorCode, MCPErrorException } from "../types.js";

export const name = "browser.close";

export const tool: Tool = {
  name,
  description:
    "Close the browser context or a specific tab/page. " +
    "Releases session resources and performs cleanup.",
  inputSchema: {
    type: "object",
    properties: {
      targetId: {
        type: "string",
        description:
          "Optional target ID (tab) to close. " +
          "If not provided, closes the entire browser context.",
      },
      sessionId: {
        type: "string",
        description: "Optional session ID to release. If provided, the session will be cleaned up.",
      },
      cdpUrl: {
        type: "string",
        description: "Optional CDP WebSocket URL for the browser instance.",
      },
    },
    additionalProperties: false,
  },
};

export interface CloseArgs {
  targetId?: string;
  sessionId?: string;
  cdpUrl?: string;
}

export async function execute(args: Record<string, unknown>): Promise<CallToolResult> {
  const { targetId, sessionId, cdpUrl } = args as unknown as CloseArgs;

  const resolvedCdpUrl = cdpUrl || getDefaultCdpUrl();

  try {
    // Close specific page if targetId is provided
    if (targetId && resolvedCdpUrl) {
      await closePageViaPlaywright({
        cdpUrl: resolvedCdpUrl,
        targetId,
      });

      return {
        content: [
          {
            type: "text",
            text: `Successfully closed tab: ${targetId}`,
          },
        ],
      };
    }

    // Release session if sessionId is provided
    if (sessionId) {
      await releaseSession(sessionId);
      return {
        content: [
          {
            type: "text",
            text: `Successfully released session: ${sessionId}`,
          },
        ],
      };
    }

    // Close entire browser context
    if (resolvedCdpUrl) {
      await closePageViaPlaywright({
        cdpUrl: resolvedCdpUrl,
      });
    }

    return {
      content: [
        {
          type: "text",
          text: "Successfully closed browser context",
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new MCPErrorException(ErrorCode.ToolExecutionError, `Close failed: ${message}`, {
      targetId,
      sessionId,
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
