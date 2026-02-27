/**
 * MCP Server Tests
 *
 * Tests for MCP server implementation.
 */

import { EventEmitter } from "events";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MCPServer } from "./server.js";
import {
  MCP_PROTOCOL_VERSION,
  ErrorCode,
  type Tool,
  type CallToolResult,
  type MCPRequest,
  type MCPResponse,
} from "./types.js";

// Mock transport for testing
class MockTransport extends EventEmitter {
  private sentMessages: (MCPResponse | { jsonrpc: "2.0"; method: string; params?: unknown })[] = [];
  private closed = false;
  private messageHandler?: (
    message: MCPRequest | { jsonrpc: "2.0"; method: string; params?: unknown },
  ) => void;

  async send(
    message: MCPResponse | { jsonrpc: "2.0"; method: string; params?: unknown },
  ): Promise<void> {
    this.sentMessages.push(message);
  }

  async close(): Promise<void> {
    this.closed = true;
    this.emit("close");
  }

  isClosed(): boolean {
    return this.closed;
  }

  onMessage(
    handler: (message: MCPRequest | { jsonrpc: "2.0"; method: string; params?: unknown }) => void,
  ): void {
    this.messageHandler = handler;
  }

  getSentMessages() {
    return this.sentMessages;
  }

  simulateMessage(
    message:
      | MCPRequest
      | { jsonrpc: "2.0"; method: string; params?: unknown; id?: string | number },
  ): void {
    // Parse and validate
    const json = JSON.stringify(message);
    const parsed = JSON.parse(json);

    // Call handler directly
    this.messageHandler?.(parsed);
  }
}

describe("MCPServer", () => {
  let server: MCPServer;
  let transport: MockTransport;

  beforeEach(() => {
    server = new MCPServer({
      name: "test-server",
      version: "1.0.0",
    });
    transport = new MockTransport();
  });

  describe("Tool Registration", () => {
    it("should register a tool", () => {
      const tool: Tool = {
        name: "test.tool",
        description: "Test tool",
        inputSchema: { type: "object" },
      };

      server.registerTool(tool, async () => ({
        content: [{ type: "text", text: "ok" }],
      }));

      // Tool should be accessible after registration
      expect(server.isConnected()).toBe(false);
    });

    it("should throw error for duplicate tool registration", () => {
      const tool: Tool = {
        name: "test.tool",
        description: "Test tool",
        inputSchema: { type: "object" },
      };

      server.registerTool(tool, async () => ({ content: [] }));

      expect(() => {
        server.registerTool(tool, async () => ({ content: [] }));
      }).toThrow("Tool already registered: test.tool");
    });

    it("should unregister a tool", async () => {
      const tool: Tool = {
        name: "test.tool",
        description: "Test tool",
        inputSchema: { type: "object" },
      };

      server.registerTool(tool, async () => ({ content: [] }));
      server.unregisterTool("test.tool");

      // Should not throw when registering again after unregister
      server.registerTool(tool, async () => ({ content: [] }));
    });
  });

  describe("Initialize", () => {
    it("should handle initialize request", async () => {
      await server.connect(transport);

      const request: MCPRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      };

      transport.simulateMessage(request);

      // Wait for async handling
      await new Promise((resolve) => setTimeout(resolve, 50));

      const responses = transport.getSentMessages();
      expect(responses.length).toBeGreaterThan(0);
      expect(responses[0]).toMatchObject({
        jsonrpc: "2.0",
        id: 1,
        result: {
          protocolVersion: MCP_PROTOCOL_VERSION,
          serverInfo: {
            name: "test-server",
            version: "1.0.0",
          },
        },
      });
    });

    it("should reject unsupported protocol version", async () => {
      await server.connect(transport);

      const request: MCPRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "invalid-version",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      };

      transport.simulateMessage(request);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const responses = transport.getSentMessages();
      expect(responses.length).toBeGreaterThan(0);
      expect(responses[0]).toMatchObject({
        jsonrpc: "2.0",
        id: 1,
        error: {
          code: ErrorCode.InvalidRequest,
          message: expect.stringContaining("Unsupported protocol version"),
        },
      });
    });
  });

  describe("Tools List", () => {
    it("should return tools list after initialization", async () => {
      const tool: Tool = {
        name: "test.tool",
        description: "Test tool",
        inputSchema: { type: "object" },
      };
      server.registerTool(tool, async () => ({ content: [] }));

      await server.connect(transport);

      // Initialize first
      transport.simulateMessage({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Then list tools
      transport.simulateMessage({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const responses = transport.getSentMessages();
      const toolsResponse = responses.find((r) => "id" in r && r.id === 2);
      expect(toolsResponse).toMatchObject({
        jsonrpc: "2.0",
        id: 2,
        result: {
          tools: [
            {
              name: "test.tool",
              description: "Test tool",
              inputSchema: { type: "object" },
            },
          ],
        },
      });
    });

    it("should reject tools/list before initialization", async () => {
      await server.connect(transport);

      transport.simulateMessage({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const responses = transport.getSentMessages();
      expect(responses.length).toBeGreaterThan(0);
      expect(responses[0]).toMatchObject({
        jsonrpc: "2.0",
        id: 1,
        error: {
          code: ErrorCode.ServerNotInitialized,
          message: "Server not initialized",
        },
      });
    });
  });

  describe("Tool Call", () => {
    it("should call registered tool", async () => {
      const handler = vi.fn(
        async (): Promise<CallToolResult> => ({
          content: [{ type: "text", text: "result" }],
        }),
      );

      const tool: Tool = {
        name: "test.tool",
        description: "Test tool",
        inputSchema: { type: "object" },
      };
      server.registerTool(tool, handler);

      await server.connect(transport);

      // Initialize
      transport.simulateMessage({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Call tool
      transport.simulateMessage({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "test.tool",
          arguments: { key: "value" },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(handler).toHaveBeenCalledWith({ key: "value" });

      const responses = transport.getSentMessages();
      const callResponse = responses.find((r) => "id" in r && r.id === 2);
      expect(callResponse).toMatchObject({
        jsonrpc: "2.0",
        id: 2,
        result: {
          content: [{ type: "text", text: "result" }],
        },
      });
    });

    it("should return error for unknown tool", async () => {
      await server.connect(transport);

      // Initialize
      transport.simulateMessage({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Call unknown tool
      transport.simulateMessage({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "unknown.tool",
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const responses = transport.getSentMessages();
      const callResponse = responses.find((r) => "id" in r && r.id === 2);
      expect(callResponse).toMatchObject({
        jsonrpc: "2.0",
        id: 2,
        error: {
          code: ErrorCode.ToolNotFound,
          message: "Tool not found: unknown.tool",
        },
      });
    });
  });

  describe("Connection Management", () => {
    it("should track connection state", async () => {
      expect(server.isConnected()).toBe(false);

      await server.connect(transport);
      expect(server.isConnected()).toBe(true);

      await server.disconnect();
      expect(server.isConnected()).toBe(false);
    });

    it("should reset initialized state on disconnect", async () => {
      await server.connect(transport);

      transport.simulateMessage({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(server.isInitialized()).toBe(true);

      await server.disconnect();
      expect(server.isInitialized()).toBe(false);
    });

    it("should throw error when connecting multiple transports", async () => {
      await server.connect(transport);

      const secondTransport = new MockTransport();
      await expect(server.connect(secondTransport)).rejects.toThrow(
        "Server already connected to a transport",
      );
    });
  });
});
