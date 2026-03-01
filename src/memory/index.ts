export { MemoryIndexManager } from "./manager.js";
export type {
  MemoryEmbeddingProbeResult,
  MemorySearchManager,
  MemorySearchResult,
} from "./types.js";
export { getMemorySearchManager, type MemorySearchManagerResult } from "./search-manager.js";

// Dual-Memory Architecture (New)
export {
  // Core types
  type MemoryContext,
  type MemoryBankConfig,
  type InternalMemoryBank,
  type ExternalMemoryBank,
  type SpecPhase,
  type SpecContext,
  type GateStatus,
  type VerdictType,
  type QualityGate,
  type PMVerdict,
  type MemoryInitOptions,
  type ContextDetectionResult,
} from "./dual-memory-types.js";

// Internal memory (platform development)
export { InternalMemoryInitializer, internalMemory } from "./internal/init.js";

// External memory (user projects)
export { ExternalMemoryInitializer, createExternalMemoryInitializer } from "./external/init.js";

// Context detection
export { ContextDetector, contextDetector } from "./context-detector.js";

// Initialization triggers
export {
  memoryTriggers,
  initializeOnFirstTask,
  initializeOnPlan,
  isInitializationNeeded,
  getInitializationStatus,
} from "./triggers.js";

// Spec-Architect
export {
  ShapePhase,
  shapePhase,
  WritePhase,
  writePhase,
  TasksPhase,
  tasksPhase,
  runSpecArchitect,
  type ShapePhaseInput,
  type ShapePhaseOutput,
  type WritePhaseInput,
  type WritePhaseOutput,
  type TaskGroup,
  type TasksPhaseInput,
  type TasksPhaseOutput,
} from "./specs/index.js";

// PM-Auditor
export {
  QualityGates,
  qualityGates,
  VerdictGenerator,
  verdictGenerator,
  type GateCheckInput,
  type GateCheckResult,
  type VerdictInput,
} from "./pm-auditor/index.js";
