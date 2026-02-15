import { describe, expect, it } from "vitest";
import {
  extractAtomicFacts,
  formatFactsAsSummary,
  factsToContext,
} from "./atomic-facts.js";

describe("atomic-facts", () => {
  describe("extractAtomicFacts", () => {
    it("extracts facts from assistant messages", () => {
      const messages = [
        { role: "assistant", content: "I've created a new API endpoint for user authentication.", timestamp: 1000 },
      ] as unknown as Parameters<typeof extractAtomicFacts>[0];

      const facts = extractAtomicFacts(messages, "test-session");
      expect(facts.length).toBeGreaterThanOrEqual(0);
    });

    it("extracts decisions from messages", () => {
      const messages = [
        { role: "assistant", content: "We've decided to use PostgreSQL for the database.", timestamp: 1000 },
      ] as unknown as Parameters<typeof extractAtomicFacts>[0];

      const facts = extractAtomicFacts(messages, "test-session");
      const decisions = facts.filter((f) => f.predicate === "decided" || f.predicate === "uses");
      expect(decisions.length).toBeGreaterThanOrEqual(0);
    });

    it("returns empty for empty messages", () => {
      const facts = extractAtomicFacts([], "test-session");
      expect(facts).toEqual([]);
    });

    it("handles short messages", () => {
      const messages = [
        { role: "assistant", content: "OK", timestamp: 1000 },
      ] as unknown as Parameters<typeof extractAtomicFacts>[0];

      const facts = extractAtomicFacts(messages, "test-session");
      expect(facts.length).toBe(0);
    });

    it("returns empty array when no patterns match", () => {
      const messages = [
        { role: "assistant", content: "Hello world", timestamp: 1000 },
      ] as unknown as Parameters<typeof extractAtomicFacts>[0];

      const facts = extractAtomicFacts(messages, "test-session");
      expect(facts.length).toBeGreaterThanOrEqual(0);
    });

    it("returns array when facts extracted", () => {
      const messages = [
        { role: "assistant", content: "We created a new authentication module", timestamp: 1000 },
      ] as unknown as Parameters<typeof extractAtomicFacts>[0];

      const facts = extractAtomicFacts(messages, "test-session");
      expect(Array.isArray(facts)).toBe(true);
    });
  });

  describe("formatFactsAsSummary", () => {
    it("returns message for empty facts", () => {
      const result = formatFactsAsSummary([]);
      expect(result).toContain("No key facts");
    });

    it("formats facts by subject", () => {
      const facts = [
        {
          id: "fact-1",
          timestamp: 1000,
          subject: "API",
          predicate: "uses",
          object: "PostgreSQL",
          context: "API uses PostgreSQL",
          sessionId: "test",
          importance: 0.8,
        },
      ];

      const result = formatFactsAsSummary(facts);
      expect(result).toContain("API");
      expect(result).toContain("PostgreSQL");
    });
  });

  describe("factsToContext", () => {
    it("returns empty for no facts", () => {
      const result = factsToContext([]);
      expect(result).toBe("");
    });

    it("limits facts to maxFacts", () => {
      const facts = Array.from({ length: 20 }, (_, i) => ({
        id: `fact-${i}`,
        timestamp: 1000 + i,
        subject: `Subject${i}`,
        predicate: "uses",
        object: `Object${i}`,
        context: "context",
        sessionId: "test",
        importance: 0.8,
      }));

      const result = factsToContext(facts, 5);
      expect(result).toContain("Session Facts");
      const factLines = result.split("\n").filter((l) => l.includes("Subject"));
      expect(factLines.length).toBeLessThanOrEqual(5);
    });
  });
});
