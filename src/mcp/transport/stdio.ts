/**
 * MCP Stdio Transport
 *
 * Standard input/output transport for MCP protocol.
 * Uses newline-delimited JSON (NDJSON) for message framing.
 */

import type { MCPResponse, MCPNotification } from "../types.js";
import { BaseTransport } from "./base.js";

export interface StdioTransportOptions {
  stdin?: NodeJS.ReadableStream;
  stdout?: NodeJS.WritableStream;
}

export class StdioTransport extends BaseTransport {
  private stdin: NodeJS.ReadableStream;
  private stdout: NodeJS.WritableStream;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(options: StdioTransportOptions = {}) {
    super();
    this.stdin = options.stdin ?? process.stdin;
    this.stdout = options.stdout ?? process.stdout;

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Handle incoming data from stdin
    this.stdin.on("data", (chunk: Buffer) => {
      this.handleMessage(chunk.toString("utf-8"));
    });

    // Handle stdin end
    this.stdin.on("end", () => {
      this.close();
    });

    // Handle errors
    this.stdin.on("error", (error) => {
      this.emitError(error);
    });

    this.stdout.on("error", (error) => {
      this.emitError(error);
    });
  }

  async send(message: MCPResponse | MCPNotification): Promise<void> {
    if (this.closed) {
      throw new Error("Transport is closed");
    }

    const json = JSON.stringify(message);
    const line = json + "\n";

    // Queue writes to ensure order
    this.writeQueue = this.writeQueue.then(async () => {
      return new Promise<void>((resolve, reject) => {
        if (this.closed) {
          reject(new Error("Transport is closed"));
          return;
        }

        this.stdout.write(line, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    });

    await this.writeQueue;
  }

  async close(): Promise<void> {
    if (this.closed) {
      return;
    }

    this.closed = true;

    // Wait for pending writes
    try {
      await this.writeQueue;
    } catch {
      // Ignore errors during close
    }

    // Remove listeners
    this.stdin.removeAllListeners();
    this.stdout.removeAllListeners();

    this.emit("close");
  }
}
