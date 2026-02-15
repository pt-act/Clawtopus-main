import { getScaffoldedSkills } from "./proposer.js";
import { getPatterns } from "./store.js";

export interface SkillSearchResult {
  type: "scaffold" | "pattern";
  id: string;
  name: string;
  description: string;
  score: number;
  triggers?: string[];
  tools?: string[];
}

export function searchSkills(query: string, limit = 5): SkillSearchResult[] {
  const normalizedQuery = query.toLowerCase();
  const results: SkillSearchResult[] = [];

  const skills = getScaffoldedSkills();
  for (const skill of skills) {
    let score = 0;

    if (skill.name.toLowerCase().includes(normalizedQuery)) {
      score += 5;
    }
    if (skill.description.toLowerCase().includes(normalizedQuery)) {
      score += 3;
    }
    if (skill.triggers) {
      for (const trigger of skill.triggers) {
        if (trigger.toLowerCase().includes(normalizedQuery)) {
          score += 4;
        }
      }
    }

    if (score > 0) {
      results.push({
        type: "scaffold",
        id: skill.id,
        name: skill.name,
        description: skill.description,
        score,
        triggers: skill.triggers,
      });
    }
  }

  const patterns = getPatterns();
  for (const pattern of patterns) {
    let score = 0;

    if (pattern.name.toLowerCase().includes(normalizedQuery)) {
      score += 4;
    }
    if (pattern.description.toLowerCase().includes(normalizedQuery)) {
      score += 2;
    }
    for (const tool of pattern.tools) {
      if (tool.toLowerCase().includes(normalizedQuery)) {
        score += 3;
      }
    }

    if (score > 0) {
      results.push({
        type: "pattern",
        id: pattern.id,
        name: pattern.name,
        description: pattern.description,
        score,
        tools: pattern.tools,
      });
    }
  }

  return results.toSorted((a, b) => b.score - a.score).slice(0, limit);
}

export function formatSearchResults(results: SkillSearchResult[]): string {
  if (results.length === 0) {
    return "No skills or patterns found.";
  }

  const lines: string[] = ["## Skill Search Results"];

  for (const result of results) {
    lines.push(`\n### ${result.name} (${result.type})`);
    lines.push(`Score: ${result.score}`);
    lines.push(`Description: ${result.description}`);
    if (result.triggers) {
      lines.push(`Triggers: ${result.triggers.join(", ")}`);
    }
    if (result.tools) {
      lines.push(`Tools: ${result.tools.join(" -> ")}`);
    }
  }

  return lines.join("\n");
}
