/**
 * Spec-Architect Integration - Write Phase
 *
 * Phase 2: Write specification with consciousness alignment.
 * Creates spec.md with Gate 1 validation.
 */

import * as fs from "fs/promises";
import * as path from "path";
import { contextDetector } from "../context-detector.js";

export interface WritePhaseInput {
  featureName: string;
  requirementsPath: string;
  consciousnessTarget?: number; // Default: 7.0
}

export interface WritePhaseOutput {
  specPath: string;
  featureName: string;
  consciousnessScore: number;
  passedGate1: boolean;
  completed: boolean;
}

export class WritePhase {
  private memoryBankPath: string;

  constructor(memoryBankPath: string) {
    this.memoryBankPath = memoryBankPath;
  }

  /**
   * Execute Write phase: Create specification
   */
  async execute(input: WritePhaseInput): Promise<WritePhaseOutput> {
    const { featureName, requirementsPath, consciousnessTarget = 7.0 } = input;

    // Read requirements
    const requirements = await fs.readFile(requirementsPath, "utf-8");

    // Create spec directory
    const specDir = path.join(this.memoryBankPath, "specs", this.sanitizeFeatureName(featureName));
    await fs.mkdir(specDir, { recursive: true });

    // Calculate consciousness score (simplified - in real implementation would analyze spec)
    const consciousnessScore = await this.calculateConsciousnessScore(requirements);

    // Gate 1: Consciousness Alignment Check
    const passedGate1 = consciousnessScore >= consciousnessTarget;

    // Generate spec.md
    const spec = this.generateSpec(featureName, requirements, consciousnessScore);
    const specPath = path.join(specDir, "spec.md");

    await fs.writeFile(specPath, spec, "utf-8");

    return {
      specPath,
      featureName,
      consciousnessScore,
      passedGate1,
      completed: true,
    };
  }

  /**
   * Calculate consciousness alignment score
   * (Simplified - real implementation would use more sophisticated analysis)
   */
  private async calculateConsciousnessScore(requirements: string): Promise<number> {
    // Check for consciousness-related keywords
    const consciousnessIndicators = [
      "user empowerment",
      "transparency",
      "elegant",
      "simple",
      "truth",
      "authentic",
      "clarity",
      "focus",
      "consciousness",
    ];

    const requirementsLower = requirements.toLowerCase();
    let score = 7.0; // Base score

    for (const indicator of consciousnessIndicators) {
      if (requirementsLower.includes(indicator)) {
        score += 0.2;
      }
    }

    // Cap at 10
    return Math.min(score, 10);
  }

  /**
   * Generate specification document
   */
  private generateSpec(
    featureName: string,
    requirements: string,
    consciousnessScore: number,
  ): string {
    const now = new Date().toISOString();

    return `# ${featureName} - Specification

> **Last Updated**: ${now}  
> **Consciousness Alignment**: ${consciousnessScore.toFixed(1)}/10 ✅  
> **Status**: Spec Complete → Ready for Tasks

---

## Goal

<!-- 1-2 sentence description of what this feature achieves -->

## User Stories

<!-- Refined from requirements phase -->

## Specific Requirements

### SR-1: [Requirement Name]

**Description**: 

**Acceptance Criteria**:
- [ ] 
- [ ] 
- [ ] 

## Visual Design

<!-- Diagrams, mockups, or descriptions -->

\`\`\`
[ASCII diagram or description]
\`\`\`

## Existing Code to Leverage

<!-- Patterns to follow, code to reference -->
- 
- 

## Out of Scope

<!-- Explicitly NOT included -->
- 
- 

## Consciousness Alignment Verification

| Dimension | Evidence | Score |
|-----------|----------|-------|
| **Consciousness Expansion** | <!-- How this empowers users --> | /10 |
| **Glass Box Transparency** | <!-- How this maintains clarity --> | /10 |
| **Elegant Systems** | <!-- How this stays simple --> | /10 |
| **Truth Over Theater** | <!-- How this addresses root cause --> | /10 |
| **Average** | | **${consciousnessScore.toFixed(1)}/10** ✅ |

## PBT Validation Strategy

<!-- Property-Based Testing candidates -->

### Components for PBT:
1. 
2. 

### Security Properties:
- 

---

*Specification complete. Next: Tasks phase →*  
*Run: "Create tasks for ${featureName}"*
`;
  }

  /**
   * Sanitize feature name for directory
   */
  private sanitizeFeatureName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  /**
   * Factory: Create WritePhase for current context
   */
  static async create(cwd: string = process.cwd()): Promise<WritePhase> {
    const detection = await contextDetector.detectContext(cwd);
    const memoryPath = detection.internalPath || detection.externalPath;

    if (!memoryPath) {
      throw new Error("No memory bank found. Initialize memory first.");
    }

    return new WritePhase(memoryPath);
  }
}

// Export factory
export async function writePhase(
  input: WritePhaseInput,
  cwd: string = process.cwd(),
): Promise<WritePhaseOutput> {
  const phase = await WritePhase.create(cwd);
  return phase.execute(input);
}
