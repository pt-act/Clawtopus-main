/**
 * Register Core Memory Bank Hooks
 *
 * Registers built-in memory_bank hooks that run automatically
 * for all Clawtopus sessions.
 */

import type { PluginRegistry } from "../plugins/registry.js";
import { handleAgentEndForMemoryBank } from "./memory-bank-hooks.js";

/**
 * Register core memory_bank hooks into the plugin registry.
 * This is called during plugin loading to ensure memory_bank
 * auto-updates are always available.
 */
export function registerCoreMemoryBankHooks(registry: PluginRegistry): void {
  // Register the agent_end hook for memory_bank updates
  registry.typedHooks.push({
    pluginId: "core:memory-bank",
    hookName: "agent_end",
    handler: handleAgentEndForMemoryBank,
    priority: 0, // Default priority
    source: "core",
  });
}
