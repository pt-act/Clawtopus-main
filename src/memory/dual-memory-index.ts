/**
 * Dual-Memory Architecture - Main Export
 *
 * Unified interface for internal (platform) and external (user project)
 * memory bank management with spec-architect and pm-auditor integration.
 */

// Types
export type {
  MemoryContext,
  MemoryBankConfig,
  InternalMemoryBank,
  ExternalMemoryBank,
  SpecPhase,
  SpecContext,
  GateStatus,
  VerdictType,
  QualityGate,
  PMVerdict,
  MemoryInitOptions,
  ContextDetectionResult,
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

// Version
export const DUAL_MEMORY_VERSION = "1.0.0";
