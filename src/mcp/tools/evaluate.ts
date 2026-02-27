/**
 * browser.evaluate Tool
 *
 * Evaluate JavaScript in browser context with security sandboxing.
 */

import type { Tool, CallToolResult } from "../types.js";
import { evaluateViaPlaywright } from "../../browser/pw-ai.js";
import { logAuditEvent, isScriptAllowed } from "../security/index.js";
import { ErrorCode, MCPErrorException } from "../types.js";

export const name = "browser.evaluate";

export const tool: Tool = {
  name,
  description:
    "Evaluate JavaScript code in the browser context. " +
    "Code runs in a sandboxed environment with restricted access to dangerous APIs. " +
    "Returns the result of the evaluation.",
  inputSchema: {
    type: "object",
    properties: {
      script: {
        type: "string",
        description: "JavaScript code to evaluate. Can be an expression or a function.",
      },
      ref: {
        type: "string",
        description:
          "Optional element reference (e.g., @e1) or CSS selector. " +
          "If provided, the script receives the element as 'el'.",
      },
      args: {
        type: "array",
        description: "Optional arguments to pass to the script.",
        items: { type: "object" },
      },
      timeout: {
        type: "number",
        description: "Timeout in milliseconds. Default is 20000 (20 seconds).",
        default: 20000,
        minimum: 1000,
        maximum: 120000,
      },
      cdpUrl: {
        type: "string",
        description: "Optional CDP WebSocket URL for the browser instance.",
      },
      targetId: {
        type: "string",
        description: "Optional target ID (tab) to evaluate in.",
      },
    },
    required: ["script"],
    additionalProperties: false,
  },
};

export interface EvaluateArgs {
  script: string;
  ref?: string;
  args?: unknown[];
  timeout?: number;
  cdpUrl?: string;
  targetId?: string;
}

export async function execute(args: Record<string, unknown>): Promise<CallToolResult> {
  const { script, ref, timeout = 20000, cdpUrl, targetId } = args as unknown as EvaluateArgs;

  if (!script?.trim()) {
    throw new MCPErrorException(ErrorCode.InvalidParams, "Script is required");
  }

  // Security check
  if (!isScriptAllowed(script)) {
    await logAuditEvent({
      action: "evaluate_blocked",
      reason: "dangerous_pattern",
      scriptPreview: script.slice(0, 100),
    });
    throw new MCPErrorException(
      ErrorCode.AuthorizationError,
      "Script contains blocked patterns. " +
        "Dangerous operations like eval(), Function(), XMLHttpRequest, fetch, " +
        "WebSocket, and storage access are not allowed.",
    );
  }

  const resolvedCdpUrl = cdpUrl || getDefaultCdpUrl();
  if (!resolvedCdpUrl) {
    throw new MCPErrorException(
      ErrorCode.InternalError,
      "No browser CDP URL available. Start a browser instance first.",
    );
  }

  try {
    const result = await evaluateViaPlaywright({
      cdpUrl: resolvedCdpUrl,
      targetId,
      fn: script,
      ref,
      timeoutMs: timeout,
    });

    // Log successful evaluation
    await logAuditEvent({
      action: "evaluate_success",
      hasRef: !!ref,
      scriptLength: script.length,
    });

    // Format result
    let resultText: string;
    if (result === null) {
      resultText = "null";
    } else if (result === undefined) {
      resultText = "undefined";
    } else if (typeof result === "object") {
      try {
        resultText = JSON.stringify(result, null, 2);
      } catch {
        resultText = String(result);
      }
    } else {
      resultText = String(result);
    }

    return {
      content: [
        {
          type: "text",
          text: `## Evaluation Result\n\n${resultText}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await logAuditEvent({
      action: "evaluate_error",
      error: message,
      scriptLength: script.length,
    });
    throw new MCPErrorException(ErrorCode.ToolExecutionError, `Evaluation failed: ${message}`, {
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
