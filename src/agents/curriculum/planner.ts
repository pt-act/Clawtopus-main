import fs from "node:fs";
import path from "node:path";
import { resolveStateDir } from "../../config/paths.js";

const CURRICULUM_DIR = "curriculum";

function resolveCurriculumDir(): string {
  return path.join(resolveStateDir(), VOYAGER_DIR, CURRICULUM_DIR);
}

const VOYAGER_DIR = "voyager";

export interface CurriculumModule {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  topics: string[];
  prerequisites: string[];
}

export interface Curriculum {
  id: string;
  name: string;
  description: string;
  target: string;
  modules: CurriculumModule[];
  createdAt: number;
  updatedAt: number;
}

export function analyzeCodebaseStructure(workspaceDir: string): {
  languages: string[];
  frameworks: string[];
  structure: string[];
} {
  const languages = new Set<string>();
  const frameworks = new Set<string>();
  const structure: string[] = [];

  try {
    if (!fs.existsSync(workspaceDir)) {
      return { languages: [], frameworks: [], structure: [] };
    }

    const entries = fs.readdirSync(workspaceDir);
    structure.push(...entries.filter((e) => !e.startsWith(".")));

    for (const entry of entries) {
      if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
        languages.add("TypeScript");
      } else if (entry.endsWith(".js") || entry.endsWith(".jsx")) {
        languages.add("JavaScript");
      } else if (entry.endsWith(".py")) {
        languages.add("Python");
      } else if (entry.endsWith(".go")) {
        languages.add("Go");
      } else if (entry.endsWith(".rs")) {
        languages.add("Rust");
      } else if (entry.endsWith(".java")) {
        languages.add("Java");
      }
    }

    for (const entry of entries) {
      const lower = entry.toLowerCase();
      if (lower.includes("react")) {
        frameworks.add("React");
      }
      if (lower.includes("vue")) {
        frameworks.add("Vue");
      }
      if (lower.includes("angular")) {
        frameworks.add("Angular");
      }
      if (lower.includes("express")) {
        frameworks.add("Express");
      }
      if (lower.includes("fastapi")) {
        frameworks.add("FastAPI");
      }
      if (lower.includes("django")) {
        frameworks.add("Django");
      }
      if (lower.includes("next")) {
        frameworks.add("Next.js");
      }
      if (lower.includes("nest")) {
        frameworks.add("NestJS");
      }
    }
  } catch (error) {
    console.error("Failed to analyze codebase:", error);
  }

  return {
    languages: Array.from(languages),
    frameworks: Array.from(frameworks),
    structure,
  };
}

export function generateCurriculum(
  target: string,
  analysis: ReturnType<typeof analyzeCodebaseStructure>,
): Curriculum {
  const id = `curriculum-${Date.now()}`;
  const modules: CurriculumModule[] = [];

  const baseModules: CurriculumModule[] = [
    {
      id: `${id}-intro`,
      title: "Project Introduction",
      description: "Understand the project structure and purpose",
      difficulty: "beginner",
      estimatedMinutes: 15,
      topics: ["Project overview", "Directory structure", "Key files"],
      prerequisites: [],
    },
    {
      id: `${id}-setup`,
      title: "Development Setup",
      description: "Set up your local development environment",
      difficulty: "beginner",
      estimatedMinutes: 30,
      topics: ["Environment setup", "Dependencies", "Running the project"],
      prerequisites: ["intro"],
    },
    {
      id: `${id}-core`,
      title: "Core Concepts",
      description: "Learn the core concepts and architecture",
      difficulty: "intermediate",
      estimatedMinutes: 45,
      topics: ["Architecture", "Data flow", "Key components"],
      prerequisites: ["setup"],
    },
    {
      id: `${id}-features`,
      title: "Features Overview",
      description: "Explore the main features and functionality",
      difficulty: "intermediate",
      estimatedMinutes: 60,
      topics: ["Feature breakdown", "User flows", "API endpoints"],
      prerequisites: ["core"],
    },
    {
      id: `${id}-contributing`,
      title: "Contributing Guide",
      description: "Learn how to contribute to the project",
      difficulty: "advanced",
      estimatedMinutes: 45,
      topics: ["Code standards", "Testing", "Pull requests"],
      prerequisites: ["features"],
    },
  ];

  for (const mod of baseModules) {
    modules.push(mod);
  }

  if (analysis.frameworks.length > 0) {
    modules.push({
      id: `${id}-frameworks`,
      title: "Framework Deep Dive",
      description: `Explore ${analysis.frameworks.join(", ")} usage`,
      difficulty: "intermediate",
      estimatedMinutes: 60,
      topics: analysis.frameworks.map((f) => `${f} patterns`),
      prerequisites: ["features"],
    });
  }

  return {
    id,
    name: `${target} Learning Curriculum`,
    description: `Comprehensive curriculum for learning ${target}`,
    target,
    modules,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function saveCurriculum(curriculum: Curriculum): void {
  try {
    const stateDir = resolveStateDir();
    const voyagerDir = path.join(stateDir, VOYAGER_DIR);
    const fullPath = path.join(voyagerDir, CURRICULUM_DIR);

    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    const curriculumPath = path.join(fullPath, `${curriculum.id}.json`);
    fs.writeFileSync(curriculumPath, JSON.stringify(curriculum, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save curriculum:", error);
    throw error;
  }
}

export function loadCurriculum(id: string): Curriculum | null {
  const curriculumDir = resolveCurriculumDir();

  try {
    const curriculumPath = path.join(curriculumDir, `${id}.json`);
    if (fs.existsSync(curriculumPath)) {
      const data = fs.readFileSync(curriculumPath, "utf-8");
      return JSON.parse(data) as Curriculum;
    }
  } catch (error) {
    console.error("Failed to load curriculum:", error);
  }

  return null;
}

export function listCurriculums(): Curriculum[] {
  const curriculumDir = resolveCurriculumDir();
  const curriculums: Curriculum[] = [];

  try {
    if (!fs.existsSync(curriculumDir)) {
      return curriculums;
    }

    const files = fs.readdirSync(curriculumDir);
    for (const file of files) {
      if (file.endsWith(".json")) {
        const curriculumPath = path.join(curriculumDir, file);
        const data = fs.readFileSync(curriculumPath, "utf-8");
        curriculums.push(JSON.parse(data) as Curriculum);
      }
    }
  } catch (error) {
    console.error("Failed to list curriculums:", error);
  }

  return curriculums.toSorted((a, b) => b.updatedAt - a.updatedAt);
}

export function formatCurriculumAsMarkdown(curriculum: Curriculum): string {
  const lines: string[] = [
    `# ${curriculum.name}`,
    "",
    curriculum.description,
    "",
    "## Modules",
    "",
  ];

  for (const mod of curriculum.modules) {
    lines.push(`### ${mod.title}`);
    lines.push("");
    lines.push(`**Difficulty**: ${mod.difficulty}`);
    lines.push(`**Est. Time**: ${mod.estimatedMinutes} minutes`);
    lines.push("");
    lines.push(mod.description);
    lines.push("");
    lines.push("**Topics**:");
    for (const topic of mod.topics) {
      lines.push(`- ${topic}`);
    }
    if (mod.prerequisites.length > 0) {
      lines.push("");
      lines.push("**Prerequisites**:");
      for (const prereq of mod.prerequisites) {
        lines.push(`- ${prereq}`);
      }
    }
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}
