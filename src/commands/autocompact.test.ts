import { describe, expect, it, vi } from "vitest";
import { autocompactCommand } from "./autocompact.js";

vi.mock("../globals.js", () => ({
  info: (value: string) => value,
  muted: (value: string) => value,
  warn: (value: string) => value,
}));

const configMocks = vi.hoisted(() => ({
  writeConfigFile: vi.fn(async () => undefined),
  loadConfig: vi.fn(() => ({
    agents: {
      defaults: {
        compaction: {
          auto: true,
          maxHistoryShare: 0.5,
          warnAtCompaction: 3,
        },
      },
    },
  })),
}));

vi.mock("../config/config.js", () => ({
  loadConfig: configMocks.loadConfig,
  writeConfigFile: configMocks.writeConfigFile,
}));

const runtimeOverrideMocks = vi.hoisted(() => ({
  setConfigOverride: vi.fn(),
}));
vi.mock("../config/runtime-overrides.js", () => ({
  setConfigOverride: runtimeOverrideMocks.setConfigOverride,
}));

vi.mock("../agents/compaction-config.js", () => ({
  resolveCompactionConfig: (cfg: unknown) => {
    const defaults = (cfg as { agents?: { defaults?: { compaction?: { auto?: boolean } } } }).agents
      ?.defaults?.compaction;
    return {
      auto: defaults?.auto ?? true,
      maxHistoryShare: 0.5,
      warnAtCompaction: 3,
    };
  },
}));

const runtime = {
  log: vi.fn(),
  error: vi.fn(),
  exit: vi.fn(),
} as const;

describe("autocompactCommand", () => {
  it("prints status", async () => {
    await autocompactCommand({ mode: "status" }, runtime);
    const output = runtime.log.mock.calls.map((call) => String(call[0])).join("\n");
    expect(output).toContain("Auto-compaction setting");
    expect(output).toContain("Enabled");
  });

  it("writes config updates", async () => {
    await autocompactCommand({ mode: "off" }, runtime);
    expect(configMocks.writeConfigFile).toHaveBeenCalled();
    expect(runtimeOverrideMocks.setConfigOverride).toHaveBeenCalledWith(
      "agents.defaults.compaction.auto",
      false,
    );
  });
});
