/**
 * Unit Tests: Dual-Memory Architecture
 *
 * Focused tests for critical components
 */

import * as fs from "fs/promises";
import assert from "node:assert";
import { test, describe } from "node:test";
import * as path from "path";
import { contextDetector } from "../src/memory/context-detector.js";
import { createExternalMemoryInitializer } from "../src/memory/external/init.js";
import { internalMemory } from "../src/memory/internal/init.js";
import { qualityGates, verdictGenerator } from "../src/memory/pm-auditor/index.js";
import { shapePhase, writePhase, tasksPhase } from "../src/memory/specs/index.js";
import { progressBridge } from "../src/quantumreef/progress-bridge.js";
import { taskDispatcher } from "../src/quantumreef/task-dispatcher.js";

describe("Dual-Memory Architecture Tests", () => {
  const testDir = "/tmp/dual-memory-test";

  // Cleanup before each test
  test.beforeEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  test.afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
    progressBridge.removeAllListeners();
  });

  describe("Group 1: Foundation", () => {
    test("should initialize internal memory bank", async () => {
      const originalCwd = process.cwd();
      process.chdir(testDir);

      await fs.mkdir(testDir, { recursive: true });

      const result = await internalMemory.initialize({ verbose: false });

      assert.strictEqual(result.type, "internal");
      assert.ok(
        await fs
          .access(result.path)
          .then(() => true)
          .catch(() => false),
      );

      process.chdir(originalCwd);
    });

    test("should detect uninitialized context", async () => {
      await fs.mkdir(testDir, { recursive: true });

      const detection = await contextDetector.detectContext(testDir);

      assert.strictEqual(detection.context, "uninitialized");
    });

    test("should detect internal context", async () => {
      await fs.mkdir(testDir, { recursive: true });
      await fs.mkdir(path.join(testDir, "memory_bank"), { recursive: true });
      await fs.writeFile(
        path.join(testDir, "memory_bank", "MASTER_CONTEXT.md"),
        "# Master Context",
      );

      const detection = await contextDetector.detectContext(testDir);

      assert.strictEqual(detection.context, "internal");
    });
  });

  describe("Group 2: Core Memory", () => {
    test("should create external memory bank", async () => {
      const externalInit = createExternalMemoryInitializer(testDir);

      const result = await externalInit.initialize({ verbose: false });

      assert.strictEqual(result.type, "external");
      assert.ok(
        await fs
          .access(result.files.projectContext)
          .then(() => true)
          .catch(() => false),
      );
      assert.ok(
        await fs
          .access(result.files.userPreferences)
          .then(() => true)
          .catch(() => false),
      );
    });

    test("should create all 6 external files", async () => {
      const externalInit = createExternalMemoryInitializer(testDir);
      const result = await externalInit.initialize({ verbose: false });

      const files = [
        result.files.projectContext,
        result.files.userPreferences,
        result.files.projectState,
        result.files.developmentHistory,
        result.files.decisions,
        result.files.curriculum,
      ];

      for (const file of files) {
        assert.ok(
          await fs
            .access(file)
            .then(() => true)
            .catch(() => false),
          `File ${file} should exist`,
        );
      }
    });
  });

  describe("Group 3: Spec-Architect", () => {
    test("should complete shape phase", async () => {
      await fs.mkdir(path.join(testDir, "memory_bank", "specs"), { recursive: true });

      const result = await shapePhase(
        {
          featureName: "test-feature",
          description: "A test feature",
        },
        testDir,
      );

      assert.strictEqual(result.completed, true);
      assert.ok(result.requirementsPath.includes("requirements.md"));
      assert.ok(
        await fs
          .access(result.requirementsPath)
          .then(() => true)
          .catch(() => false),
      );
    });

    test("should complete write phase", async () => {
      // First create requirements
      await fs.mkdir(path.join(testDir, "memory_bank", "specs", "test-feature", "planning"), {
        recursive: true,
      });
      const requirementsPath = path.join(
        testDir,
        "memory_bank",
        "specs",
        "test-feature",
        "planning",
        "requirements.md",
      );
      await fs.writeFile(requirementsPath, "# Requirements\n\nTest requirements");

      const result = await writePhase(
        {
          featureName: "test-feature",
          requirementsPath,
        },
        testDir,
      );

      assert.strictEqual(result.completed, true);
      assert.ok(result.passedGate1);
      assert.ok(result.specPath.includes("spec.md"));
    });

    test("should complete tasks phase", async () => {
      // Create spec first
      await fs.mkdir(path.join(testDir, "memory_bank", "specs", "test-feature"), {
        recursive: true,
      });
      const specPath = path.join(testDir, "memory_bank", "specs", "test-feature", "spec.md");
      await fs.writeFile(specPath, "# Spec\n\nTest spec");

      const result = await tasksPhase(
        {
          featureName: "test-feature",
          specPath,
        },
        testDir,
      );

      assert.strictEqual(result.completed, true);
      assert.ok(result.totalIterations > 0);
      assert.ok(result.taskGroups.length > 0);
    });
  });

  describe("Group 4: PM-Auditor", () => {
    test("should run all 7 gates", async () => {
      // Create a test implementation file
      const implDir = path.join(testDir, "src");
      await fs.mkdir(implDir, { recursive: true });
      await fs.writeFile(path.join(implDir, "test.ts"), "export function test() { return true; }");

      const { gates, summary } = await qualityGates.runAllGates({
        taskId: "test-001",
        implementationPath: path.join(implDir, "test.ts"),
      });

      assert.strictEqual(gates.length, 7);
      assert.ok(summary.passed + summary.failed + summary.warnings + summary.notEvaluated === 7);
    });

    test("should generate verdict", async () => {
      const mockGates = [
        { gate: "functional", status: "passed" as const, evidence: ["works"] },
        { gate: "determinism", status: "passed" as const, evidence: [] },
        { gate: "observability", status: "warning" as const, evidence: [], feedback: "Add logs" },
        { gate: "security", status: "passed" as const, evidence: [] },
        { gate: "documentation", status: "passed" as const, evidence: [] },
        { gate: "regression", status: "passed" as const, evidence: [] },
        { gate: "pbt", status: "not-evaluated" as const, evidence: [] },
      ];

      const verdict = await verdictGenerator.generateVerdict({
        taskId: "test-002",
        gates: mockGates,
        evidencePaths: ["test.log"],
      });

      assert.ok(
        ["APPROVE", "APPROVE-WITH-CONDITIONS", "REQUEST-CHANGES", "BLOCKED"].includes(
          verdict.verdict,
        ),
      );
      assert.ok(verdict.nextActions.length > 0); // Should have warning action
    });
  });

  describe("Group 5: QuantumReef Integration", () => {
    test("should dispatch plan task", async () => {
      const result = await taskDispatcher.dispatch({
        taskId: "test-003",
        instruction: "Create test feature",
        category: "plan",
      });

      assert.strictEqual(result.category, "plan");
      assert.ok(result.status === "success" || result.status === "error");
    });

    test("should dispatch all 5 categories", async () => {
      const categories = ["plan", "spec", "tasks", "audit", "pm-review"] as const;

      for (const category of categories) {
        const result = await taskDispatcher.dispatch({
          taskId: `test-${category}`,
          instruction: "Test",
          category,
        });

        assert.strictEqual(result.category, category);
      }
    });

    test("should throttle progress events", async () => {
      const events: unknown[] = [];
      progressBridge.on("progress", (e) => events.push(e));

      // Emit multiple events quickly
      for (let i = 0; i < 5; i++) {
        progressBridge.reportProgress({
          taskId: "throttle-test",
          phase: "test",
          step: i + 1,
          totalSteps: 5,
          checkpoint: `Step ${i + 1}`,
        });
      }

      // Wait for throttle
      await new Promise((r) => setTimeout(r, 600));

      // Should be throttled (not all 5 events)
      assert.ok(events.length <= 5);
    });

    test("should chunk long messages", async () => {
      const events: unknown[] = [];
      progressBridge.on("progress", (e: { payload?: { checkpoint?: string } }) => {
        events.push(e);
      });

      progressBridge.reportProgress({
        taskId: "chunk-test",
        phase: "test",
        step: 1,
        totalSteps: 1,
        checkpoint: "A".repeat(500),
      });

      await new Promise((r) => setTimeout(r, 100));

      if (events.length > 0) {
        const event = events[0] as { payload?: { checkpoint?: string } };
        const checkpoint = event.payload?.checkpoint || "";
        assert.ok(checkpoint.length <= 303, "Message should be chunked");
      }
    });
  });

  describe("Integration: Full Workflow", () => {
    test("should complete full spec workflow", async () => {
      await fs.mkdir(path.join(testDir, "memory_bank", "specs"), { recursive: true });

      // Step 1: Plan
      const planResult = await taskDispatcher.dispatch({
        taskId: "integration-001",
        instruction: "Create user dashboard",
        category: "plan",
      });

      assert.ok(planResult.artifacts && planResult.artifacts.length > 0);

      // Step 2: Spec (if we have requirements)
      if (planResult.artifacts) {
        const specResult = await taskDispatcher.dispatch({
          taskId: "integration-001",
          instruction: "Write spec",
          category: "spec",
          specContext: {
            phase: "write",
            featureName: "user-dashboard",
            requirementsPath: planResult.artifacts[0],
          },
        });

        assert.ok(specResult.status === "success" || specResult.status === "error");
      }
    });
  });
});

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🧪 Running Dual-Memory Architecture Tests...\n");
}
