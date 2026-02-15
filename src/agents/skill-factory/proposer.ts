import fs from "node:fs";
import path from "node:path";
import { resolveStateDir } from "../../config/paths.js";

const GENERATED_SKILLS_DIR = "skills";
const VOYAGER_DIR = "voyager";

function resolveGeneratedSkillsDir(): string {
  return path.join(resolveStateDir(), VOYAGER_DIR, GENERATED_SKILLS_DIR);
}

export interface SkillProposal {
  id: string;
  name: string;
  description: string;
  triggers: string[];
  workflow: string;
  createdAt: number;
  status: "proposed" | "scaffolded" | "rejected";
}

export interface SkillScaffold {
  id: string;
  name: string;
  description: string;
  triggers: string[];
  workflow: string;
  code?: string;
  dependencies?: string[];
  createdAt: number;
}

export function generateSkillProposal(
  patternName: string,
  tools: string[],
  description: string,
): SkillProposal {
  const id = `skill-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const name = patternName
    .replace(/\s+/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");

  const triggers = tools.map((t) => t.toLowerCase().replace(/[^a-z0-9]/g, ""));

  const workflow = `# ${patternName}

## Triggers
${triggers.map((t) => `- ${t}`).join("\n")}

## Workflow
1. Analyze the current task context
2. Execute ${tools.join(" -> ")}
3. Process results
4. Return final output

## Notes
- Generated from pattern: ${description}
- Tools used: ${tools.join(", ")}
`;

  return {
    id,
    name,
    description: `Skill for ${patternName}: ${description}`,
    triggers,
    workflow,
    createdAt: Date.now(),
    status: "proposed",
  };
}

export function scaffoldSkill(proposal: SkillProposal): SkillScaffold {
  try {
    const stateDir = resolveStateDir();
    const voyagerDir = path.join(stateDir, VOYAGER_DIR);
    const fullPath = path.join(voyagerDir, GENERATED_SKILLS_DIR);

    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  } catch (error) {
    console.error("Failed to create skills directory:", error);
  }

  const scaffold: SkillScaffold = {
    id: proposal.id,
    name: proposal.name,
    description: proposal.description,
    triggers: proposal.triggers,
    workflow: proposal.workflow,
    dependencies: [],
    createdAt: Date.now(),
  };

  return scaffold;
}

export function saveSkillScaffold(scaffold: SkillScaffold): void {
  try {
    const stateDir = resolveStateDir();
    const voyagerDir = path.join(stateDir, VOYAGER_DIR);
    const fullPath = path.join(voyagerDir, GENERATED_SKILLS_DIR);

    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    const skillPath = path.join(fullPath, `${scaffold.name}.json`);
    fs.writeFileSync(skillPath, JSON.stringify(scaffold, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save skill scaffold:", error);
    throw error;
  }
}

export function getProposedSkills(): SkillProposal[] {
  return [];
}

export function getScaffoldedSkills(): SkillScaffold[] {
  const skillsDir = resolveGeneratedSkillsDir();
  const skills: SkillScaffold[] = [];

  try {
    if (!fs.existsSync(skillsDir)) {
      return skills;
    }

    const files = fs.readdirSync(skillsDir);
    for (const file of files) {
      if (file.endsWith(".json")) {
        const skillPath = path.join(skillsDir, file);
        const data = fs.readFileSync(skillPath, "utf-8");
        skills.push(JSON.parse(data) as SkillScaffold);
      }
    }
  } catch (error) {
    console.error("Failed to load scaffolded skills:", error);
  }

  return skills;
}
