/**
 * Security Module Barrel Export
 *
 * Centralized exports for all security-related functionality.
 */

// URL Filter
export {
  validateUrl,
  isUrlAllowed,
  isDangerousUrl,
  type UrlValidationResult,
} from "./url-filter.js";

// Audit Logging
export {
  logAuditEvent,
  getRecentEvents,
  getAuditLog,
  clearAuditLog,
  type AuditEvent,
} from "./audit.js";

// Script Sandbox
export {
  isScriptAllowed,
  getBlockedPatterns,
  sanitizeScript,
  getScriptBlockReason,
} from "./script-sandbox.js";
