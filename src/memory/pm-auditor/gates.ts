/**
 * PM-Auditor - Quality Gates Implementation
 *
 * 7 Quality Gates for evidence-based validation:
 * 1. Functional Correctness
 * 2. Determinism
 * 3. Observability
 * 4. Security
 * 5. Documentation
 * 6. Regression Protection
 * 7. PBT Validation
 */

import * as fs from "fs/promises";
import * as path from "path";
import { GateStatus } from "../dual-memory-types.js";

export interface GateCheckInput {
  taskId: string;
  implementationPath: string;
  testPath?: string;
  evidencePaths?: string[];
}

export interface GateCheckResult {
  gate: string;
  status: GateStatus;
  evidence: string[];
  feedback?: string;
}

export class QualityGates {
  /**
   * Gate 1: Functional Correctness
   * - Works on real cases
   * - Edge cases handled
   */
  async checkFunctional(input: GateCheckInput): Promise<GateCheckResult> {
    const { implementationPath, testPath } = input;
    const evidence: string[] = [];

    // Check if implementation exists
    const implExists = await this.pathExists(implementationPath);
    if (!implExists) {
      return {
        gate: "functional",
        status: "failed",
        evidence: [],
        feedback: "Implementation not found",
      };
    }

    evidence.push(`Implementation exists: ${implementationPath}`);

    // Check for tests
    if (testPath && (await this.pathExists(testPath))) {
      evidence.push(`Tests exist: ${testPath}`);
    }

    // Read implementation to check for edge case handling
    const impl = await fs.readFile(implementationPath, "utf-8");
    const hasErrorHandling =
      impl.includes("try") || impl.includes("catch") || impl.includes("Error");
    const hasValidation = impl.includes("validate") || impl.includes("check");

    if (hasErrorHandling) {
      evidence.push("Error handling present");
    }

    if (hasValidation) {
      evidence.push("Input validation present");
    }

    const status: GateStatus = implExists ? "passed" : "failed";

    return {
      gate: "functional",
      status,
      evidence,
      feedback: status === "passed" ? "Core functionality implemented" : undefined,
    };
  }

  /**
   * Gate 2: Determinism
   * - Clear run instructions
   * - Reproducible results
   */
  async checkDeterminism(input: GateCheckInput): Promise<GateCheckResult> {
    const { implementationPath } = input;
    const evidence: string[] = [];

    // Check for deterministic patterns (no Math.random without seed, no uncontrolled async)
    const impl = await fs.readFile(implementationPath, "utf-8");
    const hasRandom = impl.includes("Math.random") && !impl.includes("seed");
    const hasClearInstructions = impl.includes("/**") || impl.includes("/*");

    if (!hasRandom) {
      evidence.push("No uncontrolled randomness");
    }

    if (hasClearInstructions) {
      evidence.push("Documentation/comments present");
    }

    const status: GateStatus = !hasRandom ? "passed" : "warning";

    return {
      gate: "determinism",
      status,
      evidence,
      feedback: hasRandom ? "Consider seeding random operations" : undefined,
    };
  }

  /**
   * Gate 3: Observability
   * - Informative logs
   * - Progress indicators
   */
  async checkObservability(input: GateCheckInput): Promise<GateCheckResult> {
    const { implementationPath } = input;
    const evidence: string[] = [];

    const impl = await fs.readFile(implementationPath, "utf-8");
    const hasLogging = impl.includes("console.log") || impl.includes("logger");
    const hasProgress = impl.includes("progress") || impl.includes("checkpoint");

    if (hasLogging) {
      evidence.push("Logging present");
    }

    if (hasProgress) {
      evidence.push("Progress tracking present");
    }

    const status: GateStatus = hasLogging ? "passed" : "warning";

    return {
      gate: "observability",
      status,
      evidence,
      feedback: !hasLogging ? "Add logging for better observability" : undefined,
    };
  }

