/**
 * Security Audit Logging Module
 *
 * Logs security events for monitoring and debugging.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadMcpConfig } from "../config.js";

export interface AuditEvent {
  timestamp: string;
  action: string;
  details?: Record<string, unknown>;
}

// In-memory event buffer for recent events
const eventBuffer: AuditEvent[] = [];
const MAX_BUFFER_SIZE = 1000;

/**
 * Log a security audit event
 */
export async function logAuditEvent(details: Record<string, unknown>): Promise<void> {
  const config = loadMcpConfig();

  // Only log if audit logging is enabled
  if (!config.security?.auditLogging) {
    return;
  }

  const event: AuditEvent = {
    timestamp: new Date().toISOString(),
    action: String(details.action || "unknown"),
    details,
  };

  // Add to in-memory buffer
  eventBuffer.push(event);
  if (eventBuffer.length > MAX_BUFFER_SIZE) {
    eventBuffer.shift();
  }

  // Write to log file
  try {
    const logPath = getAuditLogPath();
    const logEntry = JSON.stringify(event) + "\n";
    fs.appendFileSync(logPath, logEntry, "utf-8");
  } catch {
    // Silent fail - don't let logging break the application
  }
}

/**
 * Get recent audit events
 */
export function getRecentEvents(count = 100): AuditEvent[] {
  return eventBuffer.slice(-count);
}

/**
 * Get all audit events from the log file
 */
export function getAuditLog(): AuditEvent[] {
  try {
    const logPath = getAuditLogPath();
    if (!fs.existsSync(logPath)) {
      return [];
    }

    const content = fs.readFileSync(logPath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    return lines
      .map((line) => {
        try {
          return JSON.parse(line) as AuditEvent;
        } catch {
          return null;
        }
      })
      .filter((e): e is AuditEvent => e !== null);
  } catch {
    return [];
  }
}

/**
 * Get the audit log file path
 */
function getAuditLogPath(): string {
  const config = loadMcpConfig();
  if (config.security?.auditLogPath) {
    return config.security.auditLogPath;
  }

  const homeDir = os.homedir();
  const logDir = path.join(homeDir, ".config", "openclaw", "logs");

  // Ensure directory exists
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch {
    // Ignore
  }

  return path.join(logDir, "mcp-audit.log");
}

/**
 * Clear the audit log
 */
export function clearAuditLog(): void {
  try {
    const logPath = getAuditLogPath();
    if (fs.existsSync(logPath)) {
      fs.unlinkSync(logPath);
    }
  } catch {
    // Ignore errors
  }

  // Clear in-memory buffer
  eventBuffer.length = 0;
}
