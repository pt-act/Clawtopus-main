import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CronService } from "./service.js";
import { createCronServiceState } from "./state.js";
import { setupCronServiceSuite } from "./service.test-harness.js";
import { runMissedJobs } from "./timer.js";

const noopLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

async function makeStorePath() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-cron-"));
  return {
    storePath: path.join(dir, "cron", "jobs.json"),
    cleanup: async () => {
      await fs.rm(dir, { recursive: true, force: true });
    },
  };
}

describe("CronService restart catch-up", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-12-13T17:00:00.000Z"));
    noopLogger.debug.mockClear();
    noopLogger.info.mockClear();
    noopLogger.warn.mockClear();
    noopLogger.error.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createOverdueEveryJob(id: string, nextRunAtMs: number) {
    return {
      id,
      name: `job-${id}`,
      enabled: true,
      createdAtMs: nextRunAtMs - 60_000,
      updatedAtMs: nextRunAtMs - 60_000,
      schedule: { kind: "every", everyMs: 60_000, anchorMs: nextRunAtMs - 60_000 },
      sessionTarget: "main",
      wakeMode: "next-heartbeat",
      payload: { kind: "systemEvent", text: `tick-${id}` },
      state: { nextRunAtMs },
    };
  }

  it("executes an overdue recurring job immediately on start", async () => {
    const store = await makeStorePath();
    const enqueueSystemEvent = vi.fn();
    const requestHeartbeatNow = vi.fn();

    const dueAt = Date.parse("2025-12-13T15:00:00.000Z");
    const lastRunAt = Date.parse("2025-12-12T15:00:00.000Z");

    await fs.mkdir(path.dirname(store.storePath), { recursive: true });
    await fs.writeFile(
      store.storePath,
      JSON.stringify(
        {
          version: 1,
          jobs: [
            {
              id: "restart-overdue-job",
              name: "daily digest",
              enabled: true,
              createdAtMs: Date.parse("2025-12-10T12:00:00.000Z"),
              updatedAtMs: Date.parse("2025-12-12T15:00:00.000Z"),
              schedule: { kind: "cron", expr: "0 15 * * *", tz: "UTC" },
              sessionTarget: "main",
              wakeMode: "next-heartbeat",
              payload: { kind: "systemEvent", text: "digest now" },
              state: {
                nextRunAtMs: dueAt,
                lastRunAtMs: lastRunAt,
                lastStatus: "ok",
              },
            },
          ],
        },
        null,
        2,
      ),
      "utf-8",
    );

    const cron = new CronService({
      storePath: store.storePath,
      cronEnabled: true,
      log: noopLogger,
      enqueueSystemEvent,
      requestHeartbeatNow,
      runIsolatedAgentJob: vi.fn(async () => ({ status: "ok" })),
    });

    await cron.start();

    expect(enqueueSystemEvent).toHaveBeenCalledWith("digest now", { agentId: undefined });
    expect(requestHeartbeatNow).toHaveBeenCalled();

    const jobs = await cron.list({ includeDisabled: true });
    const updated = jobs.find((job) => job.id === "restart-overdue-job");
    expect(updated?.state.lastStatus).toBe("ok");
    expect(updated?.state.lastRunAtMs).toBe(Date.parse("2025-12-13T17:00:00.000Z"));
    expect(updated?.state.nextRunAtMs).toBeGreaterThan(Date.parse("2025-12-13T17:00:00.000Z"));

    cron.stop();
    await store.cleanup();
  });

  it("clears stale running markers and catches up overdue jobs on startup", async () => {
    const store = await makeStorePath();
    const enqueueSystemEvent = vi.fn();
    const requestHeartbeatNow = vi.fn();

    const dueAt = Date.parse("2025-12-13T16:00:00.000Z");
    const staleRunningAt = Date.parse("2025-12-13T16:30:00.000Z");

    await fs.mkdir(path.dirname(store.storePath), { recursive: true });
    await fs.writeFile(
      store.storePath,
      JSON.stringify(
        {
          version: 1,
          jobs: [
            {
              id: "restart-stale-running",
              name: "daily stale marker",
              enabled: true,
              createdAtMs: Date.parse("2025-12-10T12:00:00.000Z"),
              updatedAtMs: Date.parse("2025-12-13T16:30:00.000Z"),
              schedule: { kind: "cron", expr: "0 16 * * *", tz: "UTC" },
              sessionTarget: "main",
              wakeMode: "next-heartbeat",
              payload: { kind: "systemEvent", text: "resume stale marker" },
              state: {
                nextRunAtMs: dueAt,
                runningAtMs: staleRunningAt,
              },
            },
          ],
        },
        null,
        2,
      ),
      "utf-8",
    );

    const cron = new CronService({
      storePath: store.storePath,
      cronEnabled: true,
      log: noopLogger,
      enqueueSystemEvent,
      requestHeartbeatNow,
      runIsolatedAgentJob: vi.fn(async () => ({ status: "ok" })),
    });

    await cron.start();

    expect(enqueueSystemEvent).toHaveBeenCalledWith("resume stale marker", { agentId: undefined });
    expect(noopLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: "restart-stale-running" }),
      "cron: clearing stale running marker on startup",
    );

    const jobs = await cron.list({ includeDisabled: true });
    const updated = jobs.find((job) => job.id === "restart-stale-running");
    expect(updated?.state.runningAtMs).toBeUndefined();
    expect(updated?.state.lastStatus).toBe("ok");
    expect(updated?.state.lastRunAtMs).toBe(Date.parse("2025-12-13T17:00:00.000Z"));

    cron.stop();
    await store.cleanup();
  });

  it("reschedules deferred missed jobs from the post-catchup clock so they stay in the future", async () => {
    const store = await makeStorePath();
    const startNow = Date.parse("2025-12-13T17:00:00.000Z");
    let now = startNow;

    await writeStoreJobs(store.storePath, [
      createOverdueEveryJob("stagger-0", startNow - 60_000),
      createOverdueEveryJob("stagger-1", startNow - 50_000),
      createOverdueEveryJob("stagger-2", startNow - 40_000),
    ]);

    const state = createCronServiceState({
      cronEnabled: true,
      storePath: store.storePath,
      log: noopLogger,
      nowMs: () => now,
      enqueueSystemEvent: vi.fn(),
      requestHeartbeatNow: vi.fn(),
      runIsolatedAgentJob: vi.fn(async () => {
        now += 6_000;
        return { status: "ok" as const, summary: "ok" };
      }),
      maxMissedJobsPerRestart: 1,
      missedJobStaggerMs: 5_000,
    });

    await runMissedJobs(state);

    const staggeredJobs = (state.store?.jobs ?? [])
      .filter((job) => job.id.startsWith("stagger-") && job.id !== "stagger-0")
      .toSorted((a, b) => (a.state.nextRunAtMs ?? 0) - (b.state.nextRunAtMs ?? 0));

    expect(staggeredJobs).toHaveLength(2);
    expect(staggeredJobs[0]?.state.nextRunAtMs).toBeGreaterThan(now);
    expect(staggeredJobs[1]?.state.nextRunAtMs).toBeGreaterThan(
      staggeredJobs[0]?.state.nextRunAtMs ?? 0,
    );
    expect((staggeredJobs[1]?.state.nextRunAtMs ?? 0) - (staggeredJobs[0]?.state.nextRunAtMs ?? 0))
      .toBe(5_000);

    await store.cleanup();
  });
});
