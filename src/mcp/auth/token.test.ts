/**
 * Authentication Token Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as config from "../config.js";
import {
  extractBearerToken,
  validateToken,
  createToken,
  revokeToken,
  hasPermission,
} from "./token.js";

vi.mock("../config.js", () => ({
  loadMcpConfig: vi.fn().mockReturnValue({
    auth: {
      mode: "token",
      token: "test-token-123",
      useGatewayAuth: false,
    },
  }),
}));

vi.mock("../security/audit.js", () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

describe("Authentication Token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("extractBearerToken", () => {
    it("should extract token from Bearer header", () => {
      const token = extractBearerToken("Bearer test-token");
      expect(token).toBe("test-token");
    });

    it("should extract token from lowercase bearer", () => {
      const token = extractBearerToken("bearer test-token");
      expect(token).toBe("test-token");
    });

    it("should return raw token if no Bearer prefix", () => {
      const token = extractBearerToken("raw-token");
      expect(token).toBe("raw-token");
    });

    it("should return null for empty header", () => {
      const token = extractBearerToken("");
      expect(token).toBeNull();
    });

    it("should return null for undefined header", () => {
      const token = extractBearerToken(undefined);
      expect(token).toBeNull();
    });

    it("should handle extra whitespace", () => {
      const token = extractBearerToken("  Bearer   token-with-spaces  ");
      expect(token).toBe("token-with-spaces");
    });
  });

  describe("validateToken", () => {
    it("should allow any token when auth mode is none", async () => {
      vi.mocked(config.loadMcpConfig).mockReturnValue({
        auth: { mode: "none" },
      });

      const result = await validateToken("any-token");

      expect(result.success).toBe(true);
      expect(result.clientId).toBe("anonymous");
    });

    it("should validate configured token", async () => {
      const result = await validateToken("test-token-123");

      expect(result.success).toBe(true);
      expect(result.permissions).toContain("browser.navigate");
    });

    it("should reject invalid token", async () => {
      const result = await validateToken("wrong-token");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid");
    });

    it("should validate token from file", async () => {
      vi.mocked(config.loadMcpConfig).mockReturnValue({
        auth: { tokenFile: "/path/to/token" },
      });

      const fs = await import("node:fs");
      vi.spyOn(fs, "readFileSync").mockReturnValue("file-token");

      const result = await validateToken("file-token");

      expect(result.success).toBe(true);
    });
  });

  describe("createToken", () => {
    it("should create a new token", async () => {
      const token = await createToken("client-1");

      expect(token).toBeDefined();
      expect(token).toContain("mcp_");
    });

    it("should create token with custom permissions", async () => {
      const token = await createToken("client-1", ["browser.navigate"]);

      const result = await validateToken(token);
      expect(result.permissions).toEqual(["browser.navigate"]);
    });

    it("should create token with expiration", async () => {
      const token = await createToken("client-1", undefined, 1);

      // Immediately should work
      const result = await validateToken(token);
      expect(result.success).toBe(true);
    });
  });

  describe("revokeToken", () => {
    it("should revoke existing token", async () => {
      const token = await createToken("client-1");
      const revoked = await revokeToken(token);

      expect(revoked).toBe(true);

      const result = await validateToken(token);
      expect(result.success).toBe(false);
    });

    it("should return false for non-existent token", async () => {
      const revoked = await revokeToken("non-existent");
      expect(revoked).toBe(false);
    });
  });

  describe("hasPermission", () => {
    it("should return true for exact permission match", () => {
      expect(hasPermission(["browser.navigate"], "browser.navigate")).toBe(true);
    });

    it("should return true for wildcard permission", () => {
      expect(hasPermission(["browser.*"], "browser.navigate")).toBe(true);
      expect(hasPermission(["browser.*"], "browser.click")).toBe(true);
    });

    it("should return false without permissions", () => {
      expect(hasPermission(undefined, "browser.navigate")).toBe(false);
    });

    it("should return false for missing permission", () => {
      expect(hasPermission(["browser.click"], "browser.navigate")).toBe(false);
    });

    it("should handle empty permissions array", () => {
      expect(hasPermission([], "browser.navigate")).toBe(false);
    });
  });
});
