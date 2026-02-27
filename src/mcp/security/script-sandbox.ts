/**
 * Script Sandbox Security Module
 *
 * Validates JavaScript code for dangerous patterns before execution.
 */

import { loadMcpConfig } from "../config.js";

// Default blocked patterns - dangerous JavaScript that could be used maliciously
const DEFAULT_BLOCKED_PATTERNS = [
  // Code execution
  /eval\s*\(/i,
  /new\s+Function\s*\(/i,
  /Function\s*\(/i,
  /setTimeout\s*\(\s*["'][^"']+["']/i,
  /setInterval\s*\(\s*["'][^"']+["']/i,

  // DOM manipulation that could be dangerous
  /document\.write/i,
  /document\.writeln/i,
  /document\.open\s*\(/i,
  /document\.execCommand/i,

  // Window/Location manipulation
  /window\.open\s*\(/i,
  /location\.href\s*=/i,
  /location\.replace\s*\(/i,
  /location\.assign\s*\(/i,

  // Network requests
  /XMLHttpRequest/i,
  /fetch\s*\(/i,
  /WebSocket/i,
  /EventSource/i,

  // Cross-origin communication
  /postMessage\s*\(/i,

  // Storage access
  /localStorage/i,
  /sessionStorage/i,
  /indexedDB/i,
  /webkitIndexedDB/i,
  /mozIndexedDB/i,

  // Worker creation
  /new\s+Worker/i,
  /new\s+SharedWorker/i,
  /navigator\.serviceWorker/i,

  // Clipboard access
  /document\.execCommand\s*\(\s*["']copy/i,
  /document\.execCommand\s*\(\s*["']cut/i,
  /document\.execCommand\s*\(\s*["']paste/i,
  /navigator\.clipboard/i,

  // File system access
  /showOpenFilePicker/i,
  /showSaveFilePicker/i,
  /showDirectoryPicker/i,

  // Device APIs
  /navigator\.mediaDevices/i,
  /navigator\.getUserMedia/i,
  /navigator\.webkitGetUserMedia/i,
  /navigator\.mozGetUserMedia/i,

  // Crypto mining or malicious patterns
  /CryptoNight/i,
  /coinhive/i,
  /webminer/i,

  // iframe manipulation
  /document\.createElement\s*\(\s*["']iframe/i,
  /appendChild.*iframe/i,

  // Script injection
  /<script/i,
  /innerHTML\s*=/i,
  /outerHTML\s*=/i,
  /insertAdjacentHTML/i,
];

/**
 * Check if a script contains any blocked patterns
 */
export function isScriptAllowed(script: string): boolean {
  const config = loadMcpConfig();
  const patterns = getBlockedPatterns(config);

  for (const pattern of patterns) {
    if (pattern.test(script)) {
      return false;
    }
  }

  return true;
}

/**
 * Get the list of blocked patterns
 */
export function getBlockedPatterns(config?: {
  security?: { blockedJsPatterns?: string[] };
}): RegExp[] {
  const loaded = config || loadMcpConfig();

  // If custom patterns are configured, use them
  if (loaded.security?.blockedJsPatterns?.length) {
    return loaded.security.blockedJsPatterns.map((p) => new RegExp(p, "i"));
  }

  return DEFAULT_BLOCKED_PATTERNS;
}

/**
 * Sanitize a script by removing potentially dangerous content
 * Note: This is a best-effort approach, not a guarantee of safety
 */
export function sanitizeScript(script: string): string {
  let sanitized = script;

  // Remove comments (both // and /* */)
  sanitized = sanitized.replace(/\/\/.*$/gm, "");
  sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, "");

  // Remove some dangerous patterns
  const patterns = getBlockedPatterns();
  for (const pattern of patterns) {
    sanitized = sanitized.replace(pattern, "/* blocked */");
  }

  return sanitized.trim();
}

/**
 * Get detailed information about why a script was blocked
 */
export function getScriptBlockReason(script: string): string | null {
  const patterns = getBlockedPatterns();

  for (const pattern of patterns) {
    if (pattern.test(script)) {
      return `Blocked pattern matched: ${pattern.source}`;
    }
  }

  return null;
}
