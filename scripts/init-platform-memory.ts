/**
 * Create Clawtopus Platform Memory Bank
 *
 * This script creates the memory_bank at the project root for Clawtopus platform development.
 * Run this once to initialize platform memory.
 */

import { internalMemory } from "../src/memory/internal/init.js";

async function main() {
  console.log("🐙 Initializing Clawtopus Platform Memory Bank...\n");

  try {
    const result = await internalMemory.initialize({
      verbose: true,
      force: false,
    });

    console.log("\n✅ Platform memory bank ready!");
    console.log(`📁 Location: ${result.path}`);
    console.log("\nFiles created:");
    console.log("  - MASTER_CONTEXT.md (Platform vision & roadmap)");
    console.log("  - DEVELOPMENT_HISTORY.md (Feature log)");
    console.log("  - CONSCIOUSNESS_LOG.md (Alignment scores)");
    console.log("  - ARCHITECTURAL_DECISIONS.md (ADRs)");
    console.log("  - POWER_ACTIVATION_LOG.md (Context efficiency)");
    console.log("  - specs/ (Feature specifications)");
    console.log("  - pm-ledger/ (Audit trail)");
  } catch (error) {
    console.error("❌ Failed to initialize:", error);
    process.exit(1);
  }
}

main();
