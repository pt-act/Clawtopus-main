/**
 * MCP Module Exports
 *
 * Model Context Protocol server implementation for Clawtopus.
 */

// Types
export {
  // Base types
  MCP_PROTOCOL_VERSION,
  ErrorCode,
  MCPErrorException,

  // Request/Response types
  type MCPRequest,
  type MCPResponse,
  type MCPNotification,
  type MCPRequestId,
  type MCPError,

  // Tool types
  type Tool,
  type JSONSchema,
  type CallToolRequest,
  type CallToolResult,
  type ToolContent,
  type TextContent,
  type ImageContent,
  type EmbeddedResource,
  type ResourceContents,
  type ListToolsResult,

  // Initialization types
  type InitializeRequest,
  type InitializeResult,
  type ClientCapabilities,
  type ServerCapabilities,
  type Implementation,

  // Logging
  LogLevel,
  type LogMessageNotification,

  // Browser tool args
  type NavigateArgs,
  type ScreenshotArgs,
  type ClickArgs,
  type FillArgs,
  type SnapshotArgs,
  type ScrollArgs,
  type EvaluateArgs,
  type CloseArgs,

  // Transport types
  type Transport,
  type StdioTransportOptions,

  // Session types
  type BrowserSession,
  type SessionManager,
  type CreateSessionOptions,

  // Auth types
  type AuthResult,
  type TokenPayload,
} from "./types.js";

// Transport
export { BaseTransport, type Transport as TransportInterface } from "./transport/base.js";
export { StdioTransport } from "./transport/stdio.js";

// Server
export { MCPServer, type MCPServerOptions, type ToolHandler } from "./server.js";
export {
  BrowserMCPServer,
  runBrowserMCPServer,
  SERVER_NAME,
  SERVER_VERSION,
  type BrowserMCPServerOptions,
} from "./browser-mcp-server.js";
