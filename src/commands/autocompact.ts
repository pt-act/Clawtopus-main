import type { RuntimeEnv } from "../runtime.js";
import { resolveCompactionConfig } from "../agents/compaction-config.js";
import { loadConfig, writeConfigFile } from "../config/config.js";
import { setConfigOverride } from "../config/runtime-overrides.js";
import { info, warn } from "../globals.js";
import { theme } from "../terminal/theme.js";

const AUTOCOMPACT_CONFIG_PATH = "agents.defaults.compaction.auto";

type AutoCompactMode = "on" | "off" | "status";

type AutoCompactCommandOptions = {
  mode?: AutoCompactMode;
};

function normalizeMode(input?: string): AutoCompactMode {
  const trimmed = (input ?? "").trim().toLowerCase();
  if (!trimmed || trimmed === "status") {
    return "status";
  }
  if (trimmed === "on" || trimmed === "enable" || trimmed === "enabled") {
    return "on";
  }
  if (trimmed === "off" || trimmed === "disable" || trimmed === "disabled") {
    return "off";
  }
  return "status";
}

export async function autocompactCommand(
  opts: AutoCompactCommandOptions,
  runtime: RuntimeEnv,
): Promise<void> {
  const cfg = loadConfig();
  const resolved = resolveCompactionConfig(cfg);
  const enabled = resolved.auto;
  const mode = normalizeMode(opts.mode);

  if (mode === "status") {
    runtime.log(info("Auto-compaction setting:"));
    runtime.log("");
    runtime.log(`${enabled ? "  ◉" : "  ◯"} Enabled`);
    runtime.log(`${enabled ? "  ◯" : "  ◉"} Disabled (manual /compact only)`);
    runtime.log("");
    runtime.log(
      theme.muted(`Triggers at ${Math.round(resolved.maxHistoryShare * 100)}% history share`) +
        theme.muted(` / warn at compaction ${resolved.warnAtCompaction}`),
    );
    return;
  }

  const nextEnabled = mode === "on";
  const nextConfig = {
    ...cfg,
    agents: {
      ...cfg.agents,
      defaults: {
        ...cfg.agents?.defaults,
        compaction: {
          ...cfg.agents?.defaults?.compaction,
          auto: nextEnabled,
        },
      },
    },
  };

  await writeConfigFile(nextConfig);
  setConfigOverride(AUTOCOMPACT_CONFIG_PATH, nextEnabled);

  if (nextEnabled) {
    runtime.log(info("✓ Auto-compaction enabled"));
  } else {
    runtime.log(info("✓ Auto-compaction disabled"));
    runtime.log("");
    runtime.log(
      warn(
        "Warning: You must manually compact when approaching context limit. " +
          "Use: openclaw compact",
      ),
    );
  }

  runtime.log(theme.muted(`Config updated: ${AUTOCOMPACT_CONFIG_PATH} = ${String(nextEnabled)}`));
}
