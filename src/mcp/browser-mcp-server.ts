/**
 * Browser Vision MCP Server
 *
 * Main entry point for the MCP server that exposes Clawtopus browser automation
 * capabilities via the Model Context Protocol (MCP).
 *
 * This server provides 8 core browser tools:
 * - browser.navigate: Navigate to URLs with validation
 * - browser.screenshot: Capture optimized screenshots for vision models
 * - browser.click: Click elements on the page
 * - browser.fill: Fill input fields
 * - browser.snapshot: Get accessibility tree with element refs
 * - browser.scroll: Scroll the page
 * - browser.evaluate: Execute JavaScript with sandboxing
 * - browser.close: Close browser sessions
 *
 * @module browser-mcp-server
 */

import { validateToken } from "./auth/token.js";
import { loadMcpConfig } from "./config.js";
import { logAuditEvent } from "./security/audit.js";
import { MCPServer } from "./server.js";
import { initializeSessionManager } from "./session/manager.js";
import * as clickTool from "./tools/click.js";
import * as closeTool from "./tools/close.js";
import * as evaluateTool from "./tools/evaluate.js";
import * as fillTool from "./tools/fill.js";
// Import all browser tools
import * as navigateTool from "./tools/navigate.js";
import * as screenshotTool from "./tools/screenshot.js";
import * as scrollTool from "./tools/scroll.js";
import * as snapshotTool from "./tools/snapshot.js";
import { StdioTransport } from "./transport/stdio.js";
import { ErrorCode, MCPErrorException, type CallToolResult } from "./types.js";

export const SERVER_NAME = "clawtopus-browser-mcp";
export const SERVER_VERSION = "1.0.0";

export interface BrowserMCPServerOptions {
  /** Server name */
  name?: string;
  /** Server version */
  version?: string;
  /** Enable authentication */
  auth?: boolean;
  /** Custom auth token (if not using config) */
  authToken?: string;
}

/**
 * Browser Vision MCP Server
 *
 * Exposes browser automation capabilities via MCP protocol.
 */
export class BrowserMCPServer {
  private server: MCPServer;
  private options: BrowserMCPServerOptions;
  private clientId: string | null = null;

  constructor(options: BrowserMCPServerOptions = {}) {
    this.options = {
      name: options.name ?? SERVER_NAME,
      version: options.version ?? SERVER_VERSION,
      auth: options.auth ?? true,
      authToken: options.authToken,
    };

    this.server = new MCPServer({
      name: this.options.name ?? SERVER_NAME,
      version: this.options.version ?? SERVER_VERSION,
      capabilities: {
        tools: { listChanged: true },
        logging: {},
      },
    });

    this.registerTools();
  }

  /**
   * Register all browser tools with the MCP server
   */
  private registerTools(): void {
    // Register all 8 browser tools
    this.server.registerTool(navigateTool.tool, this.wrapHandler(navigateTool.execute));
    this.server.registerTool(screenshotTool.tool, this.wrapHandler(screenshotTool.execute));
    this.server.registerTool(clickTool.tool, this.wrapHandler(clickTool.execute));
    this.server.registerTool(fillTool.tool, this.wrapHandler(fillTool.execute));
    this.server.registerTool(snapshotTool.tool, this.wrapHandler(snapshotTool.execute));
    this.server.registerTool(scrollTool.tool, this.wrapHandler(scrollTool.execute));
    this.server.registerTool(evaluateTool.tool, this.wrapHandler(evaluateTool.execute));
    this.server.registerTool(closeTool.tool, this.wrapHandler(closeTool.execute));
  }

  /**
   * Wrap tool handler with authentication and audit logging
   */
  private wrapHandler(
    handler: (args: Record<string, unknown>) => Promise<CallToolResult>,
  ): (args: Record<string, unknown>) => Promise<CallToolResult> {
    return async (args: Record<string, unknown>): Promise<CallToolResult> => {
      // Check authentication if enabled
      if (this.options.auth) {
        const authResult = await this.authenticate();
        if (!authResult.success) {
          throw new MCPErrorException(
            ErrorCode.AuthorizationError,
            authResult.error ?? "Authentication failed",
          );
        }
        this.clientId = authResult.clientId ?? null;
      }

      // Add client ID to args for session management
      const argsWithClient = {
        ...args,
        _clientId: this.clientId ?? "anonymous",
      };

      // Execute the tool
      const startTime = Date.now();
      try {
        const result = await handler(argsWithClient);

        // Log audit event
        logAuditEvent({
          action: "tool_call",
          tool: handler.name,
          clientId: this.clientId ?? "anonymous",
          success: !result.isError,
          duration: Date.now() - startTime,
        });

        return result;
      } catch (error) {
        // Log failed audit event
        logAuditEvent({
          action: "tool_call",
          tool: handler.name,
          clientId: this.clientId ?? "anonymous",
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
        });

        throw error;
      }
    };
  }

  /**
   * Authenticate the MCP connection
   */
  private async authenticate(): Promise<{
    success: boolean;
    clientId?: string;
    error?: string;
  }> {
    // In stdio transport, authentication is typically done via environment
    // or pre-shared token configuration
    const config = loadMcpConfig();

    // If auth is disabled, allow anonymous access
    if (config.auth?.mode === "none") {
      return { success: true, clientId: "anonymous" };
    }

    // Check for token in environment
    const envToken = process.env.MCP_AUTH_TOKEN;
    if (envToken) {
      const result = await validateToken(envToken);
      return result;
    }

    // Check for custom auth token
    if (this.options.authToken) {
      const result = await validateToken(this.options.authToken);
      return result;
    }

    // If no token required but auth is enabled, use anonymous with restrictions
    if (config.auth?.mode === "token" && !config.auth.token) {
      return {
        success: false,
        error: "Authentication token required. Set MCP_AUTH_TOKEN environment variable.",
      };
    }

    // Default: allow with anonymous client (configured restrictions apply)
    return { success: true, clientId: "anonymous" };
  }

  /**
   * Start the MCP server with stdio transport
   */
  async start(): Promise<void> {
    // Initialize session manager
    initializeSessionManager();

    // Create stdio transport
    const transport = new StdioTransport();

    // Connect server to transport
    await this.server.connect(transport);

    // Log startup
    logAuditEvent({
      action: "server_start",
      clientId: "system",
      success: true,
      metadata: {
        name: this.options.name,
        version: this.options.version,
      },
    });

    // Handle graceful shutdown
    process.on("SIGINT", () => this.stop());
    process.on("SIGTERM", () => this.stop());

    // Keep the process alive
    await new Promise(() => {
      // Server runs until process is terminated
    });
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    logAuditEvent({
      action: "server_stop",
      clientId: "system",
      success: true,
    });

    await this.server.disconnect();
    process.exit(0);
  }

  /**
   * Check if server is connected
   */
  isConnected(): boolean {
    return this.server.isConnected();
  }

  /**
   * Check if server is initialized
   */
  isInitialized(): boolean {
    return this.server.isInitialized();
  }
}

/**
 * Run the browser MCP server
 *
 * This is the main entry point for the CLI command.
 */
export async function runBrowserMCPServer(): Promise<void> {
  const config = loadMcpConfig();

  const server = new BrowserMCPServer({
    name: config.name ?? SERVER_NAME,
    version: config.version ?? SERVER_VERSION,
    auth: config.auth?.mode !== "none",
  });

  await server.start();
}

// If this file is run directly, start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  runBrowserMCPServer().catch((error) => {
    console.error("Fatal error starting MCP server:", error);
    process.exit(1);
  });
}
