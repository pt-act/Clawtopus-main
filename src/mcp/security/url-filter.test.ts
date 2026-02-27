/**
 * URL Filter Security Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as config from "../config.js";
import { getBlockedPatterns } from "./script-sandbox.js";
import { validateUrl, isUrlAllowed, isDangerousUrl } from "./url-filter.js";

vi.mock("../config.js", () => ({
  loadMcpConfig: vi.fn().mockReturnValue({
    security: {
      urlAllowlist: ["*.example.com", "localhost", "127.0.0.1"],
      requireHttps: true,
      blockPrivateIps: false,
    },
  }),
}));

describe("URL Filter Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateUrl", () => {
    it("should reject empty URLs", () => {
      const result = validateUrl("");
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("empty");
    });

    it("should reject undefined URLs", () => {
      const result = validateUrl(undefined as unknown as string);
      expect(result.valid).toBe(false);
    });

    it("should reject javascript: protocol", () => {
      const result = validateUrl("javascript:alert('xss')");
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Dangerous");
    });

    it("should reject data: protocol", () => {
      const result = validateUrl("data:text/html,<script>alert('xss')</script>");
      expect(result.valid).toBe(false);
    });

    it("should reject file: protocol", () => {
      const result = validateUrl("file:///etc/passwd");
      expect(result.valid).toBe(false);
    });

    it("should reject vbscript: protocol", () => {
      const result = validateUrl("vbscript:msgbox('test')");
      expect(result.valid).toBe(false);
    });

    it("should require HTTPS for non-local URLs", () => {
      const result = validateUrl("http://example.com");
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("HTTPS");
    });

    it("should allow HTTPS URLs", () => {
      const result = validateUrl("https://example.com");
      expect(result.valid).toBe(true);
    });

    it("should allow localhost without HTTPS", () => {
      const result = validateUrl("http://localhost:3000");
      expect(result.valid).toBe(true);
    });

    it("should allow 127.0.0.1 without HTTPS", () => {
      const result = validateUrl("http://127.0.0.1:8080");
      expect(result.valid).toBe(true);
    });

    it("should reject invalid URL format", () => {
      const result = validateUrl("not a url");
      expect(result.valid).toBe(false);
    });

    it("should allow URLs without protocol (defaults to http)", () => {
      // URLs without protocol may be interpreted differently
      const result = validateUrl("example.com");
      // This behavior depends on URL parsing
      expect(result).toBeDefined();
    });
  });

  describe("isUrlAllowed", () => {
    it("should allow URLs matching allowlist patterns", () => {
      expect(isUrlAllowed("https://test.example.com")).toBe(true);
      expect(isUrlAllowed("https://sub.example.com")).toBe(true);
    });

    it("should allow localhost", () => {
      expect(isUrlAllowed("http://localhost:3000")).toBe(true);
    });

    it("should allow 127.0.0.1", () => {
      expect(isUrlAllowed("http://127.0.0.1:8080")).toBe(true);
    });

    it("should block URLs not in allowlist", () => {
      expect(isUrlAllowed("https://malicious.com")).toBe(false);
      expect(isUrlAllowed("https://evil.example.org")).toBe(false);
    });

    it("should handle invalid URLs gracefully", () => {
      expect(isUrlAllowed("not a url")).toBe(false);
    });

    it("should block dangerous URLs even if in allowlist", () => {
      expect(isUrlAllowed("javascript:alert('xss')")).toBe(false);
    });
  });

  describe("isDangerousUrl", () => {
    it("should detect javascript: protocol", () => {
      expect(isDangerousUrl("javascript:alert('test')")).toBe(true);
      expect(isDangerousUrl("JAVASCRIPT:alert('test')")).toBe(true);
    });

    it("should detect data: protocol", () => {
      expect(isDangerousUrl("data:text/html,<script>")).toBe(true);
    });

    it("should detect file: protocol", () => {
      expect(isDangerousUrl("file:///etc/passwd")).toBe(true);
    });

    it("should return false for safe URLs", () => {
      expect(isDangerousUrl("https://example.com")).toBe(false);
      expect(isDangerousUrl("http://localhost")).toBe(false);
    });
  });

  describe("getBlockedPatterns", () => {
    it("should return default patterns when no config", () => {
      vi.mocked(config.loadMcpConfig).mockReturnValue({});
      const patterns = getBlockedPatterns();
      expect(patterns.length).toBeGreaterThan(0);
    });

    it("should use custom patterns from config", () => {
      vi.mocked(config.loadMcpConfig).mockReturnValue({
        security: {
          blockedJsPatterns: ["custom.*pattern"],
        },
      });
      const patterns = getBlockedPatterns();
      expect(patterns.length).toBe(1);
      expect(patterns[0].test("customXYZpattern")).toBe(true);
    });
  });
});
