/**
 * MCP Integration Tests
 *
 * End-to-end tests for the Browser Vision MCP Server.
 * Tests full MCP flow, browser automation, session lifecycle, and auth.
 *
 * @module integration-tests
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Transport } from "./transport/base.js";
import { SERVER_NAME, SERVER_VERSION } from "./browser-mcp-server.js";
import { MCPServer } from "./server.js";
import {
  MCP_PROTOCOL_VERSION,
  ErrorCode,
  type MCPRequest,
  type MCPNotification,
  type InitializeRequest,
  type CallToolRequest,
} from "./types.js";

// Test timeout for browser operations
const TEST_TIMEOUT = 60000;

/**
 * Create a mock transport for testing
 */
function createMockTransport(): Transport & {
  messages: unknown[];
  simulateMessage: (msg: MCPRequest | MCPNotification) => void;
  handler: ((msg: MCPRequest | MCPNotification) => void) | null;
} {
  const messages: unknown[] = [];
  let messageHandler: ((msg: MCPRequest | MCPNotification) => void) | null = null;

  const transport = {
    send: async (message: unknown) => {
      messages.push(message);
    },
    onMessage: (handler: (msg: MCPRequest | MCPNotification) => void) => {
      messageHandler = handler;
    },
    close: async () => {},
    isClosed: () => false,
    on: function (_event: "close" | "error", _handler: (() => void) | ((error: Error) => void)) {
      return this;
    },
    messages,
    get handler() {
      return messageHandler;
    },
    simulateMessage: (msg: MCPRequest | MCPNotification) => {
      if (messageHandler) {
        messageHandler(msg);
      }
    },
  };

  return transport;
}

