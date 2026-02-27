/**
 * Session Types
 *
 * Type definitions for MCP session management.
 */

/**
 * Session information
 */
export interface Session {
  /** Unique session ID */
  id: string;
  /** Client identifier that owns this session */
  clientId: string;
  /** Session creation timestamp */
  createdAt: Date;
  /** Last activity timestamp */
  lastActivity: Date;
  /** Whether this session is shared across clients */
  shared: boolean;
  /** CDP URL for browser connection */
  cdpUrl?: string;
  /** Target ID (tab) */
  targetId?: string;
  /** Session metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Session creation options
 */
export interface SessionCreateOptions {
  /** Client ID that owns this session */
  clientId: string;
  /** Whether this session can be shared */
  shared?: boolean;
  /** Session metadata */
  metadata?: Record<string, unknown>;
  /** Custom CDP URL */
  cdpUrl?: string;
  /** Custom target ID */
  targetId?: string;
}

/**
 * Session manager configuration
 */
export interface SessionManagerConfig {
  /** Maximum concurrent sessions */
  maxConcurrent: number;
  /** Maximum sessions per client */
  maxPerClient: number;
  /** Session timeout in milliseconds */
  timeoutMs: number;
  /** Whether shared sessions are allowed */
  allowShared: boolean;
}

/**
 * Session statistics
 */
export interface SessionStats {
  /** Total active sessions */
  totalSessions: number;
  /** Sessions by client */
  sessionsByClient: Map<string, number>;
  /** Shared sessions count */
  sharedSessions: number;
}

/**
 * Session access result
 */
export interface SessionAccessResult {
  /** Whether access was granted */
  allowed: boolean;
  /** Session if access granted */
  session?: Session;
  /** Error message if access denied */
  error?: string;
}
