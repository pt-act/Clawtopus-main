/**
 * MCP Server Configuration
 *
 * Loads configuration from YAML with security settings, session limits,
 * and transport selection.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "yaml";

export interface McpSecurityConfig {
  /** URL allowlist patterns (supports wildcards) */
  urlAllowlist?: string[];
  /** Require HTTPS for non-local URLs */
  requireHttps?: boolean;
  /** Block access to private IP ranges */
  blockPrivateIps?: boolean;
  /** Blocked JavaScript patterns for evaluate */
  blockedJsPatterns?: string[];
  /** Enable audit logging */
  auditLogging?: boolean;
  /** Allowed domains for navigation */
  allowedDomains?: string[];
  /** Path to audit log file */
  auditLogPath?: string;
}

export interface McpSessionConfig {
  /** Maximum concurrent sessions */
  maxConcurrent?: number;
  /** Session timeout in minutes */
  timeoutMinutes?: number;
  /** Enable session sharing between clients */
  allowSharedSessions?: boolean;
  /** Maximum sessions per client */
  maxPerClient?: number;
}

export interface McpTransportConfig {
  /** Transport type: stdio or http */
  type: "stdio" | "http" | "sse";
  /** Port for HTTP/SSE transport */
  port?: number;
  /** Host for HTTP/SSE transport */
  host?: string;
  /** Path prefix for HTTP routes */
  pathPrefix?: string;
}

export interface McpAuthConfig {
  /** Authentication mode */
  mode?: "none" | "token" | "bearer";
  /** Bearer token for authentication */
  token?: string;
  /** Token file path */
  tokenFile?: string;
  /** Integration with gateway auth */
  useGatewayAuth?: boolean;
}

export interface McpServerConfig {
  /** Server name */
  name?: string;
  /** Server version */
  version?: string;
  /** Security configuration */
  security?: McpSecurityConfig;
  /** Session management */
  sessions?: McpSessionConfig;
  /** Transport configuration */
  transport?: McpTransportConfig;
  /** Authentication */
  auth?: McpAuthConfig;
  /** Default CDP URL for browser connection */
  defaultCdpUrl?: string;
  /** Browser profile to use */
  browserProfile?: string;
  /** Screenshot configuration */
  screenshot?: {
    maxWidth?: number;
    maxHeight?: number;
    maxBytes?: number;
    quality?: number;
  };
}

const DEFAULT_CONFIG: McpServerConfig = {
  name: "browser-vision-mcp",
  version: "1.0.0",
  transport: {
    type: "stdio",
  },
  security: {
    requireHttps: true,
    blockPrivateIps: false,
    auditLogging: true,
    urlAllowlist: ["*.example.com", "localhost", "127.0.0.1"],
    blockedJsPatterns: [
      "eval\\s*\\(",
      "Function\\s*\\(",
      "setTimeout\\s*\\([^,]+,\\s*0\\s*\\)",
      "setInterval",
      "document\\.write",
      "window\\.open",
      "XMLHttpRequest",
      "fetch\\s*\\(",
      "WebSocket",
      "postMessage",
      "localStorage",
      "sessionStorage",
      "indexedDB",
      "navigator",
      "location\\.href\\s*=",
    ],
  },
  sessions: {
    maxConcurrent: 10,
    timeoutMinutes: 30,
    allowSharedSessions: false,
    maxPerClient: 3,
  },
  auth: {
    mode: "none",
    useGatewayAuth: true,
  },
  screenshot: {
    maxWidth: 2000,
    maxHeight: 2000,
    maxBytes: 5 * 1024 * 1024, // 5MB
    quality: 85,
  },
};

let cachedConfig: McpServerConfig | null = null;
let configLoadTime = 0;
const CONFIG_CACHE_MS = 5000;

/**
 * Get the path to the MCP config file
 */
