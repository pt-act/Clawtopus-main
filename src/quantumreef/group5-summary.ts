/**
 * QuantumReef Integration - Implementation Summary
 *
 * Group 5 Implementation Complete
 * Date: 2026-02-27
 */

import { progressBridge } from "./progress-bridge.js";
import { parseMessage, createTaskDispatchMessage } from "./protocol-extensions.js";
import { taskDispatcher } from "./task-dispatcher.js";

// Export all components
export { taskDispatcher, progressBridge, parseMessage, createTaskDispatchMessage };

/**
 * Usage Example:
 *
 * // Dispatch a plan task
 * const result = await taskDispatcher.dispatch({
 *   taskId: 'task-001',
 *   instruction: 'Create user dashboard',
 *   category: 'plan',
 * });
 *
 * // Stream progress
 * progressBridge.on('progress', (event) => {
 *   console.log(`Progress: ${event.payload.percentComplete}%`);
 * });
 *
 * // Parse WebSocket message
 * const message = parseMessage(wsData);
 * if (message?.type === 'task.dispatch') {
 *   await taskDispatcher.dispatch(message.payload);
 * }
 */

// Version
export const GROUP5_VERSION = "1.0.0";
