/**
 * QuantumReef Integration Module
 *
 * Exports for dual-memory integration with QuantumReef orchestrator.
 */

// Task Dispatcher
export {
  QuantumReefTaskDispatcher,
  taskDispatcher,
  type TaskCategory,
  type TaskDispatchInput,
  type TaskDispatchResult,
} from "./task-dispatcher.js";

// Protocol Extensions
export {
  createTaskDispatchMessage,
  createTaskProgressMessage,
  createPMVerdictMessage,
  validateMessage,
  parseMessage,
  serializeMessage,
  type MessageType,
  type TaskDispatchMessage,
  type TaskProgressMessage,
  type TaskCompleteMessage,
  type PMVerdictMessage,
  type ErrorMessage,
  type QuantumReefMessage,
} from "./protocol-extensions.js";

// Progress Bridge
export {
  ProgressBridge,
  progressBridge,
  type ProgressBridgeConfig,
  type ProgressEvent,
} from "./progress-bridge.js";

// Version
export const QUANTUMREEF_INTEGRATION_VERSION = "1.0.0";
