/**
 * MCP Protocol Types
 *
 * TypeScript definitions for Model Context Protocol (MCP) 1.0 specification
 * Reference: https://modelcontextprotocol.io/specification/2024-11-05/
 */

// ============================================================================
// JSON-RPC Base Types
// ============================================================================

export type MCPRequestId = string | number;

export interface MCPRequest {
  jsonrpc: "2.0";
  id: MCPRequestId;
  method: string;
  params?: unknown;
}

export interface MCPResponse {
  jsonrpc: "2.0";
  id: MCPRequestId;
  result?: unknown;
  error?: MCPError;
}

export interface MCPNotification {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
}

// ============================================================================
// Error Handling
// ============================================================================

export enum ErrorCode {
  // Standard JSON-RPC errors
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,

  // MCP-specific errors
  ServerNotInitialized = -32002,
  InvalidRequest2 = -32600,
  RequestTimeout = -32001,
  ResourceNotFound = -32003,
  ResourceAlreadyExists = -32004,
  ToolNotFound = -32005,
  ToolExecutionError = -32006,
  SessionNotFound = -32007,
  AuthenticationError = -32008,
  AuthorizationError = -32009,
  RateLimitExceeded = -32010,
}

export interface MCPError {
  code: ErrorCode;
  message: string;
  data?: unknown;
}

export class MCPErrorException extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "MCPErrorException";
  }
}

// ============================================================================
// MCP Protocol Version
// ============================================================================

export const MCP_PROTOCOL_VERSION = "2024-11-05";

export interface ServerCapabilities {
  tools?: {
    listChanged?: boolean;
  };
  resources?: {
    listChanged?: boolean;
    subscribe?: boolean;
  };
  prompts?: {
    listChanged?: boolean;
  };
  logging?: Record<string, never>;
}

export interface InitializeRequest {
  protocolVersion: string;
  capabilities: ClientCapabilities;
  clientInfo: Implementation;
}

export interface InitializeResult {
  protocolVersion: string;
  capabilities: ServerCapabilities;
  serverInfo: Implementation;
}

export interface ClientCapabilities {
  tools?: {
    listChanged?: boolean;
  };
  resources?: {
    listChanged?: boolean;
    subscribe?: boolean;
  };
  prompts?: {
    listChanged?: boolean;
  };
  logging?: Record<string, never>;
}

export interface Implementation {
  name: string;
  version: string;
}

// ============================================================================
// Tool Definitions
// ============================================================================

export interface Tool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
}

export interface JSONSchema {
  type: "object";
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
  description?: string;
}

export interface ListToolsResult {
  tools: Tool[];
}

export interface CallToolRequest {
  name: string;
  arguments?: Record<string, unknown>;
}

export type ToolContent = TextContent | ImageContent | EmbeddedResource;

export interface TextContent {
  type: "text";
  text: string;
}

export interface ImageContent {
  type: "image";
  data: string; // base64 encoded
  mimeType: string;
}

export interface EmbeddedResource {
  type: "resource";
  resource: ResourceContents;
}

export interface ResourceContents {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string; // base64 encoded
}

export interface CallToolResult {
  content: ToolContent[];
  isError?: boolean;
}

// ============================================================================
// Logging
// ============================================================================

export enum LogLevel {
  Debug = "debug",
  Info = "info",
  Notice = "notice",
  Warning = "warning",
  Error = "error",
  Critical = "critical",
  Alert = "alert",
  Emergency = "emergency",
}

export interface LogMessageNotification {
  level: LogLevel;
  logger?: string;
  data: unknown;
}

// ============================================================================
// Browser Tool Arguments
// ============================================================================

export interface NavigateArgs {
  url: string;
  waitUntil?: "load" | "domcontentloaded" | "networkidle";
  timeout?: number;
  sessionId?: string;
}

export interface ScreenshotArgs {
  selector?: string;
  fullPage?: boolean;
  includeAccessibilityTree?: boolean;
  sessionId?: string;
}

export interface ClickArgs {
  selector: string;
  waitForNavigation?: boolean;
  timeout?: number;
  sessionId?: string;
}

export interface FillArgs {
  selector: string;
  value: string;
  timeout?: number;
  sessionId?: string;
}

export interface SnapshotArgs {
  selector?: string;
  interactiveOnly?: boolean;
  compact?: boolean;
  sessionId?: string;
}

export interface ScrollArgs {
  direction: "up" | "down" | "left" | "right";
  pixels?: number;
  sessionId?: string;
}

export interface EvaluateArgs {
  script: string;
  timeout?: number;
  sessionId?: string;
}

export interface CloseArgs {
  sessionId?: string;
}

// ============================================================================
// Transport Types
// ============================================================================

export interface Transport {
  send(message: MCPResponse | MCPNotification): Promise<void>;
  onMessage(handler: (message: MCPRequest | MCPNotification) => void): void;
  close(): Promise<void>;
  isClosed(): boolean;
}

export interface StdioTransportOptions {
  stdin?: NodeJS.ReadableStream;
  stdout?: NodeJS.WritableStream;
}

export interface SSETransportOptions {
  port?: number;
  host?: string;
}

// ============================================================================
// Session Types
// ============================================================================

export interface BrowserSession {
  id: string;
  name?: string;
  browserContext: unknown; // BrowserContext from Playwright
  lastActivity: Date;
  createdBy: string;
  shared: boolean;
}

export interface SessionManager {
  createSession(options: CreateSessionOptions): Promise<string>;
  getSession(sessionId: string, clientId: string): Promise<BrowserSession>;
  closeSession(sessionId: string): Promise<void>;
  cleanupInactiveSessions(): Promise<void>;
}

export interface CreateSessionOptions {
  name?: string;
  shared?: boolean;
  clientId: string;
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface AuthResult {
  authenticated: boolean;
  clientId?: string;
  permissions?: string[];
  error?: string;
}

export interface TokenPayload {
  sub: string; // client ID
  permissions: string[];
  exp: number;
  iat: number;
}
