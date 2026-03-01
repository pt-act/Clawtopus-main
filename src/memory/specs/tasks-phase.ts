/**
 * Spec-Architect Integration - Tasks Phase
 *
 * Phase 3: Break down spec into tasks with dependencies.
 * Creates tasks.md with iteration estimates.
 */

import * as fs from "fs/promises";
import * as path from "path";
import { contextDetector } from "../context-detector.js";
import { shapePhase } from "./shape-phase.js";
import { writePhase } from "./write-phase.js";

export interface TasksPhaseInput {
  featureName: string;
  specPath: string;
  validationTiers?: boolean; // Include PBT validation
}

export interface TaskGroup {
  name: string;
  tasks: string[];
  dependencies: string[];
  estimatedIterations: number;
}

export interface TasksPhaseOutput {
  tasksPath: string;
  featureName: string;
  totalIterations: number;
  taskGroups: TaskGroup[];
  completed: boolean;
}

export class TasksPhase {
  private memoryBankPath: string;

  constructor(memoryBankPath: string) {
    this.memoryBankPath = memoryBankPath;
  }

  /**
   * Execute Tasks phase: Create task breakdown
   */
  async execute(input: TasksPhaseInput): Promise<TasksPhaseOutput> {
    const { featureName, specPath, validationTiers = true } = input;

    // Read spec
    const spec = await fs.readFile(specPath, "utf-8");

    // Generate task groups based on spec analysis
    const taskGroups = this.generateTaskGroups(spec, validationTiers);

    // Calculate total iterations
    const totalIterations = taskGroups.reduce((sum, group) => sum + group.estimatedIterations, 0);

    // Create tasks.md
    const tasks = this.generateTasks(featureName, taskGroups, totalIterations);
    const specDir = path.dirname(specPath);
    const tasksPath = path.join(specDir, "tasks.md");

    await fs.writeFile(tasksPath, tasks, "utf-8");

    return {
      tasksPath,
      featureName,
      totalIterations,
      taskGroups,
      completed: true,
    };
  }

  /**
   * Generate task groups from spec analysis
   */
  private generateTaskGroups(spec: string, validationTiers: boolean): TaskGroup[] {
    // This is a simplified version - real implementation would parse spec more intelligently
    const groups: TaskGroup[] = [
      {
        name: "Foundation",
        tasks: [
          "Set up directory structure",
          "Create type definitions",
          "Implement core utilities",
        ],
        dependencies: [],
        estimatedIterations: 2,
      },
      {
        name: "Core Implementation",
        tasks: ["Implement main functionality", "Add error handling", "Write unit tests"],
        dependencies: ["Foundation"],
        estimatedIterations: 3,
      },
      {
        name: "Integration",
        tasks: ["Connect to existing systems", "Add integration tests", "Update documentation"],
        dependencies: ["Core Implementation"],
        estimatedIterations: 2,
      },
    ];

    if (validationTiers) {
      groups.push({
        name: "Validation",
        tasks: [
          "Add focused tests (2-8 per component)",
          "Add property-based tests (PBT)",
          "Run smoke tests",
        ],
        dependencies: ["Core Implementation"],
        estimatedIterations: 2,
      });
    }

    return groups;
  }

  /**
   * Generate tasks.md document
   */
  private generateTasks(
    featureName: string,
    taskGroups: TaskGroup[],
    totalIterations: number,
  ): string {
    const now = new Date().toISOString();

    let taskContent = `# ${featureName} - Task Breakdown

> **Total Estimate**: ${totalIterations} iterations  
> **Parallel Groups**: ${taskGroups.length}  
> **Generated**: ${now}

---

## Dependency Graph

\`\`\`
`;

    // Add ASCII dependency graph
    taskGroups.forEach((group, index) => {
      const deps =
        group.dependencies.length > 0 ? ` ← [depends: ${group.dependencies.join(", ")}]` : "";
      taskContent += `${index + 1}. ${group.name} (${group.estimatedIterations} iter)${deps}\n`;
    });

    taskContent += `\`\`\`

---

## Task Groups

`;

    // Add each task group
    taskGroups.forEach((group, index) => {
      taskContent += `### Group ${index + 1}: ${group.name} (${group.estimatedIterations} iterations)

**Tasks**:
`;
      group.tasks.forEach((task, tIndex) => {
        taskContent += `${index + 1}.${tIndex + 1}. ${task}\n`;
      });

      if (group.dependencies.length > 0) {
        taskContent += `
**Depends On**: ${group.dependencies.join(", ")}
`;
      }

      taskContent += `
**Tests** (Orion standard: 2-8 per component):
- [ ] 
- [ ] 

---

`;
    });

    taskContent += `## Critical Path

\`\`\`
${taskGroups.map((g) => g.name).join(" → ")}
\`\`\`

**Total**: ${totalIterations} iterations minimum

## Orion Standards

- **Component Size**: Max 400 lines per file
- **Tests**: 2-8 strategic tests per component (not exhaustive)
- **Estimates**: In iterations (1 iteration = design → code → test → refine)
- **Focused Testing**: Max 34 tests per feature total

## Parallelization Strategy

${taskGroups.map((g, i) => `- Group ${i + 1} (${g.name})`).join("\n")}

**Can Parallelize**: After Group 1 completes, Groups 2+ can work simultaneously

---

*Tasks complete. Ready for implementation →*  
*Next: PM-Auditor gates*
`;

    return taskContent;
  }

  /**
   * Factory: Create TasksPhase for current context
   */
  static async create(cwd: string = process.cwd()): Promise<TasksPhase> {
    const detection = await contextDetector.detectContext(cwd);
    const memoryPath = detection.internalPath || detection.externalPath;

    if (!memoryPath) {
      throw new Error("No memory bank found. Initialize memory first.");
    }

    return new TasksPhase(memoryPath);
  }
}

// Export factory
export async function tasksPhase(
  input: TasksPhaseInput,
  cwd: string = process.cwd(),
): Promise<TasksPhaseOutput> {
  const phase = await TasksPhase.create(cwd);
  return phase.execute(input);
}

// Export unified spec-architect workflow
export async function runSpecArchitect(
  featureName: string,
  description: string,
  cwd: string = process.cwd(),
): Promise<{
  shape: import("./shape-phase.js").ShapePhaseOutput;
  write: import("./write-phase.js").WritePhaseOutput;
  tasks: TasksPhaseOutput;
}> {
  // Phase 1: Shape
  const shape = await shapePhase({ featureName, description }, cwd);

  // Phase 2: Write
  const write = await writePhase({ featureName, requirementsPath: shape.requirementsPath }, cwd);

  // Phase 3: Tasks
  const tasks = await tasksPhase({ featureName, specPath: write.specPath }, cwd);

  return { shape, write, tasks };
}
