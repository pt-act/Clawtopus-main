/**
 * Authentication Module
 *
 * Token-based authentication for MCP connections with gateway integration.
 */

import { loadMcpConfig } from "../config.js";
import { logAuditEvent } from "../security/index.js";

export interface AuthToken {
  /** Token value */
  token: string;
  /** Client ID associated with this token */
  clientId: string;
  /** Permissions granted */
  permissions: string[];
  /** Token expiration timestamp */
  expiresAt?: Date;
  /** Token metadata */
  metadata?: Record<string, unknown>;
}

export interface AuthResult {
  /** Whether authentication succeeded */
  success: boolean;
  /** Client ID if authenticated */
  clientId?: string;
  /** Permissions if authenticated */
  permissions?: string[];
  /** Error message if failed */
  error?: string;
}

// In-memory token storage (in production, use a proper database)
const tokenStore = new Map<string, AuthToken>();

// Default permissions for authenticated clients
const DEFAULT_PERMISSIONS = [
  "browser.navigate",
  "browser.screenshot",
  "browser.click",
  "browser.fill",
  "browser.snapshot",
  "browser.scroll",
  "browser.evaluate",
  "browser.close",
];

/**
 * Extract Bearer token from authorization header
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const trimmed = authHeader.trim();
  const bearerMatch = trimmed.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch) {
    return bearerMatch[1];
  }

  // Also support raw token (for some clients)
  return trimmed || null;
}

/**
 * Validate a token and return authentication result
 */
export async function validateToken(token: string): Promise<AuthResult> {
  const config = loadMcpConfig();

  // Check if auth is disabled
  if (config.auth?.mode === "none") {
    return {
      success: true,
      clientId: "anonymous",
      permissions: DEFAULT_PERMISSIONS,
    };
  }

  // Check configured token
  if (config.auth?.token) {
    if (token === config.auth.token) {
      await logAuditEvent({
        action: "auth_success",
        method: "token",
        clientId: "configured",
      });
      return {
        success: true,
        clientId: "configured",
        permissions: DEFAULT_PERMISSIONS,
      };
    }
  }

  // Check token file
  if (config.auth?.tokenFile) {
    try {
      const fs = await import("node:fs");
      const fileToken = fs.readFileSync(config.auth.tokenFile, "utf-8").trim();
      if (token === fileToken) {
        await logAuditEvent({
          action: "auth_success",
          method: "token_file",
          clientId: "configured",
        });
        return {
          success: true,
          clientId: "configured",
          permissions: DEFAULT_PERMISSIONS,
        };
      }
    } catch {
      // Token file read failed
    }
  }

  // Check in-memory store
  const storedToken = tokenStore.get(token);
  if (storedToken) {
    // Check expiration
    if (storedToken.expiresAt && storedToken.expiresAt < new Date()) {
      tokenStore.delete(token);
      await logAuditEvent({
        action: "auth_failed",
        reason: "token_expired",
      });
      return {
        success: false,
        error: "Token has expired",
      };
    }

    await logAuditEvent({
      action: "auth_success",
      method: "stored_token",
      clientId: storedToken.clientId,
    });
    return {
      success: true,
      clientId: storedToken.clientId,
      permissions: storedToken.permissions,
    };
  }

  // Try gateway auth integration if enabled
  if (config.auth?.useGatewayAuth) {
    const gatewayResult = await validateWithGateway(token);
    if (gatewayResult.success) {
      return gatewayResult;
    }
  }

  await logAuditEvent({
    action: "auth_failed",
    reason: "invalid_token",
  });
  return {
    success: false,
    error: "Invalid token",
  };
}

/**
 * Create a new token
 */
export async function createToken(
  clientId: string,
  permissions?: string[],
  expiresInMinutes?: number,
): Promise<string> {
  const token = generateToken();
  const authToken: AuthToken = {
    token,
    clientId,
    permissions: permissions ?? DEFAULT_PERMISSIONS,
    expiresAt: expiresInMinutes ? new Date(Date.now() + expiresInMinutes * 60000) : undefined,
  };

  tokenStore.set(token, authToken);

  await logAuditEvent({
    action: "token_created",
    clientId,
    hasExpiry: !!expiresInMinutes,
  });

  return token;
}

/**
 * Revoke a token
 */
export async function revokeToken(token: string): Promise<boolean> {
  const existed = tokenStore.has(token);
  if (existed) {
    const authToken = tokenStore.get(token);
    tokenStore.delete(token);
    await logAuditEvent({
      action: "token_revoked",
      clientId: authToken?.clientId,
    });
  }
  return existed;
}

/**
 * Revoke all tokens for a client
 */
export async function revokeClientTokens(clientId: string): Promise<number> {
  let count = 0;
  for (const [token, authToken] of tokenStore) {
    if (authToken.clientId === clientId) {
      tokenStore.delete(token);
      count++;
    }
  }

  if (count > 0) {
    await logAuditEvent({
      action: "client_tokens_revoked",
      clientId,
      count,
    });
  }

  return count;
}

/**
 * Check if a client has a specific permission
 */
export function hasPermission(
  permissions: string[] | undefined,
  requiredPermission: string,
): boolean {
  if (!permissions) {
    return false;
  }

  // Check exact permission
  if (permissions.includes(requiredPermission)) {
    return true;
  }

  // Check wildcard permission (e.g., "browser.*")
  const parts = requiredPermission.split(".");
  for (let i = parts.length - 1; i > 0; i--) {
    const wildcard = parts.slice(0, i).join(".") + ".*";
    if (permissions.includes(wildcard)) {
      return true;
    }
  }

  return false;
}

/**
 * Validate token with gateway auth
 */
async function validateWithGateway(token: string): Promise<AuthResult> {
  try {
    // Try to use the browser control auth
    const { resolveBrowserControlAuth } = await import("../../browser/control-auth.js");
    const { loadConfig } = await import("../../config/config.js");

    const config = loadConfig();
    const auth = resolveBrowserControlAuth(config);

    if (auth.token && token === auth.token) {
      return {
        success: true,
        clientId: "gateway",
        permissions: DEFAULT_PERMISSIONS,
      };
    }
  } catch {
    // Gateway auth not available
  }

  return { success: false, error: "Gateway authentication failed" };
}

/**
 * Generate a secure random token
 */
function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "mcp_";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
