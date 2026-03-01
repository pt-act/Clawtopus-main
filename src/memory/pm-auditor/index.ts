/**
 * PM-Auditor - Main Export
 *
 * Evidence-based quality gates for feature validation.
 * 7 Gates: Functional, Determinism, Observability, Security,
 * Documentation, Regression, PBT.
 */

// Quality Gates
export { QualityGates, qualityGates, type GateCheckInput, type GateCheckResult } from "./gates.js";

// Verdict Generation
export { VerdictGenerator, verdictGenerator, type VerdictInput } from "./verdict-generator.js";

// Re-export types
export type { PMVerdict, QualityGate, GateStatus, VerdictType } from "../dual-memory-types.js";

// Version
export const PM_AUDITOR_VERSION = "1.0.0";
