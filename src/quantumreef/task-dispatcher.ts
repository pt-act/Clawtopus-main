/**
 * QuantumReef Task Dispatcher
 *
 * Dispatches dual-memory tasks (plan, spec, tasks, audit) to appropriate handlers.
 * Integrates with QuantumReef orchestrator for remote execution.
 */

import { contextDetector } from "../memory/context-detector.js";
import { qualityGates, verdictGenerator } from "../memory/pm-auditor/index.js";
import { shapePhase, writePhase, tasksPhase } from "../memory/specs/index.js";

// Task categories for QuantumReef integration
export type TaskCategory = "plan" | "spec" | "tasks" | "audit" | "pm-review";

export interface TaskDispatchInput {
  taskId: string;
  instruction: string;
  category: TaskCategory;
  specContext?: {
    phase: "shape" | "write" | "tasks";
    featureName: string;
    description?: string;
    requirementsPath?: string;
    specPath?: string;
  };
  pmContext?: {
    auditOnComplete: boolean;
    milestone: string;
  };
}

export interface TaskDispatchResult {
  taskId: string;
  status: "success" | "error" | "pending";
  category: TaskCategory;
  artifacts?: string[];
  error?: string;
}

export class QuantumReefTaskDispatcher {
  private handlers: Map<TaskCategory, (input: TaskDispatchInput) => Promise<TaskDispatchResult>>;

  constructor() {
    this.handlers = new Map([
      ["plan", this.handlePlanTask.bind(this)],
      ["spec", this.handleSpecTask.bind(this)],
      ["tasks", this.handleTasksTask.bind(this)],
      ["audit", this.handleAuditTask.bind(this)],
      ["pm-review", this.handlePMReviewTask.bind(this)],
    ]);
  }

  /**
   * Dispatch task to appropriate handler
   */
  async dispatch(input: TaskDispatchInput): Promise<TaskDispatchResult> {
    const handler = this.handlers.get(input.category);

    if (!handler) {
      return {
        taskId: input.taskId,
        status: "error",
        category: input.category,
        error: `Unknown category: ${input.category}`,
      };
    }

    try {
      return await handler(input);
    } catch (error) {
      return {
        taskId: input.taskId,
        status: "error",
        category: input.category,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Handle 'plan' category - Shape phase
   */
  private async handlePlanTask(input: TaskDispatchInput): Promise<TaskDispatchResult> {
    const { featureName, description } = this.parseInstruction(input.instruction);

    const result = await shapePhase({
      featureName,
      description: description || "Feature to be defined",
    });

    return {
      taskId: input.taskId,
      status: "success",
      category: "plan",
      artifacts: [result.requirementsPath],
    };
  }

  /**
   * Handle 'spec' category - Write phase
   */
  private async handleSpecTask(input: TaskDispatchInput): Promise<TaskDispatchResult> {
    const { featureName } = this.parseInstruction(input.instruction);
    const requirementsPath = input.specContext?.requirementsPath;

    if (!requirementsPath) {
      throw new Error("specContext.requirementsPath required for spec task");
    }

    const result = await writePhase({
      featureName,
      requirementsPath,
    });

    return {
      taskId: input.taskId,
      status: result.passedGate1 ? "success" : "error",
      category: "spec",
      artifacts: [result.specPath],
    };
  }

  /**
   * Handle 'tasks' category - Tasks phase
   */
  private async handleTasksTask(input: TaskDispatchInput): Promise<TaskDispatchResult> {
    const { featureName } = this.parseInstruction(input.instruction);
    const specPath = input.specContext?.specPath;

    if (!specPath) {
      throw new Error("specContext.specPath required for tasks task");
    }

    const result = await tasksPhase({
      featureName,
      specPath,
    });

    return {
      taskId: input.taskId,
      status: "success",
      category: "tasks",
      artifacts: [result.tasksPath],
    };
  }

  /**
   * Handle 'audit' category - PM Auditor
   */
  private async handleAuditTask(input: TaskDispatchInput): Promise<TaskDispatchResult> {
    // Detect current context
    const detection = await contextDetector.detectContext();
    const memoryPath = detection.internalPath || detection.externalPath;

    if (!memoryPath) {
      throw new Error("No memory bank found");
    }

    // Run all gates
    const { gates } = await qualityGates.runAllGates({
      taskId: input.taskId,
      implementationPath: `${memoryPath}/../src`, // Default to src directory
    });

    // Generate verdict
    const verdict = await verdictGenerator.generateVerdict({
      taskId: input.taskId,
      gates,
      evidencePaths: [],
      milestone: input.pmContext?.milestone || "default",
    });

    return {
      taskId: input.taskId,
      status: verdict.verdict === "APPROVE" ? "success" : "error",
      category: "audit",
      artifacts: [], // Verdict saved to pm-ledger
    };
  }

  /**
   * Handle 'pm-review' category - Evidence analysis
   */
  private async handlePMReviewTask(input: TaskDispatchInput): Promise<TaskDispatchResult> {
    // Similar to audit but focused on evidence review
    return this.handleAuditTask(input);
  }

  /**
   * Parse instruction to extract feature name and description
   */
  private parseInstruction(instruction: string): { featureName: string; description?: string } {
    // Simple parsing: first sentence is feature name, rest is description
    const sentences = instruction.split(/[.!?]+/);
    const featureName = sentences[0].trim();
    const description = sentences.slice(1).join(". ").trim() || undefined;

    return { featureName, description };
  }

  /**
   * Get supported categories
   */
  getSupportedCategories(): TaskCategory[] {
    return Array.from(this.handlers.keys());
  }
}

// Export singleton
export const taskDispatcher = new QuantumReefTaskDispatcher();
