/**
 * External Memory Bank Initialization
 *
 * Creates and manages <project>/memory_bank/ for end-user projects.
 * Auto-provisions memory infrastructure when users first interact with Clawtopus.
 */

import * as fs from "fs/promises";
import * as path from "path";
import { ExternalMemoryBank, MemoryInitOptions } from "../dual-memory-types.js";

export class ExternalMemoryInitializer {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Initialize external memory bank for user project
   */
  async initialize(options: MemoryInitOptions = {}): Promise<ExternalMemoryBank> {
    const { force = false, templates = true, verbose = false } = options;

    const memoryBankPath = path.join(this.projectPath, "memory_bank");

    // Check if already initialized
    const exists = await this.pathExists(memoryBankPath);
    if (exists && !force) {
      if (verbose) {
        console.log("External memory bank already initialized");
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
      console.log(`External memory bank initialized at: ${memoryBankPath}`);
    }

    return this.getMemoryBankStructure();
  }

  /**
   * Create directory structure for external memory
   */
  private async createDirectoryStructure(): Promise<void> {
    const dirs = [
      path.join(this.projectPath, "memory_bank"),
      path.join(this.projectPath, "memory_bank", "specs"),
      path.join(this.projectPath, "memory_bank", "pm-ledger"),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Create template files for external memory
   */
  private async createTemplateFiles(): Promise<void> {
    const basePath = path.join(this.projectPath, "memory_bank");
    const projectName = path.basename(this.projectPath);

    const files = [
      { name: "PROJECT_CONTEXT.md", content: this.getProjectContextTemplate(projectName) },
      { name: "USER_PREFERENCES.md", content: this.getUserPreferencesTemplate() },
      { name: "PROJECT_STATE.md", content: this.getProjectStateTemplate() },
      { name: "DEVELOPMENT_HISTORY.md", content: this.getDevelopmentHistoryTemplate() },
      { name: "DECISIONS.md", content: this.getDecisionsTemplate() },
      { name: "CURRICULUM.md", content: this.getCurriculumTemplate(projectName) },
    ];

    for (const file of files) {
      const filePath = path.join(basePath, file.name);
      const exists = await this.pathExists(filePath);
      if (!exists) {
        await fs.writeFile(filePath, file.content, "utf-8");
      }
    }
  }

  /**
   * Get memory bank structure
   */
  private getMemoryBankStructure(): ExternalMemoryBank {
    return {
      type: "external",
      path: path.join(this.projectPath, "memory_bank"),
      files: {
        projectContext: path.join(this.projectPath, "memory_bank", "PROJECT_CONTEXT.md"),
        userPreferences: path.join(this.projectPath, "memory_bank", "USER_PREFERENCES.md"),
        projectState: path.join(this.projectPath, "memory_bank", "PROJECT_STATE.md"),
        developmentHistory: path.join(this.projectPath, "memory_bank", "DEVELOPMENT_HISTORY.md"),
        decisions: path.join(this.projectPath, "memory_bank", "DECISIONS.md"),
        curriculum: path.join(this.projectPath, "memory_bank", "CURRICULUM.md"),
      },
      directories: {
        specs: path.join(this.projectPath, "memory_bank", "specs"),
        pmLedger: path.join(this.projectPath, "memory_bank", "pm-ledger"),
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
  private getProjectContextTemplate(projectName: string): string {
    return `# ${projectName} - Project Context

> **Last Updated**: ${new Date().toISOString()}

## What This Project Is

<!-- Describe your project in 2-3 sentences -->

## Technology Stack

<!-- List your main technologies -->
- 
- 
- 

## Current Status

- **Phase**: Planning / Development / Production
- **Last Focus**: 
- **Next Steps**: 

## Key Resources

- Repository: 
- Documentation: 
- Deployment: 
`;
  }

  private getUserPreferencesTemplate(): string {
    return `# User Preferences

> Your coding style and preferences remembered by Clawtopus

## Coding Style

- **Language Style**: TypeScript / Python / Rust / etc.
- **Framework Preference**: React / Vue / Svelte / etc.
- **Testing Approach**: TDD / BDD / Integration-first

## Communication Style

- **Response Length**: Brief / Detailed
- **Code Comments**: Minimal / Extensive
- **Documentation**: Inline / Separate / Both

## Architecture Preferences

- **Component Size**: < 400 lines (Orion standard)
- **State Management**: 
- **API Style**: REST / GraphQL / tRPC

## Remember To

- [ ] Add type safety
- [ ] Write tests
- [ ] Update documentation
- [ ] Run linting
`;
  }

  private getProjectStateTemplate(): string {
    return `# Project State

> Current focus and recent work

## Current Focus

<!-- What you're working on right now -->

## Recent Work

### ${new Date().toISOString().split("T")[0]}
- 

## Blockers

<!-- Anything blocking progress -->

## Decisions Needed

<!-- Open questions requiring decisions -->
`;
  }

  private getDevelopmentHistoryTemplate(): string {
    return `# Development History

> Reverse-chronological log of your work

## ${new Date().toISOString().split("T")[0]} - Project Started

- **Status**: Initialized with Clawtopus
- **Notes**: Memory bank created
`;
  }

  private getDecisionsTemplate(): string {
    return `# Architectural Decisions

> Key technical decisions for this project

## ADR-001: [Decision Title]

- **Date**: 
- **Decision**: 
- **Rationale**: 
- **Status**: Proposed / Accepted / Deprecated
- **Consequences**: 
`;
  }

  private getCurriculumTemplate(projectName: string): string {
    return `# ${projectName} - Learning Curriculum

> Personalized learning path generated by Clawtopus

## Current Skill Level

- **Overall**: Beginner / Intermediate / Advanced
- **Primary Language**: 
- **Framework Experience**: 

## Recommended Learning Path

### Phase 1: Foundation
- [ ] 

### Phase 2: Core Skills
- [ ] 

### Phase 3: Advanced Topics
- [ ] 

## Resources

- Documentation: 
- Tutorials: 
- Practice Projects: 
`;
  }
}

// Export factory function
export function createExternalMemoryInitializer(projectPath: string): ExternalMemoryInitializer {
  return new ExternalMemoryInitializer(projectPath);
}