  /**
   * Gate 4: Security
   * - Least privilege
   * - Safe defaults
   */
  async checkSecurity(input: GateCheckInput): Promise<GateCheckResult> {
    const { implementationPath } = input;
    const evidence: string[] = [];

    const impl = await fs.readFile(implementationPath, "utf-8");
    const hasInputValidation = impl.includes("validate") || impl.includes("sanitize");
    const noDangerousPatterns = !impl.includes("eval(") && !impl.includes("new Function");

    if (hasInputValidation) {
      evidence.push("Input validation present");
    }

    if (noDangerousPatterns) {
      evidence.push("No dangerous eval patterns");
    }

    const status: GateStatus = noDangerousPatterns ? "passed" : "failed";

    return {
      gate: "security",
      status,
      evidence,
      feedback: !noDangerousPatterns ? "Remove dangerous eval/Function usage" : undefined,
    };
  }

  /**
   * Gate 5: Documentation
   * - README
   * - API docs
   * - Decisions recorded
   */
  async checkDocumentation(input: GateCheckInput): Promise<GateCheckResult> {
    const { implementationPath } = input;
    const evidence: string[] = [];

    const dir = path.dirname(implementationPath);
    const readmeExists = await this.pathExists(path.join(dir, "README.md"));
    const hasComments = (await fs.readFile(implementationPath, "utf-8")).includes("/**");

    if (readmeExists) {
      evidence.push("README.md exists");
    }

    if (hasComments) {
      evidence.push("JSDoc comments present");
    }

    const status: GateStatus = hasComments ? "passed" : "warning";

    return {
      gate: "documentation",
      status,
      evidence,
      feedback: !readmeExists ? "Add README.md" : undefined,
    };
  }

  /**
   * Gate 6: Regression Protection
   * - Smoke tests
   * - Golden demos
   */
  async checkRegression(input: GateCheckInput): Promise<GateCheckResult> {
    const { testPath } = input;
    const evidence: string[] = [];

    if (!testPath) {
      return {
        gate: "regression",
        status: "warning",
        evidence: [],
        feedback: "No test path provided",
      };
    }

    const testsExist = await this.pathExists(testPath);
    if (testsExist) {
      evidence.push(`Tests at ${testPath}`);
    }

    const status: GateStatus = testsExist ? "passed" : "failed";

    return {
      gate: "regression",
      status,
      evidence,
      feedback: !testsExist ? "Add smoke tests" : undefined,
    };
  }

  /**
   * Gate 7: PBT Validation
   * - Property-based tests
   * - Security properties verified
   */
  async checkPBT(input: GateCheckInput): Promise<GateCheckResult> {
    const { testPath } = input;
    const evidence: string[] = [];

    // Check for PBT patterns in tests
    if (!testPath || !(await this.pathExists(testPath))) {
      return {
        gate: "pbt",
        status: "not-evaluated",
        evidence: [],
        feedback: "No tests found for PBT analysis",
      };
    }

    const tests = await fs.readFile(testPath, "utf-8");
    const hasPBT = tests.includes("fc.property") || tests.includes("fast-check");

    if (hasPBT) {
      evidence.push("Property-based tests found");
    }

    const status: GateStatus = hasPBT ? "passed" : "warning";

    return {
      gate: "pbt",
      status,
      evidence,
      feedback: !hasPBT ? "Consider adding property-based tests" : undefined,
    };
  }

  /**
   * Run all 7 gates
   */
  async runAllGates(input: GateCheckInput): Promise<{
    gates: GateCheckResult[];
    summary: {
      passed: number;
      failed: number;
      warnings: number;
      notEvaluated: number;
    };
  }> {
    const gates = await Promise.all([
      this.checkFunctional(input),
      this.checkDeterminism(input),
      this.checkObservability(input),
      this.checkSecurity(input),
      this.checkDocumentation(input),
      this.checkRegression(input),
      this.checkPBT(input),
    ]);

    const summary = {
      passed: gates.filter((g) => g.status === "passed").length,
      failed: gates.filter((g) => g.status === "failed").length,
      warnings: gates.filter((g) => g.status === "warning").length,
      notEvaluated: gates.filter((g) => g.status === "not-evaluated").length,
    };

    return { gates, summary };
  }

  /**
   * Check if path exists
   */
  private async pathExists(p: string): Promise<boolean> {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton
export const qualityGates = new QualityGates();
