/**
 * URL Filter Security Module
 *
 * Validates URLs against allowlist patterns and enforces security policies.
 */

import { loadMcpConfig } from "../config.js";

// Default allowlist - allows common domains for testing
const DEFAULT_ALLOWLIST = ["*.example.com", "localhost", "127.0.0.1", "::1"];

// Dangerous URL patterns to block
const DANGEROUS_PATTERNS = [/^javascript:/i, /^data:/i, /^vbscript:/i, /^file:/i, /^about:/i];

// Private IP patterns
const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^fc00:/i,
  /^fe80:/i,
];

export interface UrlValidationResult {
  valid: boolean;
  reason?: string;
  url?: string;
}

/**
 * Validate a URL for proper format and security
 */
export function validateUrl(url: string): UrlValidationResult {
  const trimmed = url?.trim();

  if (!trimmed) {
    return { valid: false, reason: "URL is empty" };
  }

  // Check for dangerous protocols
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        reason: `Dangerous URL protocol detected: ${trimmed.slice(0, 20)}...`,
      };
    }
  }

  try {
    const parsed = new URL(trimmed);

    // Require HTTPS by default (unless explicitly allowed)
    const config = getUrlFilterConfig();
    if (config.requireHttps && parsed.protocol !== "https:") {
      // Allow localhost and local IPs without HTTPS
      const hostname = parsed.hostname;
      if (!isLocalhost(hostname) && !isPrivateIp(hostname)) {
        return { valid: false, reason: "HTTPS is required for non-local URLs" };
      }
    }

    // Validate hostname
    if (!parsed.hostname) {
      return { valid: false, reason: "URL must have a valid hostname" };
    }

    return { valid: true, url: trimmed };
  } catch {
    return { valid: false, reason: "Invalid URL format" };
  }
}

/**
 * Check if URL is in the allowlist
 */
export function isUrlAllowed(url: string): boolean {
  const config = getUrlFilterConfig();

  // If no allowlist configured, allow all (except dangerous protocols)
  if (!config.allowlist || config.allowlist.length === 0) {
    return !isDangerousUrl(url);
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    for (const pattern of config.allowlist) {
      if (matchesPattern(hostname, pattern)) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Check if URL has a dangerous protocol
 */
export function isDangerousUrl(url: string): boolean {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(url)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if hostname is localhost
 */
function isLocalhost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return lower === "localhost" || lower === "::1" || lower === "127.0.0.1";
}

/**
 * Check if IP is private
 */
function isPrivateIp(ip: string): boolean {
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(ip)) {
      return true;
    }
  }
  return false;
}

/**
 * Match hostname against pattern (supports wildcards)
 */
function matchesPattern(hostname: string, pattern: string): boolean {
  const lowerPattern = pattern.toLowerCase().trim();
  const lowerHost = hostname.toLowerCase().trim();

  // Exact match
  if (lowerPattern === lowerHost) {
    return true;
  }

  // Wildcard pattern like *.example.com
  if (lowerPattern.startsWith("*.")) {
    const suffix = lowerPattern.slice(2);
    if (lowerHost === suffix || lowerHost.endsWith("." + suffix)) {
      return true;
    }
  }

  // Contains pattern
  if (lowerPattern.includes("*")) {
    const regex = new RegExp(
      "^" + lowerPattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$",
    );
    if (regex.test(lowerHost)) {
      return true;
    }
  }

  return false;
}

interface UrlFilterConfig {
  allowlist: string[];
  requireHttps: boolean;
  blockPrivateIps: boolean;
}

function getUrlFilterConfig(): UrlFilterConfig {
  try {
    const config = loadMcpConfig();
    return {
      allowlist: config.security?.urlAllowlist || DEFAULT_ALLOWLIST,
      requireHttps: config.security?.requireHttps ?? true,
      blockPrivateIps: config.security?.blockPrivateIps ?? false,
    };
  } catch {
    return {
      allowlist: DEFAULT_ALLOWLIST,
      requireHttps: true,
      blockPrivateIps: false,
    };
  }
}
