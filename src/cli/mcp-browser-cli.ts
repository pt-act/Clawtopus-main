/**
 * MCP Browser CLI Command
 *
 * CLI command to start the Browser Vision MCP Server.
 *
 * Usage:
 *   clawtopus mcp-browser [--config <path>] [--token <token>]
 */

import type { Command } from "commander";
import { runBrowserMCPServer } from "../mcp/browser-mcp-server.js";
import { loadMcpConfig } from "../mcp/config.js";
import { theme } from "../terminal/theme.js";
import { formatCliCommand } from "./command-format.js";

export function registerMcpBrowserCommand(program: Command): void {
  program
    .command("mcp-browser")
    .description("Start the Browser Vision MCP Server for Claude Desktop and other MCP clients")
    .option("--config <path>", "Path to MCP configuration file")
    .option("--token <token>", "Authentication token (overrides config)")
    .option("--no-auth", "Disable authentication (development only)")
    .option("--verbose", "Enable verbose logging")
    .addHelpText(
      "after",
      `
${theme.heading("Examples:")}

  ${formatCliCommand("clawtopus mcp-browser")}
    Start MCP server with default configuration

  ${formatCliCommand("clawtopus mcp-browser --config ~/.clawtopus/mcp-config.yaml")}
    Start with custom configuration file

  ${formatCliCommand("clawtopus mcp-browser --token my-secure-token")}
    Start with authentication token

  ${formatCliCommand("clawtopus mcp-browser --no-auth --verbose")}
    Start without auth in verbose mode (development only)

${theme.heading("Claude Desktop Configuration:")}

  Add to your claude_desktop_config.json:

  ${theme.muted(`{
    "mcpServers": {
      "browser": {
        "command": "npx",
        "args": ["clawtopus", "mcp-browser"],
        "env": {
          "MCP_AUTH_TOKEN": "your-token"
        }
      }
    }
  }`)}

${theme.heading("Documentation:")}
  - Setup Guide: docs/mcp/claude-desktop-setup.md
  - Tool Reference: docs/mcp/tool-reference.md
  - Configuration: docs/mcp/configuration.md
`,
    )
    .action(async (options) => {
      try {
        // Set config path if provided
        if (options.config) {
          process.env.CLAWTOPUS_MCP_CONFIG = options.config;
        }

        // Set auth token if provided
        if (options.token) {
          process.env.MCP_AUTH_TOKEN = options.token;
        }

        // Disable auth if requested
        if (options.noAuth) {
          const config = loadMcpConfig();
          config.auth = { mode: "none" };
        }

        if (options.verbose) {
          console.log(theme.info("Starting Browser Vision MCP Server..."));
          console.log(theme.muted(`Config: ${process.env.CLAWTOPUS_MCP_CONFIG || "default"}`));
          console.log(theme.muted(`Auth: ${options.noAuth ? "disabled" : "enabled"}`));
        }

        // Start the MCP server
        await runBrowserMCPServer();
      } catch (error) {
        console.error(theme.error("Failed to start MCP server:"));
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
