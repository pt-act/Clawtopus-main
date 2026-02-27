/**
 * MCP Types Tests
 *
 * Tests for MCP protocol type definitions.
 */

import { describe, it, expect } from "vitest";
import {
  MCP_PROTOCOL_VERSION,
  ErrorCode,
  MCPErrorException,
  type Tool,
  type JSONSchema,
} from "./types.js";

describe("MCP Types", () => {
  describe("Protocol Version", () => {
    it("should have correct MCP protocol version", () => {
      expect(MCP_PROTOCOL_VERSION).toBe("2024-11-05");
    });
  });

  describe("Error Codes", () => {
    it("should have correct JSON-RPC error codes", () => {
      expect(ErrorCode.ParseError).toBe(-32700);
      expect(ErrorCode.InvalidRequest).toBe(-32600);
      expect(ErrorCode.MethodNotFound).toBe(-32601);
      expect(ErrorCode.InvalidParams).toBe(-32602);
      expect(ErrorCode.InternalError).toBe(-32603);
    });

    it("should have correct MCP-specific error codes", () => {
      expect(ErrorCode.ServerNotInitialized).toBe(-32002);
      expect(ErrorCode.ToolNotFound).toBe(-32005);
      expect(ErrorCode.ToolExecutionError).toBe(-32006);
      expect(ErrorCode.AuthenticationError).toBe(-32008);
      expect(ErrorCode.AuthorizationError).toBe(-32009);
      expect(ErrorCode.RateLimitExceeded).toBe(-32010);
    });
  });

  describe("MCPErrorException", () => {
    it("should create error with code and message", () => {
      const error = new MCPErrorException(ErrorCode.MethodNotFound, "Method not found");

      expect(error.code).toBe(ErrorCode.MethodNotFound);
      expect(error.message).toBe("Method not found");
      expect(error.name).toBe("MCPErrorException");
    });

    it("should create error with optional data", () => {
      const data = { method: "test" };
      const error = new MCPErrorException(ErrorCode.InvalidParams, "Invalid params", data);

      expect(error.data).toEqual(data);
    });
  });

  describe("Tool Schema Validation", () => {
    it("should create valid tool definition", () => {
      const schema: JSONSchema = {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "URL to navigate to",
          },
        },
        required: ["url"],
      };

      const tool: Tool = {
        name: "browser.navigate",
        description: "Navigate to a URL",
        inputSchema: schema,
      };

      expect(tool.name).toBe("browser.navigate");
      expect(tool.inputSchema.type).toBe("object");
      expect(tool.inputSchema.required).toContain("url");
    });
  });

  describe("JSON Serialization", () => {
    it("should serialize and deserialize tool correctly", () => {
      const tool: Tool = {
        name: "test.tool",
        description: "Test tool",
        inputSchema: {
          type: "object",
          properties: {
            value: { type: "string" },
          },
        },
      };

      const json = JSON.stringify(tool);
      const parsed = JSON.parse(json) as Tool;

      expect(parsed.name).toBe(tool.name);
      expect(parsed.description).toBe(tool.description);
      expect(parsed.inputSchema.type).toBe("object");
    });

    it("should serialize error exception correctly", () => {
      const error = new MCPErrorException(ErrorCode.InternalError, "Something went wrong", {
        detail: "test",
      });

      const json = JSON.stringify({
        code: error.code,
        message: error.message,
        data: error.data,
      });

      const parsed = JSON.parse(json);
      expect(parsed.code).toBe(ErrorCode.InternalError);
      expect(parsed.message).toBe("Something went wrong");
      expect(parsed.data).toEqual({ detail: "test" });
    });
  });
});
