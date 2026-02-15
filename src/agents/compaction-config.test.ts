import { describe, expect, it } from "vitest";
import type { OpenClawConfig } from "../config/types.js";
import { resolveCompactionConfig, __testing } from "./compaction-config.js";

const baseConfig: OpenClawConfig = {
  agents: {
    defaults: {
      compaction: {},
    },
  },
};

describe("resolveCompactionConfig", () => {
  it("applies defaults when missing", () => {
    const resolved = resolveCompactionConfig(baseConfig);
    expect(resolved.mode).toBe("safeguard");
    expect(resolved.reserveTokensFloor).toBe(8000);
    expect(resolved.maxHistoryShare).toBe(0.5);
    expect(resolved.maxAutoCompactions).toBe(5);
    expect(resolved.warnAtCompaction).toBe(3);
    expect(resolved.memoryFlush.enabled).toBe(true);
  });

  it("merges config defaults and overrides", () => {
    const config: OpenClawConfig = {
      agents: {
        defaults: {
          compaction: {
            mode: "default",
            maxAutoCompactions: 2,
            memoryFlush: {
              enabled: false,
            },
          },
        },
      },
    };
    const resolved = resolveCompactionConfig(config, {
      warnAtCompaction: 1,
      reserveTokensFloor: 6000,
      memoryFlush: {
        prompt: "Custom prompt",
      },
    });

    expect(resolved.mode).toBe("default");
    expect(resolved.maxAutoCompactions).toBe(2);
    expect(resolved.warnAtCompaction).toBe(1);
    expect(resolved.reserveTokensFloor).toBe(6000);
    expect(resolved.memoryFlush.enabled).toBe(false);
    expect(resolved.memoryFlush.prompt).toBe("Custom prompt");
    expect(resolved.memoryFlush.systemPrompt).toBe(
      __testing.DEFAULT_COMPACTION_CONFIG.memoryFlush.systemPrompt,
    );
  });
});
