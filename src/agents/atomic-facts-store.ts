import fs from "node:fs";
import path from "node:path";
import { resolveStateDir } from "../config/paths.js";
import type { AtomicFact } from "./atomic-facts.js";

const FACTS_DIR = "memory";
const FACTS_FILE = "atomic-facts.json";

function resolveFactsDir(): string {
  return path.join(resolveStateDir(), FACTS_DIR);
}

function resolveFactsPath(): string {
  return path.join(resolveFactsDir(), FACTS_FILE);
}

export interface AtomicFactsStore {
  facts: AtomicFact[];
  lastUpdated: number;
}

export function loadAtomicFacts(): AtomicFactsStore {
  const factsPath = resolveFactsPath();
  try {
    if (fs.existsSync(factsPath)) {
      const data = fs.readFileSync(factsPath, "utf-8");
      return JSON.parse(data) as AtomicFactsStore;
    }
  } catch (error) {
    console.error("Failed to load atomic facts:", error);
  }
  return { facts: [], lastUpdated: Date.now() };
}

export function saveAtomicFacts(store: AtomicFactsStore): void {
  const factsDir = resolveFactsDir();
  const factsPath = resolveFactsPath();

  try {
    const stateDir = resolveStateDir();
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }
    if (!fs.existsSync(factsDir)) {
      fs.mkdirSync(factsDir, { recursive: true });
    }
    fs.writeFileSync(factsPath, JSON.stringify(store, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save atomic facts:", error);
    throw error;
  }
}

export function addAtomicFacts(newFacts: AtomicFact[]): AtomicFactsStore {
  const store = loadAtomicFacts();
  const existingIds = new Set(store.facts.map((f) => f.id));

  for (const fact of newFacts) {
    if (!existingIds.has(fact.id)) {
      store.facts.push(fact);
    }
  }

  store.lastUpdated = Date.now();

  const maxFacts = 500;
  if (store.facts.length > maxFacts) {
    store.facts = store.facts
      .toSorted((a, b) => b.importance - a.importance)
      .slice(0, maxFacts);
  }

  saveAtomicFacts(store);
  return store;
}

export function getFactsBySession(sessionId: string): AtomicFact[] {
  const store = loadAtomicFacts();
  return store.facts.filter((f) => f.sessionId === sessionId);
}

export function getFactsBySubject(subject: string): AtomicFact[] {
  const store = loadAtomicFacts();
  const normalized = subject.toLowerCase();
  return store.facts.filter(
    (f) => f.subject.toLowerCase().includes(normalized),
  );
}

export function searchFacts(query: string, limit = 10): AtomicFact[] {
  const store = loadAtomicFacts();
  const normalized = query.toLowerCase();

  const scored = store.facts.map((fact) => {
    let score = 0;
    if (fact.subject.toLowerCase().includes(normalized)) {
      score += 3;
    }
    if (fact.predicate.toLowerCase().includes(normalized)) {
      score += 2;
    }
    if (fact.object.toLowerCase().includes(normalized)) {
      score += 2;
    }
    if (fact.context.toLowerCase().includes(normalized)) {
      score += 1;
    }
    score += fact.importance;
    return { fact, score };
  });

  return scored
    .toSorted((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.fact);
}

export function clearAtomicFacts(): void {
  saveAtomicFacts({ facts: [], lastUpdated: Date.now() });
}
