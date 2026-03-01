/**
 * Context Detection Logic
 *
 * Detects whether running in internal (platform) or external (user project) context.
 * Platform = memory_bank with MASTER_CONTEXT.md
 * User project = memory_bank with PROJECT_CONTEXT.md
 */

import * as fs from "fs/promises";
import * as path from "path";
import { MemoryContext, ContextDetectionResult } from "./dual-memory-types.js";

export class ContextDetector {
  /**
   * Detect memory context based on current working directory
   */
  async detectContext(cwd: string = process.cwd()): Promise<ContextDetectionResult> {
    // Look for memory_bank in current or parent directories
    const memoryBankPath = await this.findMemoryBank(cwd);

    if (memoryBankPath) {
      // Check if it's platform (internal) or user project (external)
      const isInternal = await this.isInternalMemoryBank(memoryBankPath);

      if (isInternal) {
        return {
          context: "internal",
          internalPath: memoryBankPath,
          message: "Running in Clawtopus platform development context (MASTER_CONTEXT.md found)",
        };
      } else {
        return {
          context: "external",
          externalPath: memoryBankPath,
          message: "Running in user project context (PROJECT_CONTEXT.md found)",
        };
      }
    }

    // No memory bank found - uninitialized
    return {
      context: "uninitialized",
      message: "No memory bank detected. Run initialization.",
    };
  }

  /**
   * Find memory_bank in current or parent directories
   */
  private async findMemoryBank(cwd: string): Promise<string | null> {
    let currentDir = path.resolve(cwd);
    const maxDepth = 10;
    let depth = 0;

    while (currentDir !== path.dirname(currentDir) && depth < maxDepth) {
      const memoryBankPath = path.join(currentDir, "memory_bank");
      const exists = await this.pathExists(memoryBankPath);

      if (exists) {
        return memoryBankPath;
      }

      currentDir = path.dirname(currentDir);
      depth++;
    }

    return null;
  }

  /**
   * Check if memory_bank is internal (platform) or external (user)
   * Internal has MASTER_CONTEXT.md
   * External has PROJECT_CONTEXT.md
   */
  private async isInternalMemoryBank(memoryBankPath: string): Promise<boolean> {
    const masterContextPath = path.join(memoryBankPath, "MASTER_CONTEXT.md");
    return await this.pathExists(masterContextPath);
  }

  /**
   * Get memory bank path for context
   */
  async getMemoryBankPath(
    context: MemoryContext,
    cwd: string = process.cwd(),
  ): Promise<string | null> {
    switch (context) {
      case "internal":
      case "external": {
        const detection = await this.detectContext(cwd);
        return detection.internalPath || detection.externalPath || null;
      }
      case "uninitialized":
      default:
        return null;
    }
  }

  /**
   * Check if path exists
   */
  private async pathExists(p: string): Promise<boolean> {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Quick check: Is this an uninitialized project?
   */
  async isUninitializedProject(cwd: string = process.cwd()): Promise<boolean> {
    const result = await this.detectContext(cwd);
    return result.context === "uninitialized";
  }
}

// Export singleton instance
export const contextDetector = new ContextDetector();