export function getMcpConfigPath(): string {
  // Check environment variable first
  const envPath = process.env.MCP_CONFIG_PATH;
  if (envPath) {
    return envPath;
  }

  // Check project root
  const cwd = process.cwd();
  const projectPath = path.join(cwd, "mcp.config.yaml");
  if (fs.existsSync(projectPath)) {
    return projectPath;
  }

  // Check user config directory
  const homeDir = os.homedir();
  const userPath = path.join(homeDir, ".config", "openclaw", "mcp.yaml");
  if (fs.existsSync(userPath)) {
    return userPath;
  }

  // Check XDG config
  const xdgConfig = process.env.XDG_CONFIG_HOME;
  if (xdgConfig) {
    const xdgPath = path.join(xdgConfig, "openclaw", "mcp.yaml");
    if (fs.existsSync(xdgPath)) {
      return xdgPath;
    }
  }

  return projectPath; // Default fallback
}

/**
 * Load MCP configuration from YAML file
 */
export function loadMcpConfig(): McpServerConfig {
  const now = Date.now();

  // Return cached config if fresh
  if (cachedConfig && now - configLoadTime < CONFIG_CACHE_MS) {
    return cachedConfig;
  }

  const configPath = getMcpConfigPath();

  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, "utf-8");
      const parsed = yaml.parse(content) as Partial<McpServerConfig>;

      cachedConfig = mergeConfig(DEFAULT_CONFIG, parsed);
    } else {
      cachedConfig = { ...DEFAULT_CONFIG };
    }
  } catch (error) {
    console.warn(`Failed to load MCP config from ${configPath}:`, error);
    cachedConfig = { ...DEFAULT_CONFIG };
  }

  configLoadTime = now;
  return cachedConfig;
}

/**
 * Save MCP configuration to YAML file
 */
export function saveMcpConfig(config: McpServerConfig): void {
  const configPath = getMcpConfigPath();

  // Ensure directory exists
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const yamlContent = yaml.stringify(config, {
    indent: 2,
    lineWidth: 120,
  });

  fs.writeFileSync(configPath, yamlContent, "utf-8");
  cachedConfig = config;
  configLoadTime = Date.now();
}

/**
 * Merge user config with defaults
 */
function mergeConfig(defaults: McpServerConfig, user: Partial<McpServerConfig>): McpServerConfig {
  return {
    ...defaults,
    ...user,
    security: {
      ...defaults.security,
      ...user.security,
    },
    sessions: {
      ...defaults.sessions,
      ...user.sessions,
    },
    transport: {
      ...defaults.transport,
      ...user.transport,
      type: user.transport?.type ?? defaults.transport?.type ?? "stdio",
    },
    auth: {
      ...defaults.auth,
      ...user.auth,
    },
    screenshot: {
      ...defaults.screenshot,
      ...user.screenshot,
    },
  };
}

/**
 * Reload configuration (clear cache)
 */
export function reloadMcpConfig(): McpServerConfig {
  cachedConfig = null;
  return loadMcpConfig();
}

/**
 * Get default CDP URL from configuration
 */
export function getDefaultCdpUrl(): string | undefined {
  const config = loadMcpConfig();

  // Check explicit config
  if (config.defaultCdpUrl) {
    return config.defaultCdpUrl;
  }

  // Check environment
  const envCdp = process.env.BROWSER_CDP_URL;
  if (envCdp) {
    return envCdp;
  }

  // Try to get from browser control service
  try {
    const { getBrowserControlState } = require("../browser/control-service.js");
    const state = getBrowserControlState();
    if (state?.resolved?.profiles?.default?.cdpUrl) {
      return state.resolved.profiles.default.cdpUrl;
    }
    // Try first available profile
    const profiles = state?.resolved?.profiles;
    if (profiles) {
      const firstProfile = Object.values(profiles)[0] as { cdpUrl?: string } | undefined;
      if (firstProfile?.cdpUrl) {
        return firstProfile.cdpUrl;
      }
    }
  } catch {
    // Ignore errors during dynamic import
  }

  return undefined;
}
