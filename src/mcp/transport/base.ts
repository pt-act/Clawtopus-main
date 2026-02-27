/**
 * MCP Transport Base
 *
 * Abstract transport layer for MCP protocol communication.
 * Supports stdio and HTTP/SSE transports.
 */

import { EventEmitter } from "events";
import type { MCPRequest, MCPResponse, MCPNotification } from "../types.js";

export interface Transport {
  /** Send a response or notification to the client */
  send(message: MCPResponse | MCPNotification): Promise<void>;

  /** Register a handler for incoming messages */
  onMessage(handler: (message: MCPRequest | MCPNotification) => void): void;

  /** Close the transport connection */
  close(): Promise<void>;

  /** Check if transport is closed */
  isClosed(): boolean;

  /** Event emitter for transport events */
  on(event: "close", listener: () => void): this;
  on(event: "error", listener: (error: Error) => void): this;
}

export abstract class BaseTransport extends EventEmitter implements Transport {
  protected messageHandler?: (message: MCPRequest | MCPNotification) => void;
  protected closed = false;
  protected messageBuffer = "";

  abstract send(message: MCPResponse | MCPNotification): Promise<void>;
  abstract close(): Promise<void>;

  onMessage(handler: (message: MCPRequest | MCPNotification) => void): void {
    this.messageHandler = handler;
  }

  isClosed(): boolean {
    return this.closed;
  }

  protected handleMessage(data: string): void {
    if (this.closed) {
      return;
    }

    // Append to buffer
    this.messageBuffer += data;

    // Process complete lines (newline-delimited JSON)
    const lines = this.messageBuffer.split("\n");

    // Keep the last incomplete line in buffer
    this.messageBuffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      try {
        const message = JSON.parse(trimmed) as MCPRequest | MCPNotification;

        // Validate basic JSON-RPC structure
        if (message.jsonrpc !== "2.0") {
          this.emit("error", new Error("Invalid JSON-RPC version"));
          continue;
        }

        this.messageHandler?.(message);
      } catch (error) {
        this.emit(
          "error",
          new Error(
            `Failed to parse message: ${error instanceof Error ? error.message : String(error)}`,
          ),
        );
      }
    }
  }

  protected emitError(error: Error): void {
    this.emit("error", error);
  }
}