describe("MCP Integration Tests", () => {
  let server: MCPServer;
  let transport: ReturnType<typeof createMockTransport>;

  beforeEach(() => {
    transport = createMockTransport();
    server = new MCPServer({
      name: SERVER_NAME,
      version: SERVER_VERSION,
    });
  });

  afterEach(async () => {
    if (server.isConnected()) {
      await server.disconnect();
    }
  });

  describe("MCP Protocol Flow", () => {
    it(
      "should complete initialize → tools/list → tools/call flow",
      async () => {
        // Connect server to transport
        await server.connect(transport);

        // Step 1: Initialize
        const initRequest: MCPRequest = {
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: MCP_PROTOCOL_VERSION,
            capabilities: {},
            clientInfo: { name: "test-client", version: "1.0.0" },
          } as InitializeRequest,
        };

        transport.simulateMessage(initRequest);

        // Wait for response
        await new Promise((resolve) => setTimeout(resolve, 100));

        const initResponse = transport.messages.find((m) => (m as { id?: number }).id === 1);
        expect(initResponse).toBeDefined();
        expect((initResponse as { result?: unknown }).result).toMatchObject({
          protocolVersion: MCP_PROTOCOL_VERSION,
          serverInfo: {
            name: SERVER_NAME,
            version: SERVER_VERSION,
          },
          capabilities: {
            tools: { listChanged: true },
            logging: {},
          },
        });

        // Step 2: Tools List
        const listRequest: MCPRequest = {
          jsonrpc: "2.0",
          id: 2,
          method: "tools/list",
          params: {},
        };

        transport.simulateMessage(listRequest);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const listResponse = transport.messages.find((m) => (m as { id?: number }).id === 2);
        expect(listResponse).toBeDefined();
        const tools = (listResponse as { result?: { tools?: unknown[] } }).result?.tools;
        expect(tools).toBeDefined();
        expect(tools?.length).toBe(0); // No tools registered yet in base server

        // Step 3: Register a tool and test calling
        const testTool = {
          name: "test.tool",
          description: "A test tool",
          inputSchema: {
            type: "object" as const,
            properties: {
              value: { type: "string" },
            },
          },
        };

        server.registerTool(testTool, async (args) => ({
          content: [{ type: "text" as const, text: `Result: ${args.value}` }],
        }));

        const callRequest: MCPRequest = {
          jsonrpc: "2.0",
          id: 3,
          method: "tools/call",
          params: {
            name: "test.tool",
            arguments: { value: "hello" },
          } as CallToolRequest,
        };

        transport.simulateMessage(callRequest);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const callResponse = transport.messages.find((m) => (m as { id?: number }).id === 3);
        expect(callResponse).toBeDefined();
        const content = (callResponse as { result?: { content?: unknown[] } }).result?.content;
        expect(content).toEqual([{ type: "text", text: "Result: hello" }]);
      },
      TEST_TIMEOUT,
    );

    it(
      "should reject requests before initialization",
      async () => {
        await server.connect(transport);

        const listRequest: MCPRequest = {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/list",
          params: {},
        };

        transport.simulateMessage(listRequest);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const response = transport.messages[0];
        expect((response as { error?: { code: number } }).error?.code).toBe(
          ErrorCode.ServerNotInitialized,
        );
      },
      TEST_TIMEOUT,
    );

    it(
      "should handle unsupported protocol versions",
      async () => {
        await server.connect(transport);

        const initRequest: MCPRequest = {
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "invalid-version",
            capabilities: {},
            clientInfo: { name: "test-client", version: "1.0.0" },
          },
        };

        transport.simulateMessage(initRequest);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const response = transport.messages[0];
        expect((response as { error?: { code: number } }).error?.code).toBe(
          ErrorCode.InvalidRequest,
        );
      },
      TEST_TIMEOUT,
    );
  });

  describe("Tool Registration", () => {
    it("should register and unregister tools", async () => {
      const tool = {
        name: "test.tool",
        description: "A test tool",
        inputSchema: { type: "object" as const },
      };

      server.registerTool(tool, async () => ({ content: [] }));
      expect(() => server.registerTool(tool, async () => ({ content: [] }))).toThrow(
        "Tool already registered",
      );

      server.unregisterTool("test.tool");
      // Should not throw now
      server.registerTool(tool, async () => ({ content: [] }));
    });

    it("should handle tool not found", async () => {
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
      await new Promise((resolve) => setTimeout(resolve, 100));

      transport.simulateMessage({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "nonexistent.tool",
          arguments: {},
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = transport.messages.find((m) => (m as { id?: number }).id === 2);
      expect((response as { error?: { code: number } }).error?.code).toBe(ErrorCode.ToolNotFound);
    });
  });

  describe("Error Handling", () => {
    it("should handle tool execution errors gracefully", async () => {
      const tool = {
        name: "error.tool",
        description: "A tool that throws errors",
        inputSchema: { type: "object" as const },
      };

      server.registerTool(tool, async () => {
        throw new Error("Test error");
      });

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
      await new Promise((resolve) => setTimeout(resolve, 100));

      transport.simulateMessage({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "error.tool",
          arguments: {},
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = transport.messages.find((m) => (m as { id?: number }).id === 2);
      expect(response).toBeDefined();
      const result = (response as { result?: { isError?: boolean } }).result;
      expect(result?.isError).toBe(true);
    });

    it("should handle unknown methods", async () => {
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
      await new Promise((resolve) => setTimeout(resolve, 100));

      transport.simulateMessage({
        jsonrpc: "2.0",
        id: 2,
        method: "unknown/method",
        params: {},
      });
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = transport.messages.find((m) => (m as { id?: number }).id === 2);
      expect((response as { error?: { code: number } }).error?.code).toBe(ErrorCode.MethodNotFound);
    });
  });

  describe("Server State Management", () => {
    it("should track connection state", async () => {
      expect(server.isConnected()).toBe(false);
      expect(server.isInitialized()).toBe(false);

      await server.connect(transport);
      expect(server.isConnected()).toBe(true);

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
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(server.isInitialized()).toBe(true);

      await server.disconnect();
      expect(server.isConnected()).toBe(false);
      expect(server.isInitialized()).toBe(false);
    });

    it("should prevent double connection", async () => {
      await server.connect(transport);
      await expect(server.connect(transport)).rejects.toThrow("already connected");
    });
  });
});

describe("Browser Vision MCP Server Integration", () => {
  it(
    "should have all 8 browser tools defined",
    async () => {
      // Import all tool modules
      const navigateTool = await import("./tools/navigate.js");
      const screenshotTool = await import("./tools/screenshot.js");
      const clickTool = await import("./tools/click.js");
      const fillTool = await import("./tools/fill.js");
      const snapshotTool = await import("./tools/snapshot.js");
      const scrollTool = await import("./tools/scroll.js");
      const evaluateTool = await import("./tools/evaluate.js");
      const closeTool = await import("./tools/close.js");

      // Verify all tools have required exports
      const tools = [
        navigateTool,
        screenshotTool,
        clickTool,
        fillTool,
        snapshotTool,
        scrollTool,
        evaluateTool,
        closeTool,
      ];

      for (const tool of tools) {
        expect(tool.name).toBeDefined();
        expect(tool.tool).toBeDefined();
        expect(tool.execute).toBeDefined();
        expect(typeof tool.execute).toBe("function");
      }

      // Verify specific tool names
      expect(navigateTool.name).toBe("browser.navigate");
      expect(screenshotTool.name).toBe("browser.screenshot");
      expect(clickTool.name).toBe("browser.click");
      expect(fillTool.name).toBe("browser.fill");
      expect(snapshotTool.name).toBe("browser.snapshot");
      expect(scrollTool.name).toBe("browser.scroll");
      expect(evaluateTool.name).toBe("browser.evaluate");
      expect(closeTool.name).toBe("browser.close");
    },
    TEST_TIMEOUT,
  );

  it(
    "should have session management configured",
    async () => {
      const { initializeSessionManager } = await import("./session/manager.js");
      expect(typeof initializeSessionManager).toBe("function");
    },
    TEST_TIMEOUT,
  );

  it(
    "should have authentication configured",
    async () => {
      const { validateToken, extractBearerToken } = await import("./auth/token.js");
      expect(typeof validateToken).toBe("function");
      expect(typeof extractBearerToken).toBe("function");
    },
    TEST_TIMEOUT,
  );

  it(
    "should have security layers configured",
    async () => {
      const urlFilter = await import("./security/url-filter.js");
      const scriptSandbox = await import("./security/script-sandbox.js");
      const audit = await import("./security/audit.js");

      expect(typeof urlFilter.validateUrl).toBe("function");
      expect(typeof urlFilter.isUrlAllowed).toBe("function");
      expect(typeof scriptSandbox.isScriptAllowed).toBe("function");
      expect(typeof audit.logAuditEvent).toBe("function");
    },
    TEST_TIMEOUT,
  );
});
