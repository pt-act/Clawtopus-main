/**
 * Script Sandbox Security Tests
 */

import { describe, it, expect } from "vitest";
import { isScriptAllowed, sanitizeScript, getScriptBlockReason } from "./script-sandbox.js";

describe("Script Sandbox Security", () => {
  describe("isScriptAllowed", () => {
    it("should allow safe JavaScript", () => {
      expect(isScriptAllowed("1 + 2")).toBe(true);
      expect(isScriptAllowed("document.querySelector('div')")).toBe(true);
      expect(isScriptAllowed("return el.textContent")).toBe(true);
    });

    it("should block eval()", () => {
      expect(isScriptAllowed("eval('alert(1)')")).toBe(false);
      expect(isScriptAllowed("eval ( 'code' )")).toBe(false);
    });

    it("should block Function constructor", () => {
      expect(isScriptAllowed("new Function('return 1')")).toBe(false);
      expect(isScriptAllowed("Function('alert(1)')")).toBe(false);
    });

    it("should block document.write", () => {
      expect(isScriptAllowed("document.write('<script>')")).toBe(false);
    });

    it("should block XMLHttpRequest", () => {
      expect(isScriptAllowed("new XMLHttpRequest()")).toBe(false);
    });

    it("should block fetch", () => {
      expect(isScriptAllowed("fetch('/api/data')")).toBe(false);
    });

    it("should block WebSocket", () => {
      expect(isScriptAllowed("new WebSocket('ws://example.com')")).toBe(false);
    });

    it("should block localStorage", () => {
      expect(isScriptAllowed("localStorage.setItem('key', 'value')")).toBe(false);
    });

    it("should block sessionStorage", () => {
      expect(isScriptAllowed("sessionStorage.getItem('key')")).toBe(false);
    });

    it("should block postMessage", () => {
      expect(isScriptAllowed("window.postMessage('data', '*')")).toBe(false);
    });

    it("should block location manipulation", () => {
      expect(isScriptAllowed("location.href = 'https://evil.com'")).toBe(false);
    });

    it("should block window.open", () => {
      expect(isScriptAllowed("window.open('https://evil.com')")).toBe(false);
    });

    it("should block Workers", () => {
      expect(isScriptAllowed("new Worker('worker.js')")).toBe(false);
    });

    it("should block Service Workers", () => {
      expect(isScriptAllowed("navigator.serviceWorker.register('sw.js')")).toBe(false);
    });

    it("should block innerHTML assignment", () => {
      expect(isScriptAllowed("el.innerHTML = '<script>alert(1)</script>'")).toBe(false);
    });

    it("should block script tags", () => {
      expect(isScriptAllowed("<script>alert(1)</script>")).toBe(false);
    });
  });

  describe("sanitizeScript", () => {
    it("should remove single-line comments", () => {
      const result = sanitizeScript("1 + 2 // comment");
      expect(result).not.toContain("//");
    });

    it("should remove multi-line comments", () => {
      const result = sanitizeScript("1 + /* comment */ 2");
      expect(result).not.toContain("/*");
    });

    it("should replace blocked patterns with placeholder", () => {
      const result = sanitizeScript("eval('test')");
      expect(result).toContain("blocked");
    });
  });

  describe("getScriptBlockReason", () => {
    it("should return reason for blocked script", () => {
      const reason = getScriptBlockReason("eval('test')");
      expect(reason).toBeTruthy();
      expect(reason).toContain("Blocked pattern");
    });

    it("should return null for allowed script", () => {
      const reason = getScriptBlockReason("1 + 2");
      expect(reason).toBeNull();
    });
  });
});
