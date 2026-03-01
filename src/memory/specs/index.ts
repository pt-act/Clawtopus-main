/**
 * Spec-Architect Integration - Main Export
 *
 * 3-Phase workflow: Shape → Write → Tasks
 * With consciousness alignment and PBT enhancement.
 */

// Phase 1: Shape
export {
  ShapePhase,
  shapePhase,
  type ShapePhaseInput,
  type ShapePhaseOutput,
} from "./shape-phase.js";

// Phase 2: Write
export {
  WritePhase,
  writePhase,
  type WritePhaseInput,
  type WritePhaseOutput,
} from "./write-phase.js";

// Phase 3: Tasks
export {
  TasksPhase,
  tasksPhase,
  runSpecArchitect,
  type TaskGroup,
  type TasksPhaseInput,
  type TasksPhaseOutput,
} from "./tasks-phase.js";

// Version
export const SPEC_ARCHITECT_VERSION = "1.0.0";
