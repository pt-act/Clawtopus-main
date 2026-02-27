/**
 * Session Module Barrel Export
 *
 * Centralized exports for all session management functionality.
 */

// Types
export type {
  Session,
  SessionCreateOptions,
  SessionManagerConfig,
  SessionStats,
  SessionAccessResult,
} from "./types.js";

// Manager Functions
export {
  initializeSessionManager,
  createSession,
  getSession,
  accessSession,
  releaseSession,
  releaseClientSessions,
  cleanupExpiredSessions,
  getSessionStats,
  listSessions,
  hasSession,
  getClientSessionCount,
  onSessionEvent,
  stopSessionManager,
} from "./manager.js";
