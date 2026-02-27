/**
 * MCP Configuration Tests
 */

import fs from "node:fs";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  loadMcpConfig,
  saveMcpConfig,
  getMcpConfigPath,
  reloadMcpConfig,
  getDefaultCdpUrl,
  type McpServerConfig,
} from "./config.js";

// Mock fs module
vi.mock("node:fs", async () => {
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  };
});

describe("MCP Configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reloadMcpConfig();
    delete process.env.MCP_CONFIG_PATH;
    delete process.env.BROWSER_CDP_URL;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getMcpConfigPath", () => {
    it("should use environment variable if set", () => {
      process.env.MCP_CONFIG_PATH = "/custom/path/config.yaml";
      const configPath = getMcpConfigPath();
      expect(configPath).toBe("/custom/path/config.yaml");
    });

    it("should use project path as default", () => {
      const configPath = getMcpConfigPath();
      expect(configPath).toContain("mcp.config.yaml");
    });

    it("should use user config directory if exists", () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        return String(p).includes(".config/openclaw");
      });

      const configPath = getMcpConfigPath();
      expect(configPath).toContain(".config/openclaw");
    });
  });

  describe("loadMcpConfig", () => {
    it("should return default config if file does not exist", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const config = loadMcpConfig();

      expect(config.name).toBe("browser-vision-mcp");
      expect(config.security?.requireHttps).toBe(true);
      expect(config.sessions?.maxConcurrent).toBe(10);
    });

    it("should load config from YAML file", () => {
      const yamlContent = `
name: custom-mcp
security:
  requireHttps: false
  urlAllowlist:
    - "*.test.com"
`;
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(yamlContent);

      const config = loadMcpConfig();

      expect(config.name).toBe("custom-mcp");
      expect(config.security?.requireHttps).toBe(false);
      expect(config.security?.urlAllowlist).toContain("*.test.com");
    });

    it("should merge user config with defaults", () => {
      const yamlContent = `
name: custom-mcp
`;
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(yamlContent);

      const config = loadMcpConfig();

      expect(config.name).toBe("custom-mcp");
      // Default values should still be present
      expect(config.security?.requireHttps).toBe(true);
    });

    it("should cache config for subsequent calls", () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue("name: test");

      loadMcpConfig();
      loadMcpConfig();

      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    });
  });

  describe("saveMcpConfig", () => {
    it("should save config to YAML file", () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const config: McpServerConfig = {
        name: "test-mcp",
        security: {
          requireHttps: true,
        },
      };

      saveMcpConfig(config);

      expect(fs.writeFileSync).toHaveBeenCalled();
      const writtenContent = vi.mocked(fs.writeFileSync).mock.calls[0][1] as string;
      expect(writtenContent).toContain("name: test-mcp");
    });

    it("should create directory if it does not exist", () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      saveMcpConfig({ name: "test" });

      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });
  });

  describe("getDefaultCdpUrl", () => {
    it("should return URL from environment variable", () => {
      process.env.BROWSER_CDP_URL = "ws://env-browser:9222";

      const url = getDefaultCdpUrl();

      expect(url).toBe("ws://env-browser:9222");
    });

    it("should return undefined when no URL available", () => {
      const url = getDefaultCdpUrl();
      expect(url).toBeUndefined();
    });
  });
});
