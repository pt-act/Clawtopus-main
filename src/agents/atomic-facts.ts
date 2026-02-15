import type { AgentMessage } from "@mariozechner/pi-agent-core";

export interface AtomicFact {
  id: string;
  timestamp: number;
  subject: string;
  predicate: string;
  object: string;
  context: string;
  sessionId: string;
  importance: number;
}

export interface CompactionFacts {
  sessionId: string;
  facts: AtomicFact[];
  timestamp: number;
}

const FACT_EXTRACTION_PATTERNS = [
  { pattern: /(\w+)\s+(created|built|implemented|added)\s+(.+)/i, predicate: "created", importance: 0.9 },
  { pattern: /(\w+)\s+(fixed|resolved|bug)\s+(.+)/i, predicate: "fixed", importance: 0.85 },
  { pattern: /(\w+)\s+(decided|chose|chosen)\s+(.+)/i, predicate: "decided", importance: 0.9 },
  { pattern: /(\w+)\s+(uses?|using|utilizes?)\s+(.+)/i, predicate: "uses", importance: 0.8 },
  { pattern: /(\w+)\s+(depends on|requires|needs)\s+(.+)/i, predicate: "depends on", importance: 0.85 },
  { pattern: /(\w+)\s+(stored|saved|persisted)\s+(.+)/i, predicate: "stores", importance: 0.75 },
  { pattern: /(\w+)\s+(exposed|provides?|offers?)\s+(.+)/i, predicate: "provides", importance: 0.8 },
  { pattern: /(\w+)\s+(called|named|referenced as)\s+(.+)/i, predicate: "called", importance: 0.7 },
  { pattern: /(\w+)\s+(handled|managed|processed)\s+(.+)/i, predicate: "handles", importance: 0.75 },
  { pattern: /(\w+)\s+(generated|produced|returned)\s+(.+)/i, predicate: "generates", importance: 0.7 },
];

function extractTextFromMessage(message: AgentMessage): string {
  const content = (message as { content?: unknown }).content;
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === "string") {
          return block;
        }
        if (typeof block === "object" && block !== null) {
          return (block as { text?: string }).text || "";
        }
        return "";
      })
      .join(" ");
  }
  if (typeof content === "object" && content !== null) {
    return (content as { text?: string }).text || "";
  }
  return "";
}

function extractFactsFromText(text: string, sessionId: string, timestamp: number): AtomicFact[] {
  const facts: AtomicFact[] = [];
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    
    for (const { pattern, predicate, importance } of FACT_EXTRACTION_PATTERNS) {
      const match = trimmed.match(pattern);
      if (match && match.length >= 4) {
        const subject = match[1].trim();
        const object = match[3].trim().slice(0, 100);
        
        if (subject.length > 2 && object.length > 2) {
          facts.push({
            id: `fact-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            timestamp,
            subject,
            predicate,
            object,
            context: trimmed.slice(0, 200),
            sessionId,
            importance,
          });
          break;
        }
      }
    }
  }

  return facts;
}

export function extractAtomicFacts(
  messages: AgentMessage[],
  sessionId: string,
): AtomicFact[] {
  const facts: AtomicFact[] = [];
  const now = Date.now();

  for (const message of messages) {
    const text = extractTextFromMessage(message);
    if (text.length < 20) {
      continue;
    }

    const timestamp = message.timestamp
      ? typeof message.timestamp === "number"
        ? message.timestamp
        : now
      : now;

    const extracted = extractFactsFromText(text, sessionId, timestamp);
    facts.push(...extracted);
  }

  const uniqueFacts = new Map<string, AtomicFact>();
  for (const fact of facts) {
    const key = `${fact.subject}:${fact.predicate}:${fact.object.slice(0, 30)}`;
    if (!uniqueFacts.has(key)) {
      uniqueFacts.set(key, fact);
    } else {
      const existing = uniqueFacts.get(key)!;
      if (fact.importance > existing.importance) {
        uniqueFacts.set(key, fact);
      }
    }
  }

  return Array.from(uniqueFacts.values()).toSorted((a, b) => b.importance - a.importance);
}

export function formatFactsAsSummary(facts: AtomicFact[]): string {
  if (facts.length === 0) {
    return "No key facts extracted.";
  }

  const lines: string[] = ["## Key Facts"];

  const bySubject = new Map<string, AtomicFact[]>();
  for (const fact of facts) {
    const existing = bySubject.get(fact.subject) || [];
    existing.push(fact);
    bySubject.set(fact.subject, existing);
  }

  for (const [subject, subjectFacts] of bySubject) {
    lines.push(`\n### ${subject}`);
    for (const fact of subjectFacts.slice(0, 5)) {
      lines.push(`- ${fact.predicate} ${fact.object}`);
    }
  }

  return lines.join("\n");
}

export function factsToContext(facts: AtomicFact[], maxFacts = 10): string {
  if (facts.length === 0) {
    return "";
  }

  const selected = facts.slice(0, maxFacts);
  const lines: string[] = ["## Session Facts (from previous context)"];

  for (const fact of selected) {
    lines.push(`- **${fact.subject}** ${fact.predicate} ${fact.object}`);
    if (fact.context !== fact.object) {
      lines.push(`  - Context: ${fact.context.slice(0, 100)}`);
    }
  }

  return lines.join("\n");
}
