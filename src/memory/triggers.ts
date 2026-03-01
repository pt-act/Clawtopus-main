/**
 * Memory Initialization Triggers
 *
 * Auto-initializes memory banks on first interaction.
 * Non-blocking, async initialization with progress indicators.
 */

import { contextDetector } from "./context-detector.js";
import { MemoryContext } from "./dual-memory-types.js";
import { createExternalMemoryInitializer } from "./external/init.js";
import { internalMemory } from "./internal/init.js";

export interface TriggerResult {
  initialized: boolean;
  context: MemoryContext;
  path?: string;
  message: string;
}

/**
 * Initialize memory on first task/command
 */
export async function initializeOnFirstTask(
  cwd: string = process.cwd(),
  options: { verbose?: boolean; force?: boolean } = {},
): Promise<TriggerResult> {
  const { verbose = false, force = false } = options;

  // Detect context
  const detection = await contextDetector.detectContext(cwd);

  switch (detection.context) {
    case "internal":
      // Initialize internal memory bank
      const internalResult = await internalMemory.initialize({
        force,
        templates: true,
        verbose,
      });

      return {
        initialized: true,
        context: "internal",
        path: internalResult.path,
        message: "Internal memory bank initialized for Clawtopus platform development",
      };

    case "external":
      // External already exists, just confirm
      return {
        initialized: false,
        context: "external",
        path: detection.externalPath || undefined,
        message: "External memory bank already exists",
      };

    case "uninitialized":
      // Create external memory bank for new project
      const externalInit = createExternalMemoryInitializer(cwd);
      const externalResult = await externalInit.initialize({
        force,
        templates: true,
        verbose,
      });

      return {
        initialized: true,
        context: "external",
        path: externalResult.path,
        message: "External memory bank auto-created for project",
      };

    default:
      return {
        initialized: false,
        context: "uninitialized",
        message: "Could not determine memory context",
      };
  }
}

/**
 * Initialize memory on plan command
 */
export async function initializeOnPlan(
  projectPath: string,
  options: { verbose?: boolean } = {},
): Promise<TriggerResult> {
  const { verbose = false } = options;

  // Always create external memory for plan commands
  const externalInit = createExternalMemoryInitializer(projectPath);
  const result = await externalInit.initialize({
    force: false,
    templates: true,
    verbose,
  });

  return {
    initialized: true,
    context: "external",
    path: result.path,
    message: "Memory bank ready for spec planning",
  };
}

/**
 * Check if initialization is needed
 */
export async function isInitializationNeeded(cwd: string = process.cwd()): Promise<boolean> {
  const detection = await contextDetector.detectContext(cwd);
  return detection.context === "uninitialized";
}

/**
 * Get initialization status
 */
export async function getInitializationStatus(cwd: string = process.cwd()): Promise<{
  context: MemoryContext;
  initialized: boolean;
  path?: string;
}> {
  const detection = await contextDetector.detectContext(cwd);

  return {
    context: detection.context,
    initialized: detection.context !== "uninitialized",
    path: detection.internalPath || detection.externalPath,
  };
}

// Export trigger functions
export const memoryTriggers = {
  initializeOnFirstTask,
  initializeOnPlan,
  isInitializationNeeded,
  getInitializationStatus,
};
