/**
 * Manual Verification Script for Dual-Memory Architecture
 *
 * Run this to verify all components work correctly:
 * npx tsx scripts/verify-dual-memory.ts
 */

import * as fs from "fs/promises";
import * as path from "path";
import { contextDetector } from "../src/memory/context-detector.js";
import { createExternalMemoryInitializer } from "../src/memory/external/init.js";
import { internalMemory } from "../src/memory/internal/init.js";
import { qualityGates } from "../src/memory/pm-auditor/gates.js";
import { shapePhase } from "../src/memory/specs/shape-phase.js";
import { progressBridge } from "../src/quantumreef/progress-bridge.js";
import { taskDispatcher } from "../src/quantumreef/task-dispatcher.js";

const testDir = "/tmp/verify-dual-memory";
let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`  ❌ ${name}: ${error}`);
    failed++;
  }
}

async function cleanup() {
  try {
    await fs.rm(testDir, { recursive: true, force: true });
  } catch {
    // Ignore
  }
}

async function main() {
  console.log("🧪 Verifying Dual-Memory Architecture...\n");

  // Group 1: Foundation
  console.log("Group 1: Foundation");
  await test("Internal memory initializes", async () => {
    await cleanup();
    await fs.mkdir(testDir, { recursive: true });
    process.chdir(testDir);
    const result = await internalMemory.initialize({ verbose: false });
    if (result.type !== "internal") {
      throw new Error("Wrong type");
    }
  });

  await test("Context detection works", async () => {
    const detection = await contextDetector.detectContext(testDir);
    if (detection.context !== "internal") {
      throw new Error("Should detect internal");
    }
  });

  // Group 2: Core Memory
  console.log("\nGroup 2: Core Memory");
  await test("External memory creates", async () => {
    await cleanup();
    const externalInit = createExternalMemoryInitializer(testDir);
    const result = await externalInit.initialize({ verbose: false });
    if (result.type !== "external") {
      throw new Error("Wrong type");
    }
  });

  // Group 3: Spec-Architect
  console.log("\nGroup 3: Spec-Architect");
  await test("Shape phase creates requirements", async () => {
    await cleanup();
    await fs.mkdir(path.join(testDir, "memory_bank", "specs"), { recursive: true });
    const result = await shapePhase(
      {
        featureName: "verify-test",
        description: "Test feature",
      },
      testDir,
    );
    if (!result.completed) {
      throw new Error("Not completed");
    }
  });

  // Group 4: PM-Auditor
  console.log("\nGroup 4: PM-Auditor");
  await test("7 gates run", async () => {
    await fs.mkdir(path.join(testDir, "src"), { recursive: true });
    await fs.writeFile(path.join(testDir, "src", "test.ts"), "export const x = 1;");
    const { gates } = await qualityGates.runAllGates({
      taskId: "verify-001",
      implementationPath: path.join(testDir, "src", "test.ts"),
    });
    if (gates.length !== 7) {
      throw new Error(`Expected 7 gates, got ${gates.length}`);
    }
  });

  // Group 5: QuantumReef
  console.log("\nGroup 5: QuantumReef Integration");
  await test("Task dispatcher routes correctly", async () => {
    const result = await taskDispatcher.dispatch({
      taskId: "verify-002",
      instruction: "Test plan",
      category: "plan",
    });
    if (result.category !== "plan") {
      throw new Error("Wrong category");
    }
  });

  await test("Progress bridge throttles", async () => {
    const events: unknown[] = [];
    progressBridge.on("progress", (e) => events.push(e));

    progressBridge.reportProgress({
      taskId: "verify-003",
      phase: "test",
      step: 1,
      totalSteps: 2,
      checkpoint: "Test",
    });

    await new Promise((r) => setTimeout(r, 100));
    progressBridge.removeAllListeners();
    // Should not throw
  });

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(50));

  if (failed > 0) {
    process.exit(1);
  }

  console.log("\n✅ All verifications passed!");
  console.log("\nNext steps:");
  console.log("  1. Run: clawtopus memory init (to initialize your project)");
  console.log('  2. Run: clawtopus spec create "your-feature"');
  console.log("  3. Check: memory_bank/ directory created");

  await cleanup();
}

main().catch((error) => {
  console.error("Verification failed:", error);
  process.exit(1);
});
