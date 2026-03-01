/**
 * Dual-Memory Architecture Types
 *
 * Defines the types for both internal (platform) and external (user project)
 * memory bank structures.
 */

export type MemoryContext = "internal" | "external" | "uninitialized";

export interface MemoryBankConfig {
  context: MemoryContext;
  path: string;
  initialized: boolean;
  version: number;
}

// Internal memory bank structure (~/.clawtopus/memory_bank/)
export interface InternalMemoryBank {
  type: "internal";
  path: string;
  files: {
    masterContext: string;
    developmentHistory: string;
    consciousnessLog: string;
    architecturalDecisions: string;
    powerActivationLog: string;
  };
  directories: {
    specs: string;
    pmLedger: string;
  };
}

// External memory bank structure (<project>/memory_bank/)
export interface ExternalMemoryBank {
  type: "external";
  path: string;
  files: {
    projectContext: string;
    userPreferences: string;
    projectState: string;
    developmentHistory: string;
    decisions: string;
    curriculum: string;
  };
  directories: {
    specs: string;
    pmLedger: string;
  };
}

// Spec-architect phase types
export type SpecPhase = "shape" | "write" | "tasks";

export interface SpecContext {
  phase: SpecPhase;
  featureName: string;
  template: string;
  requirements?: string;
}

// PM-Auditor types
export type GateStatus = "passed" | "failed" | "warning" | "not-evaluated";
export type VerdictType = "APPROVE" | "APPROVE-WITH-CONDITIONS" | "REQUEST-CHANGES" | "BLOCKED";

export interface QualityGate {
  name: string;
  status: GateStatus;
  evidence: string[];
  feedback?: string;
}

export interface PMVerdict {
  taskId: string;
  verdict: VerdictType;
  gates: {
    functional: GateStatus;
    determinism: GateStatus;
    observability: GateStatus;
    security: GateStatus;
    documentation: GateStatus;
    regression: GateStatus;
    pbt: GateStatus;
  };
  evidence: string[];
  nextActions: string[];
  timestamp: number;
}

// Memory initialization options
export interface MemoryInitOptions {
  force?: boolean;
  templates?: boolean;
  verbose?: boolean;
}

// Context detection result
export interface ContextDetectionResult {
  context: MemoryContext;
  internalPath?: string;
  externalPath?: string;
  message?: string;
}
