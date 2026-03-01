/**
 * QuantumReef Protocol Extensions
 *
 * WebSocket protocol extensions for spec/pm task events.
 * Defines message formats for task dispatch, progress, and verdicts.
 */

import type { TaskCategory } from "./task-dispatcher.js";

// Message types
export type MessageType =
  | "task.dispatch"
  | "task.progress"
  | "task.complete"
  | "pm.verdict"
  | "error";

// Base message interface
export interface BaseMessage {
  type: MessageType;
  timestamp: number;
  requestId: string;
}

// Task dispatch message (enhanced payload)
export interface TaskDispatchMessage extends BaseMessage {
  type: "task.dispatch";
  payload: {
    taskId: string;
    instruction: string;
    category: TaskCategory;
    specContext?: {
      phase: "shape" | "write" | "tasks";
      featureName: string;
      template?: string;
    };
    pmContext?: {
      auditOnComplete: boolean;
      milestone: string;
    };
    // Backward compatibility
    priority?: number;
    timeout?: number;
  };
}

// Task progress message (spec phases)
export interface TaskProgressMessage extends BaseMessage {
  type: "task.progress";
  payload: {
    taskId: string;
    phase: string;
    step: number;
    totalSteps: number;
    checkpoint: string;
    artifacts?: string[];
    percentComplete: number;
  };
}

// Task complete message
export interface TaskCompleteMessage extends BaseMessage {
  type: "task.complete";
  payload: {
    taskId: string;
    status: "success" | "error";
    artifacts: string[];
    error?: string;
    duration: number;
  };
}

// PM verdict message
export interface PMVerdictMessage extends BaseMessage {
  type: "pm.verdict";
  payload: {
    taskId: string;
    verdict: "APPROVE" | "APPROVE-WITH-CONDITIONS" | "REQUEST-CHANGES" | "BLOCKED";
    gates: {
      functional: string;
      determinism: string;
      observability: string;
      security: string;
      documentation: string;
      regression: string;
      pbt: string;
    };
    evidence: string[];
    nextActions: string[];
  };
}

// Error message
export interface ErrorMessage extends BaseMessage {
  type: "error";
  payload: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Union type for all messages
export type QuantumReefMessage =
  | TaskDispatchMessage
  | TaskProgressMessage
  | TaskCompleteMessage
  | PMVerdictMessage
  | ErrorMessage;

/**
 * Create task dispatch message
 */
export function createTaskDispatchMessage(
  taskId: string,
  instruction: string,
  category: TaskCategory,
  requestId: string,
  specContext?: TaskDispatchMessage["payload"]["specContext"],
  pmContext?: TaskDispatchMessage["payload"]["pmContext"],
): TaskDispatchMessage {
  return {
    type: "task.dispatch",
    timestamp: Date.now(),
    requestId,
    payload: {
      taskId,
      instruction,
      category,
      specContext,
      pmContext,
    },
  };
}

/**
 * Create task progress message
 */
export function createTaskProgressMessage(
  taskId: string,
  phase: string,
  step: number,
  totalSteps: number,
  checkpoint: string,
  requestId: string,
  artifacts?: string[],
): TaskProgressMessage {
  const percentComplete = Math.round((step / totalSteps) * 100);

  return {
    type: "task.progress",
    timestamp: Date.now(),
    requestId,
    payload: {
      taskId,
      phase,
      step,
      totalSteps,
      checkpoint,
      artifacts: artifacts || [],
      percentComplete,
    },
  };
}

/**
 * Create PM verdict message
 */
export function createPMVerdictMessage(
  taskId: string,
  verdict: PMVerdictMessage["payload"]["verdict"],
  gates: PMVerdictMessage["payload"]["gates"],
  evidence: string[],
  nextActions: string[],
  requestId: string,
): PMVerdictMessage {
  return {
    type: "pm.verdict",
    timestamp: Date.now(),
    requestId,
    payload: {
      taskId,
      verdict,
      gates,
      evidence,
      nextActions,
    },
  };
}

/**
 * Validate incoming message
 */
export function validateMessage(data: unknown): QuantumReefMessage | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }

  const msg = data as Partial<QuantumReefMessage>;

  // Check required fields
  if (!msg.type || !msg.timestamp || !msg.requestId) {
    return null;
  }

  // Validate based on type
  switch (msg.type) {
    case "task.dispatch":
      if (!msg.payload || typeof msg.payload.taskId !== "string") {
        return null;
      }
      break;
    case "task.progress":
      if (!msg.payload || typeof msg.payload.taskId !== "string") {
        return null;
      }
      break;
    case "pm.verdict":
      if (!msg.payload || typeof msg.payload.taskId !== "string") {
        return null;
      }
      break;
    default:
      return null;
  }

  return msg as QuantumReefMessage;
}

/**
 * Parse message from WebSocket data
 */
export function parseMessage(data: string): QuantumReefMessage | null {
  try {
    const parsed = JSON.parse(data);
    return validateMessage(parsed);
  } catch {
    return null;
  }
}

/**
 * Serialize message for WebSocket
 */
export function serializeMessage(message: QuantumReefMessage): string {
  return JSON.stringify(message);
}
