/**
 * Stdio Transport Tests
 *
 * Tests for MCP stdio transport implementation.
 */

import { Readable, Writable } from "stream";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { type MCPRequest, type MCPResponse } from "../types.js";
import { StdioTransport } from "./stdio.js";

describe("StdioTransport", () => {
  let mockStdin: Readable;
  let mockStdout: Writable;

  beforeEach(() => {
    mockStdin = new Readable({
      read() {
        // No-op
      },
    });

    mockStdout = new Writable({
      write(_chunk: unknown, _encoding: unknown, callback: () => void) {
        callback();
      },
    });
  });

  describe("Message Sending", () => {
    it("should send message with newline delimiter", async () => {
      const writeSpy = vi.spyOn(mockStdout, "write");
      const transport = new StdioTransport({
        stdin: mockStdin,
        stdout: mockStdout,
      });

      const response: MCPResponse = {
        jsonrpc: "2.0",
        id: 1,
        result: { test: true },
      };

      await transport.send(response);

      expect(writeSpy).toHaveBeenCalledOnce();
      const written = writeSpy.mock.calls[0][0] as string;
      expect(written).toContain('"jsonrpc":"2.0"');
      expect(written.endsWith("\n")).toBe(true);
    });

    it("should throw error when sending to closed transport", async () => {
      const transport = new StdioTransport({
        stdin: mockStdin,
        stdout: mockStdout,
      });

      await transport.close();

      const response: MCPResponse = {
        jsonrpc: "2.0",
        id: 1,
        result: {},
      };

      await expect(transport.send(response)).rejects.toThrow("Transport is closed");
    });
  });

  describe("Message Receiving", () => {
    it("should receive and parse valid JSON-RPC message", async () => {
      const transport = new StdioTransport({
        stdin: mockStdin,
        stdout: mockStdout,
      });

      const request: MCPRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {},
      };

      const messagePromise = new Promise<MCPRequest>((resolve) => {
        transport.onMessage((message) => {
          resolve(message as MCPRequest);
        });
      });

      mockStdin.emit("data", JSON.stringify(request) + "\n");

      const message = await messagePromise;
      expect(message.jsonrpc).toBe("2.0");
      expect(message.method).toBe("initialize");
      expect(message.id).toBe(1);
    });

    it("should buffer partial messages", async () => {
      const transport = new StdioTransport({
        stdin: mockStdin,
        stdout: mockStdout,
      });

      let messageCount = 0;
      const messagesPromise = new Promise<number>((resolve) => {
        transport.onMessage(() => {
          messageCount++;
          if (messageCount === 2) {
            resolve(messageCount);
          }
        });
      });

      // Send partial first message
      mockStdin.emit("data", '{"jsonrpc":"2.0","id":1,"method":"init"');
      // Complete first and send second
      mockStdin.emit("data", '}\n{"jsonrpc":"2.0","id":2,"method":"test"}\n');

      const count = await messagesPromise;
      expect(count).toBe(2);
    });

    it("should emit error for invalid JSON", async () => {
      const transport = new StdioTransport({
        stdin: mockStdin,
        stdout: mockStdout,
      });

      const errorPromise = new Promise<Error>((resolve) => {
        transport.on("error", (error: Error) => {
          resolve(error);
        });
      });

      mockStdin.emit("data", "not valid json\n");

      const error = await errorPromise;
      expect(error.message).toContain("Failed to parse");
    });

    it("should emit error for invalid JSON-RPC version", async () => {
      const transport = new StdioTransport({
        stdin: mockStdin,
        stdout: mockStdout,
      });

      const errorPromise = new Promise<Error>((resolve) => {
        transport.on("error", (error: Error) => {
          resolve(error);
        });
      });

      mockStdin.emit("data", '{"jsonrpc":"1.0","id":1,"method":"test"}\n');

      const error = await errorPromise;
      expect(error.message).toContain("Invalid JSON-RPC version");
    });
  });

  describe("Transport Lifecycle", () => {
    it("should mark transport as closed after close", async () => {
      const transport = new StdioTransport({
        stdin: mockStdin,
        stdout: mockStdout,
      });

      expect(transport.isClosed()).toBe(false);
      await transport.close();
      expect(transport.isClosed()).toBe(true);
    });

    it("should emit close event", async () => {
      const transport = new StdioTransport({
        stdin: mockStdin,
        stdout: mockStdout,
      });

      const closePromise = new Promise<void>((resolve) => {
        transport.on("close", () => {
          resolve();
        });
      });

      transport.close();
      await closePromise;
    });

    it("should handle stdin end event", async () => {
      const transport = new StdioTransport({
        stdin: mockStdin,
        stdout: mockStdout,
      });

      const closePromise = new Promise<void>((resolve) => {
        transport.on("close", () => {
          resolve();
        });
      });

      mockStdin.emit("end");
      await closePromise;
    });

    it("should ignore multiple close calls", async () => {
      const transport = new StdioTransport({
        stdin: mockStdin,
        stdout: mockStdout,
      });

      await transport.close();
      await transport.close(); // Should not throw
      expect(transport.isClosed()).toBe(true);
    });
  });
});
