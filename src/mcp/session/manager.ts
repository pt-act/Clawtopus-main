/**
 * Session Manager
 *
 * Manages browser sessions for MCP clients with isolation,
 * timeout handling, and concurrency limits.
 */

import { EventEmitter } from "node:events";
import type {
  Session,
  SessionCreateOptions,
  SessionManagerConfig,
  SessionStats,
  SessionAccessResult,
} from "./types.js";
import { loadMcpConfig } from "../config.js";

// Default configuration
const DEFAULT_CONFIG: SessionManagerConfig = {
  maxConcurrent: 10,
  maxPerClient: 3,
  timeoutMs: 30 * 60 * 1000, // 30 minutes
  allowShared: false,
};

// In-memory session storage
const sessions = new Map<string, Session>();
const clientSessions = new Map<string, Set<string>>();

// Event emitter for session events
const events = new EventEmitter();

// Cleanup interval reference
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Initialize the session manager
 */
export function initializeSessionManager(): void {
  // Start cleanup interval if not already running
  if (!cleanupInterval) {
    cleanupInterval = setInterval(() => {
      cleanupExpiredSessions();
    }, 60000); // Check every minute
  }
}

/**
 * Get session manager configuration
 */
function getConfig(): SessionManagerConfig {
  const mcpConfig = loadMcpConfig();
  return {
    maxConcurrent: mcpConfig.sessions?.maxConcurrent ?? DEFAULT_CONFIG.maxConcurrent,
    maxPerClient: mcpConfig.sessions?.maxPerClient ?? DEFAULT_CONFIG.maxPerClient,
    timeoutMs: (mcpConfig.sessions?.timeoutMinutes ?? 30) * 60 * 1000,
    allowShared: mcpConfig.sessions?.allowSharedSessions ?? DEFAULT_CONFIG.allowShared,
  };
}

/**
 * Create a new session
 */
export async function createSession(options: SessionCreateOptions): Promise<Session> {
  const config = getConfig();

  // Check if client has reached max sessions
  const clientSessionIds = clientSessions.get(options.clientId);
  if (clientSessionIds && clientSessionIds.size >= config.maxPerClient) {
    throw new Error(
      `Client ${options.clientId} has reached the maximum of ${config.maxPerClient} sessions`,
    );
  }

  // Check global session limit
  if (sessions.size >= config.maxConcurrent) {
    // Try to clean up expired sessions first
    cleanupExpiredSessions();

    if (sessions.size >= config.maxConcurrent) {
      throw new Error(
        `Maximum concurrent sessions (${config.maxConcurrent}) reached. Close some sessions first.`,
      );
    }
  }

  // Check if shared sessions are allowed
  if (options.shared && !config.allowShared) {
    throw new Error("Shared sessions are not allowed by configuration");
  }

  // Generate session ID
  const sessionId = generateSessionId();

  const now = new Date();
  const session: Session = {
    id: sessionId,
    clientId: options.clientId,
    createdAt: now,
    lastActivity: now,
    shared: options.shared ?? false,
    cdpUrl: options.cdpUrl,
    targetId: options.targetId,
    metadata: options.metadata,
  };

  // Store session
  sessions.set(sessionId, session);

  // Track for client
  if (!clientSessions.has(options.clientId)) {
    clientSessions.set(options.clientId, new Set());
  }
  clientSessions.get(options.clientId)!.add(sessionId);

  // Emit event
  events.emit("sessionCreated", session);

  return session;
}

/**
 * Get a session by ID
 */
export function getSession(sessionId: string): Session | undefined {
  const session = sessions.get(sessionId);
  if (session) {
    // Update last activity
    session.lastActivity = new Date();
  }
  return session;
}

/**
 * Access a session with ownership check
 */
export function accessSession(sessionId: string, clientId: string): SessionAccessResult {
  const session = sessions.get(sessionId);

  if (!session) {
    return { allowed: false, error: "Session not found" };
  }

  // Check ownership (shared sessions can be accessed by any client)
  if (!session.shared && session.clientId !== clientId) {
    return { allowed: false, error: "Session access denied" };
  }

  // Update last activity
  session.lastActivity = new Date();

  return { allowed: true, session };
}

/**
 * Release (delete) a session
 */
export async function releaseSession(sessionId: string): Promise<void> {
  const session = sessions.get(sessionId);
  if (!session) {
    return;
  }

  // Remove from client tracking
  const clientSessionIds = clientSessions.get(session.clientId);
  if (clientSessionIds) {
    clientSessionIds.delete(sessionId);
    if (clientSessionIds.size === 0) {
      clientSessions.delete(session.clientId);
    }
  }

  // Remove session
  sessions.delete(sessionId);

  // Emit event
  events.emit("sessionReleased", session);
}

/**
 * Release all sessions for a client
 */
export async function releaseClientSessions(clientId: string): Promise<number> {
  const clientSessionIds = clientSessions.get(clientId);
  if (!clientSessionIds) {
    return 0;
  }

  let count = 0;
  for (const sessionId of clientSessionIds) {
    const session = sessions.get(sessionId);
    if (session) {
      sessions.delete(sessionId);
      events.emit("sessionReleased", session);
      count++;
    }
  }

  clientSessions.delete(clientId);
  return count;
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(): number {
  const config = getConfig();
  const now = Date.now();
  let cleaned = 0;

  for (const [sessionId, session] of sessions) {
    const age = now - session.lastActivity.getTime();
    if (age > config.timeoutMs) {
      sessions.delete(sessionId);

      // Remove from client tracking
      const clientSessionIds = clientSessions.get(session.clientId);
      if (clientSessionIds) {
        clientSessionIds.delete(sessionId);
        if (clientSessionIds.size === 0) {
          clientSessions.delete(session.clientId);
        }
      }

      events.emit("sessionExpired", session);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Get session statistics
 */
export function getSessionStats(): SessionStats {
  const sessionsByClient = new Map<string, number>();
  let sharedSessions = 0;

  for (const session of sessions.values()) {
    const count = sessionsByClient.get(session.clientId) ?? 0;
    sessionsByClient.set(session.clientId, count + 1);

    if (session.shared) {
      sharedSessions++;
    }
  }

  return {
    totalSessions: sessions.size,
    sessionsByClient,
    sharedSessions,
  };
}

/**
 * List all sessions (for admin/debugging)
 */
export function listSessions(): Session[] {
  return Array.from(sessions.values());
}

/**
 * Check if a session exists
 */
export function hasSession(sessionId: string): boolean {
  return sessions.has(sessionId);
}

/**
 * Get session count for a client
 */
export function getClientSessionCount(clientId: string): number {
  return clientSessions.get(clientId)?.size ?? 0;
}

/**
 * Subscribe to session events
 */
export function onSessionEvent(
  event: "sessionCreated" | "sessionReleased" | "sessionExpired",
  handler: (session: Session) => void,
): void {
  events.on(event, handler);
}

/**
 * Stop the session manager and clean up
 */
export function stopSessionManager(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }

  // Clear all sessions
  sessions.clear();
  clientSessions.clear();
  events.removeAllListeners();
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `sess_${timestamp}_${random}`;
}
