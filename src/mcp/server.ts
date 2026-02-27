/**
 * MCP Server Base Class
 *
 * Base MCP server implementation with protocol handshake support.
 * Handles initialize, tools/list, and tools/call requests.
 */

import type { Transport } from "./transport/base.js";
import {
  type MCPRequest,
  type MCPResponse,
  type MCPNotification,
  type Tool,
  type CallToolRequest,
  type CallToolResult,
  type InitializeRequest,
  type InitializeResult,
  type ListToolsResult,
  type LogLevel,
  type LogMessageNotification,
  MCP_PROTOCOL_VERSION,
  ErrorCode,
  MCPErrorException,
} from "./types.js";

export interface MCPServerOptions {
  name: string;
  version: string;
  capabilities?: {
    tools?: { listChanged?: boolean };
    logging?: Record<string, never>;
  };
}

export type ToolHandler = (args: Record<string, unknown>) => Promise<CallToolResult>;

export class MCPServer {
  private transport?: Transport;
  private tools = new Map<string, { tool: Tool; handler: ToolHandler }>();
  private initialized = false;
  private readonly serverInfo: InitializeResult["serverInfo"];
  private readonly capabilities: InitializeResult["capabilities"];

  constructor(options: MCPServerOptions) {
    this.serverInfo = {
      name: options.name,
      version: options.version,
    };
    this.capabilities = {
      tools: {
        listChanged: options.capabilities?.tools?.listChanged ?? true,
      },
      logging: options.capabilities?.logging ?? {},
    };
  }

  /**
   * Register a tool with the server
   */
  registerTool(tool: Tool, handler: ToolHandler): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, { tool, handler });
  }

  /**
   * Unregister a tool
   */
  unregisterTool(name: string): void {
    this.tools.delete(name);
  }

  /**
   * Connect to a transport and start handling requests
   */
  async connect(transport: Transport): Promise<void> {
    if (this.transport) {
      throw new Error("Server already connected to a transport");
    }

    this.transport = transport;
    this.transport.onMessage((message) => this.handleMessage(message));

    return new Promise((resolve, reject) => {
      this.transport!.on("close", () => {
        this.transport = undefined;
        this.initialized = false;
      });

      this.transport!.on("error", (error) => {
        reject(error);
      });

      // Resolve when transport is ready (for stdio, this is immediate)
      resolve();
    });
  }

  /**
   * Disconnect from the transport
   */
  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = undefined;
      this.initialized = false;
    }
  }

  /**
   * Check if server is connected
   */
  isConnected(): boolean {
    return !!this.transport && !this.transport.isClosed();
  }

  /**
   * Check if server has been initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  private async handleMessage(message: MCPRequest | MCPNotification): Promise<void> {
    // Notifications don't have an id
    if (!("id" in message)) {
      await this.handleNotification(message);
      return;
    }

    const request = message;
    const response: MCPResponse = {
      jsonrpc: "2.0",
      id: request.id,
    };

    try {
      const result = await this.handleRequest(request);
      response.result = result;
    } catch (error) {
      if (error instanceof MCPErrorException) {
        response.error = {
          code: error.code,
          message: error.message,
          data: error.data,
        };
      } else {
        response.error = {
          code: ErrorCode.InternalError,
          message: error instanceof Error ? error.message : String(error),
        };
      }
    }

    await this.transport?.send(response);
  }

  private async handleRequest(request: MCPRequest): Promise<unknown> {
    switch (request.method) {
      case "initialize": {
        const initRequest = request.params as InitializeRequest;
        return this.handleInitialize(initRequest);
      }

      case "initialized": {
        // Client notification that initialization is complete
        return {};
      }

      case "tools/list": {
        if (!this.initialized) {
          throw new MCPErrorException(ErrorCode.ServerNotInitialized, "Server not initialized");
        }
        return this.handleListTools();
      }

      case "tools/call": {
        if (!this.initialized) {
          throw new MCPErrorException(ErrorCode.ServerNotInitialized, "Server not initialized");
        }
        const callRequest = request.params as CallToolRequest;
        return this.handleCallTool(callRequest);
      }

      default:
        throw new MCPErrorException(
          ErrorCode.MethodNotFound,
          `Method not found: ${request.method}`,
        );
    }
  }

  private async handleNotification(notification: MCPNotification): Promise<void> {
    switch (notification.method) {
      case "notifications/cancelled":
        // Handle cancellation if needed
        break;
      default:
        // Unknown notifications are ignored per spec
        break;
    }
  }

  private handleInitialize(request: InitializeRequest): InitializeResult {
    // Validate protocol version
    if (request.protocolVersion !== MCP_PROTOCOL_VERSION) {
      throw new MCPErrorException(
        ErrorCode.InvalidRequest,
        `Unsupported protocol version: ${request.protocolVersion}. Supported: ${MCP_PROTOCOL_VERSION}`,
      );
    }

    this.initialized = true;

    return {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: this.capabilities,
      serverInfo: this.serverInfo,
    };
  }

  private handleListTools(): ListToolsResult {
    return {
      tools: Array.from(this.tools.values()).map((t) => t.tool),
    };
  }

  private async handleCallTool(request: CallToolRequest): Promise<CallToolResult> {
    const toolEntry = this.tools.get(request.name);

    if (!toolEntry) {
      throw new MCPErrorException(ErrorCode.ToolNotFound, `Tool not found: ${request.name}`);
    }

    try {
      return await toolEntry.handler(request.arguments ?? {});
    } catch (error) {
      // Wrap tool execution errors
      return {
        content: [
          {
            type: "text",
            text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Send a log message notification to the client
   */
  async log(level: LogLevel, data: unknown, logger?: string): Promise<void> {
    if (!this.transport) {
      return;
    }

    const notification: MCPNotification = {
      jsonrpc: "2.0",
      method: "notifications/message",
      params: {
        level,
        logger,
        data,
      } as LogMessageNotification,
    };

    await this.transport.send(notification);
  }

  /**
   * Notify client that tools list has changed
   */
  async notifyToolsListChanged(): Promise<void> {
    if (!this.transport || !this.capabilities.tools?.listChanged) {
      return;
    }

    const notification: MCPNotification = {
      jsonrpc: "2.0",
      method: "notifications/tools/list_changed",
    };

    await this.transport.send(notification);
  }
}
