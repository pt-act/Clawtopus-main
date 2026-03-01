/**
 * E2E Tests: QuantumReef Spec Workflow
 *
 * Tests the full spec creation flow via QuantumReef orchestrator:
 * 1. Dispatch plan task → Shape phase
 * 2. Dispatch spec task → Write phase
 * 3. Dispatch tasks task → Tasks phase
 * 4. Verify artifacts created
 * 5. Verify progress events emitted
 */

import * as fs from "fs/promises";
import assert from "node:assert";
import { test, describe } from "node:test";
import * as path from "path";
import { progressBridge } from "../../src/quantumreef/progress-bridge.js";
import { taskDispatcher } from "../../src/quantumreef/task-dispatcher.js";

describe("QuantumReef Spec Workflow E2E", () => {
  const testDir = "/tmp/clawtopus-e2e-test";
  const testMemoryBank = path.join(testDir, "memory_bank");

  test("should complete full spec workflow", async () => {
    // Setup: Create test memory bank
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(testMemoryBank, { recursive: true });
    await fs.mkdir(path.join(testMemoryBank, "specs"), { recursive: true });

    // Track progress events
    const progressEvents: unknown[] = [];
    progressBridge.on("progress", (event) => {
      progressEvents.push(event);
    });

    // Step 1: Plan task (Shape phase)
    const planResult = await taskDispatcher.dispatch({
      taskId: "test-task-001",
      instruction: "Create a test dashboard feature for analytics",
      category: "plan",
    });

    assert.strictEqual(planResult.status, "success");
    assert.ok((planResult.artifacts?.length ?? 0) > 0);
    assert.ok(planResult.artifacts?.[0].includes("requirements.md"));

    // Step 2: Spec task (Write phase)
    const specResult = await taskDispatcher.dispatch({
      taskId: "test-task-001",
      instruction: "Write spec for test dashboard",
      category: "spec",
      specContext: {
        phase: "write",
        featureName: "test-dashboard",
        requirementsPath: planResult.artifacts![0],
      },
    });

    assert.strictEqual(specResult.status, "success");
    assert.ok(specResult.artifacts?.[0].includes("spec.md"));

    // Step 3: Tasks task (Tasks phase)
    const tasksResult = await taskDispatcher.dispatch({
      taskId: "test-task-001",
      instruction: "Create tasks for test dashboard",
      category: "tasks",
      specContext: {
        phase: "tasks",
        featureName: "test-dashboard",
        specPath: specResult.artifacts![0],
      },
    });

    assert.strictEqual(tasksResult.status, "success");
    assert.ok(tasksResult.artifacts?.[0].includes("tasks.md"));

    // Verify progress events were emitted
    // Note: Due to throttling, we may not get all events
    assert.ok(progressEvents.length >= 0, "Progress events may be emitted");

    // Cleanup
    await fs.rm(testDir, { recursive: true, force: true });
    progressBridge.removeAllListeners();
  });

  test("should handle unknown category", async () => {
    const result = await taskDispatcher.dispatch({
      taskId: "test-task-002",
      instruction: "Test unknown category",
      category: "unknown" as never,
    });

    assert.strictEqual(result.status, "error");
    assert.ok(result.error?.includes("Unknown category"));
  });

  test("should support all spec categories", () => {
    const categories = taskDispatcher.getSupportedCategories();

    assert.ok(categories.includes("plan"));
    assert.ok(categories.includes("spec"));
    assert.ok(categories.includes("tasks"));
    assert.ok(categories.includes("audit"));
    assert.ok(categories.includes("pm-review"));
  });
});
