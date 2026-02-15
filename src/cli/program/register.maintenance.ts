import type { Command } from "commander";
import { compactCommand } from "../../commands/compact.js";
import { contextInspectCommand } from "../../commands/context-inspect.js";
import { dashboardCommand } from "../../commands/dashboard.js";
import { doctorCommand } from "../../commands/doctor.js";
import { resetCommand } from "../../commands/reset.js";
import { uninstallCommand } from "../../commands/uninstall.js";
import { defaultRuntime } from "../../runtime.js";
import { formatDocsLink } from "../../terminal/links.js";
import { theme } from "../../terminal/theme.js";
import { runCommandWithRuntime } from "../cli-utils.js";

export function registerMaintenanceCommands(program: Command) {
  program
    .command("doctor")
    .description("Health checks + quick fixes for the gateway and channels")
    .addHelpText(
      "after",
      () =>
        `\n${theme.muted("Docs:")} ${formatDocsLink("/cli/doctor", "docs.openclaw.ai/cli/doctor")}\n`,
    )
    .option("--no-workspace-suggestions", "Disable workspace memory system suggestions", false)
    .option("--yes", "Accept defaults without prompting", false)
    .option("--repair", "Apply recommended repairs without prompting", false)
    .option("--fix", "Apply recommended repairs (alias for --repair)", false)
    .option("--force", "Apply aggressive repairs (overwrites custom service config)", false)
    .option("--non-interactive", "Run without prompts (safe migrations only)", false)
    .option("--generate-gateway-token", "Generate and configure a gateway token", false)
    .option("--deep", "Scan system services for extra gateway installs", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await doctorCommand(defaultRuntime, {
          workspaceSuggestions: opts.workspaceSuggestions,
          yes: Boolean(opts.yes),
          repair: Boolean(opts.repair) || Boolean(opts.fix),
          force: Boolean(opts.force),
          nonInteractive: Boolean(opts.nonInteractive),
          generateGatewayToken: Boolean(opts.generateGatewayToken),
          deep: Boolean(opts.deep),
        });
      });
    });

  program
    .command("dashboard")
    .description("Open the Control UI with your current token")
    .addHelpText(
      "after",
      () =>
        `\n${theme.muted("Docs:")} ${formatDocsLink("/cli/dashboard", "docs.openclaw.ai/cli/dashboard")}\n`,
    )
    .option("--no-open", "Print URL but do not launch a browser", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await dashboardCommand(defaultRuntime, {
          noOpen: Boolean(opts.noOpen),
        });
      });
    });

  program
    .command("reset")
    .description("Reset local config/state (keeps the CLI installed)")
    .addHelpText(
      "after",
      () =>
        `\n${theme.muted("Docs:")} ${formatDocsLink("/cli/reset", "docs.openclaw.ai/cli/reset")}\n`,
    )
    .option("--scope <scope>", "config|config+creds+sessions|full (default: interactive prompt)")
    .option("--yes", "Skip confirmation prompts", false)
    .option("--non-interactive", "Disable prompts (requires --scope + --yes)", false)
    .option("--dry-run", "Print actions without removing files", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await resetCommand(defaultRuntime, {
          scope: opts.scope,
          yes: Boolean(opts.yes),
          nonInteractive: Boolean(opts.nonInteractive),
          dryRun: Boolean(opts.dryRun),
        });
      });
    });

  program
    .command("compact")
    .description("Manually compact a session transcript")
    .option("--session <key>", "Target session key (from 'openclaw sessions')")
    .option("--focus <instruction>", "Custom preservation instruction for the compaction model")
    .option("--dry-run", "Show basic session metadata without compacting", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await compactCommand(
          {
            session: opts.session as string | undefined,
            focus: opts.focus as string | undefined,
            dryRun: Boolean(opts.dryRun),
          },
          defaultRuntime,
        );
      });
    });

  program
    .command("autocompact")
    .description("Toggle auto-compaction for agent sessions")
    .argument("[mode]", "on | off | status (default)")
    .action(async (mode) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const { autocompactCommand } = await import("../../commands/autocompact.js");
        await autocompactCommand({ mode }, defaultRuntime);
      });
    });

  program
    .command("context-inspect")
    .description("Inspect session context breakdown and compaction savings")
    .option("--session <key>", "Target session key (from 'openclaw sessions')")
    .option("--json", "Print JSON")
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await contextInspectCommand(
          {
            session: opts.session as string | undefined,
            json: Boolean(opts.json),
          },
          defaultRuntime,
        );
      });
    });

  program
    .command("context-export")
    .description("Export session context for a fresh start")
    .option("--session <key>", "Target session key (from 'openclaw sessions')")
    .option("--format <format>", "structured | raw", "structured")
    .option("--output <path>", "Output JSON file path")
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const { contextExportCommand } = await import("../../commands/context-export.js");
        await contextExportCommand(
          {
            session: opts.session as string | undefined,
            format: opts.format as string | undefined,
            output: opts.output as string | undefined,
          },
          defaultRuntime,
        );
      });
    });

  program
    .command("context-import")
    .description("Import context to a fresh session")
    .option("--input <file>", "Input export JSON file")
    .option("--output <path>", "Optional output metadata file")
    .option("--session <id>", "Override new session id")
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const { contextImportCommand } = await import("../../commands/context-import.js");
        await contextImportCommand(
          {
            input: opts.input as string | undefined,
            output: opts.output as string | undefined,
            session: opts.session as string | undefined,
          },
          defaultRuntime,
        );
      });
    });

  program
    .command("session-branch")
    .description("Branch a session transcript at a chosen point")
    .option("--session <key>", "Target session key (from 'openclaw sessions')")
    .option("--lines <count>", "Number of transcript lines to copy")
    .option("--output <dir>", "Override output sessions directory")
    .option("--new-session-id <id>", "Explicit new session id")
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const { sessionBranchCommand } = await import("../../commands/session-branch.js");
        const linesValue = opts.lines ? Number(opts.lines) : undefined;
        await sessionBranchCommand(
          {
            session: opts.session as string | undefined,
            lines: linesValue,
            output: opts.output as string | undefined,
            newSessionId: opts.newSessionId as string | undefined,
          },
          defaultRuntime,
        );
      });
    });

  program
    .command("context-pin")
    .description("Pin a message in the session transcript (coming soon)")
    .option("--session <key>", "Target session key (from 'openclaw sessions')")
    .option("--message-id <id>", "Message id to pin")
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const { contextPinCommand } = await import("../../commands/context-pin.js");
        await contextPinCommand(
          {
            session: opts.session as string | undefined,
            messageId: opts.messageId as string | undefined,
          },
          defaultRuntime,
        );
      });
    });

  program
    .command("context-unpin")
    .description("Unpin a message in the session transcript (coming soon)")
    .option("--session <key>", "Target session key (from 'openclaw sessions')")
    .option("--message-id <id>", "Message id to unpin")
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        const { contextUnpinCommand } = await import("../../commands/context-pin.js");
        await contextUnpinCommand(
          {
            session: opts.session as string | undefined,
            messageId: opts.messageId as string | undefined,
          },
          defaultRuntime,
        );
      });
    });

  program
    .command("uninstall")
    .description("Uninstall the gateway service + local data (CLI remains)")
    .addHelpText(
      "after",
      () =>
        `\n${theme.muted("Docs:")} ${formatDocsLink("/cli/uninstall", "docs.openclaw.ai/cli/uninstall")}\n`,
    )
    .option("--service", "Remove the gateway service", false)
    .option("--state", "Remove state + config", false)
    .option("--workspace", "Remove workspace dirs", false)
    .option("--app", "Remove the macOS app", false)
    .option("--all", "Remove service + state + workspace + app", false)
    .option("--yes", "Skip confirmation prompts", false)
    .option("--non-interactive", "Disable prompts (requires --yes)", false)
    .option("--dry-run", "Print actions without removing files", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await uninstallCommand(defaultRuntime, {
          service: Boolean(opts.service),
          state: Boolean(opts.state),
          workspace: Boolean(opts.workspace),
          app: Boolean(opts.app),
          all: Boolean(opts.all),
          yes: Boolean(opts.yes),
          nonInteractive: Boolean(opts.nonInteractive),
          dryRun: Boolean(opts.dryRun),
        });
      });
    });
}
