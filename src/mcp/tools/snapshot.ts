/**
 * browser.snapshot Tool
 *
 * Capture accessibility tree with interactive elements and element refs.
 */

import type { Tool, CallToolResult } from "../types.js";
import { snapshotRoleViaPlaywright } from "../../browser/pw-ai.js";
import { ErrorCode, MCPErrorException } from "../types.js";

export const name = "browser.snapshot";

export const tool: Tool = {
  name,
  description:
    "Capture an accessibility tree snapshot of the current page. " +
    "Shows interactive elements (links, buttons, inputs) with @refs for use with other tools. " +
    "Returns a text representation optimized for AI context.",
  inputSchema: {
    type: "object",
    properties: {
      interactiveOnly: {
        type: "boolean",
        description:
          "Only include interactive elements (links, buttons, inputs). " +
          "Default is false (include all elements).",
        default: false,
      },
      compact: {
        type: "boolean",
        description: "Remove empty nodes to reduce size. Default is true.",
        default: true,
      },
      maxChars: {
        type: "number",
        description: "Maximum characters to return. Default is 8000.",
        default: 8000,
        minimum: 100,
        maximum: 50000,
      },
      cdpUrl: {
        type: "string",
        description: "Optional CDP WebSocket URL for the browser instance.",
      },
      targetId: {
        type: "string",
        description: "Optional target ID (tab) to snapshot.",
      },
    },
    additionalProperties: false,
  },
};

export interface SnapshotArgs {
  interactiveOnly?: boolean;
  compact?: boolean;
  maxChars?: number;
  cdpUrl?: string;
  targetId?: string;
}

export async function execute(args: Record<string, unknown>): Promise<CallToolResult> {
  const {
    interactiveOnly = false,
    compact = true,
    cdpUrl,
    targetId,
  } = args as unknown as SnapshotArgs;

  const resolvedCdpUrl = cdpUrl || getDefaultCdpUrl();
  if (!resolvedCdpUrl) {
    throw new MCPErrorException(
      ErrorCode.InternalError,
      "No browser CDP URL available. Start a browser instance first.",
    );
  }

  try {
    const result = await snapshotRoleViaPlaywright({
      cdpUrl: resolvedCdpUrl,
      targetId,
      refsMode: "role",
      options: {
        interactive: interactiveOnly,
        compact,
      },
    });

    // Format refs as a list for easy reference
    const refsList = Object.entries(result.refs)
      .map(([ref, info]) => {
        const name = info.name ? `"${info.name}"` : "";
        const nth = info.nth !== undefined ? `[${info.nth}]` : "";
        return `- @${ref}: ${info.role}${name ? ` ${name}` : ""}${nth}`;
      })
      .join("\n");

    const content: string[] = [
      "## Page Snapshot",
      "",
      result.snapshot,
      "",
      "## Element References",
      "",
      refsList || "No interactive elements found.",
      "",
      `*Stats: ${result.stats.lines} lines, ${result.stats.chars} chars, ${result.stats.refs} refs, ${result.stats.interactive} interactive*`,
    ];

    return {
      content: [
        {
          type: "text",
          text: content.join("\n"),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new MCPErrorException(ErrorCode.ToolExecutionError, `Snapshot failed: ${message}`, {
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
