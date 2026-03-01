/**
 * QuantumReef Progress Bridge
 *
 * Streams spec/pm progress via WebSocket with throttling and chunking.
 * Optimized for mobile delivery (small messages, real-time updates).
 */

import { EventEmitter } from "events";
import { createTaskProgressMessage } from "./protocol-extensions.js";

export interface ProgressBridgeConfig {
  throttleMs: number;
  chunkSize: number;
  maxQueuedEvents: number;
}

export interface ProgressEvent {
  taskId: string;
  phase: string;
  step: number;
  totalSteps: number;
  checkpoint: string;
  artifacts?: string[];
}

/**
 * Progress Bridge for QuantumReef integration
 * Throttles and chunks progress events for WebSocket delivery
 */
export class ProgressBridge extends EventEmitter {
  private config: ProgressBridgeConfig;
  private pendingEvents: Map<string, ProgressEvent[]>;
  private lastEmitTime: Map<string, number>;
  private emitTimers: Map<string, NodeJS.Timeout>;

  constructor(config: Partial<ProgressBridgeConfig> = {}) {
    super();
    this.config = {
      throttleMs: config.throttleMs || 500,
      chunkSize: config.chunkSize || 300,
      maxQueuedEvents: config.maxQueuedEvents || 10,
    };
    this.pendingEvents = new Map();
    this.lastEmitTime = new Map();
    this.emitTimers = new Map();
  }

  /**
   * Report progress for a task
   */
  reportProgress(event: ProgressEvent): void {
    const { taskId } = event;

    // Queue event
    if (!this.pendingEvents.has(taskId)) {
      this.pendingEvents.set(taskId, []);
    }
    const queue = this.pendingEvents.get(taskId)!;
    queue.push(event);

    // Limit queue size
    if (queue.length > this.config.maxQueuedEvents) {
      queue.shift(); // Remove oldest
    }

    // Schedule emit
    this.scheduleEmit(taskId);
  }

  /**
   * Report spec phase checkpoint
   */
  reportSpecCheckpoint(
    taskId: string,
    phase: "shape" | "write" | "tasks",
    step: number,
    totalSteps: number,
    checkpoint: string,
    artifacts?: string[],
  ): void {
    this.reportProgress({
      taskId,
      phase: `spec:${phase}`,
      step,
      totalSteps,
      checkpoint,
      artifacts,
    });
  }

  /**
   * Report PM gate evaluation
   */
  reportPMGate(
    taskId: string,
    gateName: string,
    status: "passed" | "failed" | "warning",
    evidence?: string[],
  ): void {
    this.reportProgress({
      taskId,
      phase: `pm:gate`,
      step: 1,
      totalSteps: 7,
      checkpoint: `${gateName}: ${status}`,
      artifacts: evidence,
    });
  }

  /**
   * Report evidence collection progress
   */
  reportEvidenceCollection(
    taskId: string,
    evidenceType: string,
    collected: number,
    total: number,
  ): void {
    this.reportProgress({
      taskId,
      phase: "pm:evidence",
      step: collected,
      totalSteps: total,
      checkpoint: `Collecting ${evidenceType}: ${collected}/${total}`,
    });
  }

  /**
   * Schedule throttled emit
   */
  private scheduleEmit(taskId: string): void {
    const now = Date.now();
    const lastEmit = this.lastEmitTime.get(taskId) || 0;
    const timeSinceLastEmit = now - lastEmit;

    // Clear existing timer
    if (this.emitTimers.has(taskId)) {
      clearTimeout(this.emitTimers.get(taskId));
    }

    // Emit immediately if enough time has passed
    if (timeSinceLastEmit >= this.config.throttleMs) {
      this.flushEvents(taskId);
    } else {
      // Schedule delayed emit
      const delay = this.config.throttleMs - timeSinceLastEmit;
      const timer = setTimeout(() => {
        this.flushEvents(taskId);
      }, delay);
      this.emitTimers.set(taskId, timer);
    }
  }

  /**
   * Flush pending events for a task
   */
  private flushEvents(taskId: string): void {
    const queue = this.pendingEvents.get(taskId);
    if (!queue || queue.length === 0) {
      return;
    }

    // Get latest event (most representative)
    const latestEvent = queue[queue.length - 1];

    // Clear queue
    this.pendingEvents.set(taskId, []);

    // Update last emit time
    this.lastEmitTime.set(taskId, Date.now());

    // Create message
    const message = createTaskProgressMessage(
      latestEvent.taskId,
      latestEvent.phase,
      latestEvent.step,
      latestEvent.totalSteps,
      this.chunkText(latestEvent.checkpoint),
      taskId, // Use taskId as requestId for correlation
      latestEvent.artifacts,
    );

    // Emit
    this.emit("progress", message);
  }

  /**
   * Flush all pending events (for shutdown)
   */
  flushAll(): void {
    for (const taskId of this.pendingEvents.keys()) {
      this.flushEvents(taskId);
    }

    // Clear all timers
    for (const timer of this.emitTimers.values()) {
      clearTimeout(timer);
    }
    this.emitTimers.clear();
  }

  /**
   * Chunk text to max size
   */
  private chunkText(text: string): string {
    if (text.length <= this.config.chunkSize) {
      return text;
    }
    return text.substring(0, this.config.chunkSize) + "...";
  }

  /**
   * Get queue size for a task
   */
  getQueueSize(taskId: string): number {
    return this.pendingEvents.get(taskId)?.length || 0;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.flushAll();
    this.removeAllListeners();
    this.pendingEvents.clear();
    this.lastEmitTime.clear();
  }
}

// Export singleton with default config
export const progressBridge = new ProgressBridge();
