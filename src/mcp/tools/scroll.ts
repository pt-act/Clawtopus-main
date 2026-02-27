/**
 * browser.scroll Tool
 *
 * Scroll the page in specified direction by pixels.
 */

import type { Tool, CallToolResult } from "../types.js";
import { scrollIntoViewViaPlaywright, getPageForTargetId } from "../../browser/pw-ai.js";
import { ensurePageState } from "../../browser/pw-session.js";
import { ErrorCode, MCPErrorException } from "../types.js";

export const name = "browser.scroll";

export const tool: Tool = {
  name,
  description:
    "Scroll the page or a specific element. " +
    "Can scroll by direction (up, down, left, right) or to a specific element.",
  inputSchema: {
    type: "object",
    properties: {
      direction: {
        type: "string",
        enum: ["up", "down", "left", "right", "top", "bottom"],
        description: "Direction to scroll. Use 'top' or 'bottom' to jump to page edges.",
      },
      pixels: {
        type: "number",
        description: "Number of pixels to scroll. Default is 300.",
        default: 300,
        minimum: 1,
        maximum: 10000,
      },
      ref: {
        type: "string",
        description:
          "Optional element reference (e.g., @e1) or CSS selector to scroll into view. " +
          "If provided, direction and pixels are ignored.",
      },
      cdpUrl: {
        type: "string",
        description: "Optional CDP WebSocket URL for the browser instance.",
      },
      targetId: {
        type: "string",
        description: "Optional target ID (tab) to scroll in.",
      },
    },
    additionalProperties: false,
  },
};

export interface ScrollArgs {
  direction?: "up" | "down" | "left" | "right" | "top" | "bottom";
  pixels?: number;
  ref?: string;
  cdpUrl?: string;
  targetId?: string;
}

export async function execute(args: Record<string, unknown>): Promise<CallToolResult> {
  const { direction = "down", pixels = 300, ref, cdpUrl, targetId } = args as unknown as ScrollArgs;

  const resolvedCdpUrl = cdpUrl || getDefaultCdpUrl();
  if (!resolvedCdpUrl) {
    throw new MCPErrorException(
      ErrorCode.InternalError,
      "No browser CDP URL available. Start a browser instance first.",
    );
  }

  try {
    // If ref is provided, scroll that element into view
    if (ref?.trim()) {
      await scrollIntoViewViaPlaywright({
        cdpUrl: resolvedCdpUrl,
        targetId,
        ref: ref.trim(),
      });

      return {
        content: [
          {
            type: "text",
            text: `Scrolled element into view: ${ref}`,
          },
        ],
      };
    }

    // Otherwise scroll by direction
    const page = await getPageForTargetId({ cdpUrl: resolvedCdpUrl, targetId });
    ensurePageState(page);

    let scrollX = 0;
    let scrollY = 0;

    switch (direction) {
      case "up":
        scrollY = -pixels;
        break;
      case "down":
        scrollY = pixels;
        break;
      case "left":
        scrollX = -pixels;
        break;
      case "right":
        scrollX = pixels;
        break;
      case "top":
        await page.evaluate(() => window.scrollTo(0, 0));
        return {
          content: [
            {
              type: "text",
              text: "Scrolled to top of page",
            },
          ],
        };
      case "bottom":
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        return {
          content: [
            {
              type: "text",
              text: "Scrolled to bottom of page",
            },
          ],
        };
    }

    await page.evaluate(({ x, y }) => window.scrollBy(x, y), { x: scrollX, y: scrollY });

    return {
      content: [
        {
          type: "text",
          text: `Scrolled ${direction} by ${pixels} pixels`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new MCPErrorException(ErrorCode.ToolExecutionError, `Scroll failed: ${message}`, {
      direction,
      pixels,
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
