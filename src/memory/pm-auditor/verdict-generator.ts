/**
 * PM-Auditor - Verdict Generator
 *
 * Generates PM verdicts based on quality gate results.
 * Creates verdict documentation and next actions.
 */

import * as fs from "fs/promises";
import * as path from "path";
import { PMVerdict, VerdictType, GateStatus } from "../dual-memory-types.js";
import { GateCheckResult } from "./gates.js";

export interface VerdictInput {
  taskId: string;
  gates: GateCheckResult[];
  evidencePaths: string[];
  milestone?: string;
}

export class VerdictGenerator {
  /**
   * Generate PM verdict based on gate results
   */
  async generateVerdict(input: VerdictInput): Promise<PMVerdict> {
    const { taskId, gates, evidencePaths } = input;

    // Determine verdict type based on gate results
    const verdict = this.determineVerdictType(gates);

    // Generate next actions based on failed/warning gates
    const nextActions = this.generateNextActions(gates);

    // Map gates to PMVerdict format
    const gateStatuses = this.mapGateStatuses(gates);

    return {
      taskId,
      verdict,
      gates: gateStatuses,
      evidence: evidencePaths,
      nextActions,
      timestamp: Date.now(),
    };
  }

  /**
   * Determine verdict type from gate results
   */
  private determineVerdictType(gates: GateCheckResult[]): VerdictType {
    const failedGates = gates.filter((g) => g.status === "failed");
    const warningGates = gates.filter((g) => g.status === "warning");

    // If any gates failed, determine severity
    if (failedGates.length > 0) {
      // Critical gates (functional, security) failing = BLOCKED
      const criticalFailed = failedGates.filter(
        (g) => g.gate === "functional" || g.gate === "security",
      );
      if (criticalFailed.length > 0) {
        return "BLOCKED";
      }
      return "REQUEST-CHANGES";
    }

    // If warnings exist, approve with conditions
    if (warningGates.length > 0) {
      return "APPROVE-WITH-CONDITIONS";
    }

    // All gates passed
    return "APPROVE";
  }

  /**
   * Generate next actions from gate results
   */
  private generateNextActions(gates: GateCheckResult[]): string[] {
    const actions: string[] = [];

    for (const gate of gates) {
      if (gate.status === "failed" || gate.status === "warning") {
        if (gate.feedback) {
          actions.push(`[${gate.gate}] ${gate.feedback}`);
        }
      }
    }

    return actions;
  }

  /**
   * Map gate results to PMVerdict format
   */
  private mapGateStatuses(gates: GateCheckResult[]): PMVerdict["gates"] {
    const mapStatus = (status: GateCheckResult["status"]): GateStatus => {
      if (status === "passed") {
        return "passed";
      }
      if (status === "failed") {
        return "failed";
      }
      if (status === "warning") {
        return "warning";
      }
      return "not-evaluated";
    };

    return {
      functional: mapStatus(gates.find((g) => g.gate === "functional")?.status || "not-evaluated"),
      determinism: mapStatus(
        gates.find((g) => g.gate === "determinism")?.status || "not-evaluated",
      ),
      observability: mapStatus(
        gates.find((g) => g.gate === "observability")?.status || "not-evaluated",
      ),
      security: mapStatus(gates.find((g) => g.gate === "security")?.status || "not-evaluated"),
      documentation: mapStatus(
        gates.find((g) => g.gate === "documentation")?.status || "not-evaluated",
      ),
      regression: mapStatus(gates.find((g) => g.gate === "regression")?.status || "not-evaluated"),
      pbt: mapStatus(gates.find((g) => g.gate === "pbt")?.status || "not-evaluated"),
    };
  }

  /**
   * Format verdict for display
   */
  formatVerdictForDisplay(verdict: PMVerdict): string {
    const lines: string[] = [
      "# PM Verdict",
      "",
      `**Task**: ${verdict.taskId}`,
      `**Verdict**: ${verdict.verdict}`,
      `**Date**: ${new Date(verdict.timestamp).toISOString()}`,
      "",
      "## Quality Gates",
      "",
      "| Gate | Status |",
      "|------|--------|",
      `| Functional | ${verdict.gates.functional} |`,
      `| Determinism | ${verdict.gates.determinism} |`,
      `| Observability | ${verdict.gates.observability} |`,
      `| Security | ${verdict.gates.security} |`,
      `| Documentation | ${verdict.gates.documentation} |`,
      `| Regression | ${verdict.gates.regression} |`,
      `| PBT | ${verdict.gates.pbt} |`,
      "",
    ];

    if (verdict.nextActions.length > 0) {
      lines.push("## Next Actions", "");
      for (const action of verdict.nextActions) {
        lines.push(`- [ ] ${action}`);
      }
      lines.push("");
    }

    if (verdict.evidence.length > 0) {
      lines.push("## Evidence", "");
      for (const evidence of verdict.evidence) {
        lines.push(`- ${evidence}`);
      }
      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * Save verdict to PM ledger
   */
  async saveVerdict(
    verdict: PMVerdict,
    pmLedgerPath: string,
    milestone: string = "default",
  ): Promise<string> {
    const evidenceDir = path.join(pmLedgerPath, "evidence", milestone);
    await fs.mkdir(evidenceDir, { recursive: true });

    const verdictPath = path.join(evidenceDir, "pm-verdict.md");
    const formatted = this.formatVerdictForDisplay(verdict);

    await fs.writeFile(verdictPath, formatted, "utf-8");

    return verdictPath;
  }
}

// Export singleton
export const verdictGenerator = new VerdictGenerator();
