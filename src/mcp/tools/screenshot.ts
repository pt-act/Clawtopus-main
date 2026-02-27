/**
 * browser.screenshot Tool
 *
 * Capture screenshots with vision optimization, element selection,
 * accessibility tree inclusion, and base64 image output.
 */

import type { Tool, CallToolResult, ImageContent, TextContent } from "../types.js";
import { takeScreenshotViaPlaywright, snapshotRoleViaPlaywright } from "../../browser/pw-ai.js";
import { normalizeBrowserScreenshot } from "../../browser/screenshot.js";
import { loadMcpConfig } from "../config.js";
import { ErrorCode, MCPErrorException } from "../types.js";

export const name = "browser.screenshot";

export const tool: Tool = {
  name,
  description:
    "Take a screenshot of the browser. " +
    "Can capture the full page, current viewport, or a specific element. " +
    "Screenshots are automatically optimized for size and include accessibility context.",
  inputSchema: {
    type: "object",
    properties: {
      selector: {
        type: "string",
        description:
          "CSS selector for a specific element to screenshot. If not provided, captures full page or viewport.",
      },
      fullPage: {
        type: "boolean",
        description:
          "Whether to capture the full scrollable page. Default is false (viewport only).",
        default: false,
      },
      includeAccessibilityTree: {
        type: "boolean",
        description: "Whether to include the accessibility tree in the response. Default is true.",
        default: true,
      },
      maxWidth: {
        type: "number",
        description: "Maximum width in pixels. Images larger than this will be resized.",
      },
      maxHeight: {
        type: "number",
        description: "Maximum height in pixels. Images larger than this will be resized.",
      },
      quality: {
        type: "number",
        description: "JPEG quality (1-100). Default is 85.",
        minimum: 1,
        maximum: 100,
      },
      cdpUrl: {
        type: "string",
        description: "Optional CDP WebSocket URL for the browser instance.",
      },
      targetId: {
        type: "string",
        description: "Optional target ID (tab) to screenshot.",
      },
    },
    additionalProperties: false,
  },
};

export interface ScreenshotArgs {
  selector?: string;
  fullPage?: boolean;
  includeAccessibilityTree?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  cdpUrl?: string;
  targetId?: string;
}

export async function execute(args: Record<string, unknown>): Promise<CallToolResult> {
  const {
    fullPage = false,
    includeAccessibilityTree = true,
    maxWidth,
    maxHeight,
    cdpUrl,
    targetId,
  } = args as unknown as ScreenshotArgs;

  const resolvedCdpUrl = cdpUrl || getDefaultCdpUrl();
  if (!resolvedCdpUrl) {
    throw new MCPErrorException(
      ErrorCode.InternalError,
      "No browser CDP URL available. Start a browser instance first.",
    );
  }

  try {
    // Get config for optimization settings
    const config = loadMcpConfig();
    const screenshotConfig = config.screenshot || {};

    // Calculate optimization parameters
    const maxSide = Math.max(maxWidth || 0, maxHeight || 0) || screenshotConfig.maxWidth || 2000;
    const maxBytes = screenshotConfig.maxBytes || 5 * 1024 * 1024;

    // Take screenshot
    const result = await takeScreenshotViaPlaywright({
      cdpUrl: resolvedCdpUrl,
      targetId,
      fullPage,
    });
    const buffer = result.buffer;

    // Optimize the screenshot
    const optimized = await normalizeBrowserScreenshot(buffer, {
      maxSide,
      maxBytes,
    });

    // Build response content
    const content: (ImageContent | TextContent)[] = [];

    // Add image
    content.push({
      type: "image",
      data: optimized.buffer.toString("base64"),
      mimeType: optimized.contentType || "image/png",
    });

    // Add accessibility tree if requested
    if (includeAccessibilityTree) {
      const accessibilityTree = await snapshotRoleViaPlaywright({
        cdpUrl: resolvedCdpUrl,
        targetId,
        options: {},
      });

      content.push({
        type: "text",
        text: `\n\n## Accessibility Tree\n\n${accessibilityTree.snapshot}\n\n*Interactive elements: ${accessibilityTree.stats.interactive}*`,
      });
    }

    return { content };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new MCPErrorException(ErrorCode.ToolExecutionError, `Screenshot failed: ${message}`, {
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
