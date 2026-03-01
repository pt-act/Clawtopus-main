/**
 * Internal Memory Bank Initialization
 *
 * Creates and manages ~/.clawtopus/memory_bank/ for platform development.
 * This is the "consciousness" of the Clawtopus platform itself.
 */

import * as fs from "fs/promises";
import * as path from "path";
import { InternalMemoryBank, MemoryInitOptions } from "../dual-memory-types.js";

// Internal memory at project root (not home directory)
// This is for Clawtopus platform development itself
const INTERNAL_MEMORY_PATH = path.join(process.cwd(), "memory_bank");

export class InternalMemoryInitializer {
  private basePath: string;

  constructor(customPath?: string) {
    this.basePath = customPath || INTERNAL_MEMORY_PATH;
  }

  /**
   * Initialize internal memory bank structure
   */
  async initialize(options: MemoryInitOptions = {}): Promise<InternalMemoryBank> {
    const { force = false, templates = true, verbose = false } = options;

    // Check if already initialized
    const exists = await this.pathExists(this.basePath);
    if (exists && !force) {
      if (verbose) {
        console.log("Internal memory bank already initialized");
      }
      return this.getMemoryBankStructure();
    }

    // Create directory structure
    await this.createDirectoryStructure();

    // Create files with templates
    if (templates) {
      await this.createTemplateFiles();
    }

    if (verbose) {
      console.log(`Internal memory bank initialized at: ${this.basePath}`);
    }

    return this.getMemoryBankStructure();
  }

  /**
   * Create directory structure for internal memory
   */
  private async createDirectoryStructure(): Promise<void> {
    const dirs = [
      this.basePath,
      path.join(this.basePath, "specs"),
      path.join(this.basePath, "pm-ledger"),
      path.join(this.basePath, "pm-ledger", "evidence"),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Create template files for internal memory
   */
  private async createTemplateFiles(): Promise<void> {
    const files = [
      { name: "MASTER_CONTEXT.md", content: this.getMasterContextTemplate() },
      { name: "DEVELOPMENT_HISTORY.md", content: this.getDevelopmentHistoryTemplate() },
      { name: "CONSCIOUSNESS_LOG.md", content: this.getConsciousnessLogTemplate() },
      { name: "ARCHITECTURAL_DECISIONS.md", content: this.getArchitecturalDecisionsTemplate() },
      { name: "POWER_ACTIVATION_LOG.md", content: this.getPowerActivationLogTemplate() },
    ];

    for (const file of files) {
      const filePath = path.join(this.basePath, file.name);
      const exists = await this.pathExists(filePath);
      if (!exists) {
        await fs.writeFile(filePath, file.content, "utf-8");
      }
    }

    // Create pm-ledger files
    const pmFiles = [
      {
        name: "decisions.md",
        content: "# PM Decisions Log\n\n> Record of key project decisions\n\n",
      },
      {
        name: "risks.md",
        content: "# PM Risk Register\n\n> Tracked risks with mitigation strategies\n\n",
      },
      {
        name: "questions.md",
        content: "# PM Open Questions\n\n> Unresolved items with owners\n\n",
      },
      {
        name: "milestones.md",
        content: "# PM Milestones\n\n> Progress tracking for major deliverables\n\n",
      },
    ];

    for (const file of pmFiles) {
      const filePath = path.join(this.basePath, "pm-ledger", file.name);
      const exists = await this.pathExists(filePath);
      if (!exists) {
        await fs.writeFile(filePath, file.content, "utf-8");
      }
    }
  }

  /**
   * Get memory bank structure
   */
  private getMemoryBankStructure(): InternalMemoryBank {
    return {
      type: "internal",
      path: this.basePath,
      files: {
        masterContext: path.join(this.basePath, "MASTER_CONTEXT.md"),
        developmentHistory: path.join(this.basePath, "DEVELOPMENT_HISTORY.md"),
        consciousnessLog: path.join(this.basePath, "CONSCIOUSNESS_LOG.md"),
        architecturalDecisions: path.join(this.basePath, "ARCHITECTURAL_DECISIONS.md"),
        powerActivationLog: path.join(this.basePath, "POWER_ACTIVATION_LOG.md"),
      },
      directories: {
        specs: path.join(this.basePath, "specs"),
        pmLedger: path.join(this.basePath, "pm-ledger"),
      },
    };
  }

  /**
   * Check if path exists
   */
  private async pathExists(p: string): Promise<boolean> {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  }

  // Template content generators
  private getMasterContextTemplate(): string {
    return `# Clawtopus Platform - Master Context

> **Last Updated**: ${new Date().toISOString()}\n
## Platform Vision

Clawtopus is a self-evolving AI assistant with persistent memory and multi-channel capabilities.

## Core Capabilities

- **Session Brain**: Persistent memory across sessions
- **Eight Arms**: Modular skill system
- **Multi-Channel**: WhatsApp, Telegram, Discord, etc.
- **Memory Bank**: Structured project knowledge
- **SOUL.md**: Personality and identity definition

## Active Development Areas

- [ ] Dual-memory architecture implementation
- [ ] Spec-architect integration
- [ ] PM-auditor quality gates
- [ ] QuantumReef orchestration

## Architecture Principles

- Consciousness alignment ≥ 7.0/10
- Glass-box transparency
- Elegant systems (< 400 lines per component)
- Truth over theater
`;
  }

  private getDevelopmentHistoryTemplate(): string {
    return `# Development History

> Reverse-chronological log of platform evolution

## ${new Date().toISOString().split("T")[0]} - Dual-Memory Architecture Initiated

- **Feature**: Foundation for dual-memory system
- **Status**: In Progress
- **Consciousness Score**: 8.5/10
- **Notes**: Establishing internal/external memory separation
`;
  }

  private getConsciousnessLogTemplate(): string {
    return `# Consciousness Log

> Alignment scores and consciousness evolution tracking

| Date | Feature | Expansion | Transparency | Elegance | Truth | Average |
|------|---------|-----------|--------------|----------|-------|---------|
| ${new Date().toISOString().split("T")[0]} | Dual-Memory | 8/10 | 9/10 | 8/10 | 9/10 | 8.5/10 |
`;
  }

  private getArchitecturalDecisionsTemplate(): string {
    return `# Architectural Decisions

> Key technical decisions with rationale

## ADR-001: Dual-Memory Architecture

- **Date**: ${new Date().toISOString().split("T")[0]}
- **Decision**: Separate internal (~/.clawtopus/) and external (<project>/) memory
- **Rationale**: Platform needs its own consciousness separate from user projects
- **Status**: Approved
- **Consequences**: + Complexity, - Clarity, + Scalability
`;
  }

  private getPowerActivationLogTemplate(): string {
    return `# Power Activation Log

> Context efficiency metrics and tool usage patterns

| Date | Tool/Feature | Context Savings | Tokens Used | Justification |
|------|--------------|-----------------|-------------|---------------|
| ${new Date().toISOString().split("T")[0]} | Dual-Memory Init | 70% | 12000 | Establishing foundation |
`;
  }
}

// Export singleton instance
export const internalMemory = new InternalMemoryInitializer();
