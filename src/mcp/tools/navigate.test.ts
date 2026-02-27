/**
 * browser.navigate Tool Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as urlFilter from "../security/url-filter.js";
import { MCPErrorException } from "../types.js";
import { tool, execute, name } from "./navigate.js";

// Mock dependencies
vi.mock("../security/url-filter.js", () => ({
  validateUrl: vi.fn(),
  isUrlAllowed: vi.fn(),
}));

vi.mock("../../browser/pw-ai.js", () => ({
  navigateViaPlaywright: vi.fn().mockResolvedValue({ url: "https://example.com" }),
}));

vi.mock("../../browser/control-service.js", () => ({
  getBrowserControlState: vi.fn().mockReturnValue({
    resolved: {
      profiles: {
        default: { cdpUrl: "ws://localhost:9222" },
      },
    },
  }),
}));

describe("browser.navigate Tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Tool Definition", () => {
    it("should have correct name", () => {
      expect(name).toBe("browser.navigate");
      expect(tool.name).toBe("browser.navigate");
    });

    it("should have description", () => {
      expect(tool.description).toContain("Navigate");
    });

    it("should have required url parameter", () => {
      expect(tool.inputSchema.required).toContain("url");
    });

    it("should have waitUntil options", () => {
      expect(tool.inputSchema.properties?.waitUntil).toBeDefined();
      const waitUntilProp = tool.inputSchema.properties?.waitUntil as { enum?: string[] };
      expect(waitUntilProp.enum).toContain("load");
      expect(waitUntilProp.enum).toContain("networkidle");
    });
  });

  describe("URL Validation", () => {
    it("should reject invalid URL format", async () => {
      vi.mocked(urlFilter.validateUrl).mockReturnValue({
        valid: false,
        reason: "Invalid URL format",
      });

      await expect(execute({ url: "not-a-valid-url" })).rejects.toThrow(MCPErrorException);
    });

    it("should reject non-HTTPS URLs by default", async () => {
      vi.mocked(urlFilter.validateUrl).mockReturnValue({
        valid: false,
        reason: "HTTPS is required",
      });

      await expect(execute({ url: "http://example.com" })).rejects.toThrow(MCPErrorException);
    });

    it("should reject URLs not in allowlist", async () => {
      vi.mocked(urlFilter.validateUrl).mockReturnValue({
        valid: true,
        url: "https://blocked.com",
      });
      vi.mocked(urlFilter.isUrlAllowed).mockReturnValue(false);

      await expect(execute({ url: "https://blocked.com" })).rejects.toThrow(MCPErrorException);
    });
  });

  describe("Successful Navigation", () => {
    it("should navigate to valid HTTPS URL", async () => {
      vi.mocked(urlFilter.validateUrl).mockReturnValue({
        valid: true,
        url: "https://example.com",
      });
      vi.mocked(urlFilter.isUrlAllowed).mockReturnValue(true);

      const { navigateViaPlaywright } = await import("../../browser/pw-ai.js");

      const result = await execute({ url: "https://example.com" });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect((result.content[0] as { text: string }).text).toContain("Successfully navigated");
      expect(navigateViaPlaywright).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://example.com",
        }),
      );
    });

    it("should respect timeout parameter", async () => {
      vi.mocked(urlFilter.validateUrl).mockReturnValue({
        valid: true,
        url: "https://example.com",
      });
      vi.mocked(urlFilter.isUrlAllowed).mockReturnValue(true);

      const { navigateViaPlaywright } = await import("../../browser/pw-ai.js");

      await execute({ url: "https://example.com", timeout: 15000 });

      expect(navigateViaPlaywright).toHaveBeenCalledWith(
        expect.objectContaining({
          timeoutMs: 15000,
        }),
      );
    });

    it("should use provided cdpUrl", async () => {
      vi.mocked(urlFilter.validateUrl).mockReturnValue({
        valid: true,
        url: "https://example.com",
      });
      vi.mocked(urlFilter.isUrlAllowed).mockReturnValue(true);

      const { navigateViaPlaywright } = await import("../../browser/pw-ai.js");

      await execute({ url: "https://example.com", cdpUrl: "ws://custom:9222" });

      expect(navigateViaPlaywright).toHaveBeenCalledWith(
        expect.objectContaining({
          cdpUrl: "ws://custom:9222",
        }),
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle navigation errors", async () => {
      vi.mocked(urlFilter.validateUrl).mockReturnValue({
        valid: true,
        url: "https://example.com",
      });
      vi.mocked(urlFilter.isUrlAllowed).mockReturnValue(true);

      const { navigateViaPlaywright } = await import("../../browser/pw-ai.js");
      vi.mocked(navigateViaPlaywright).mockRejectedValue(new Error("Navigation timeout"));

      await expect(execute({ url: "https://example.com" })).rejects.toThrow(MCPErrorException);
    });
  });
});
