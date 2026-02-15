/**
 * Client for interfacing with the Voyager CLI
 */

import * as child_process from "child_process";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import * as vscode from "vscode";

const exec = promisify(child_process.exec);

export interface VoyagerResult {
  success: boolean;
  output?: string;
  error?: string;
}

export interface Brain {
  goals: string[];
  context: Record<string, any>;
  decisions: string[];
  nextSteps: string[];
  markdown: string;
}

export interface Skill {
  name: string;
  description: string;
  score: number;
}

export class VoyagerClient {
  private cliPath: string;
  private workspaceRoot: string | undefined;

  constructor() {
    const config = vscode.workspace.getConfiguration("voyager");
    this.cliPath = config.get("cliPath") || "voyager";

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      this.workspaceRoot = workspaceFolders[0].uri.fsPath;
    }
  }

  /**
   * Execute a voyager CLI command
   */
  private async exec(command: string): Promise<VoyagerResult> {
    try {
      const cwd = this.workspaceRoot || process.cwd();
      const { stdout, stderr } = await exec(`${this.cliPath} ${command}`, {
        cwd,
        env: { ...process.env, VOYAGER_PROJECT_DIR: cwd },
      });

      return {
        success: true,
        output: stdout.trim(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Unknown error",
      };
    }
  }

  /**
   * Start a Voyager session
   */
  async sessionStart(): Promise<VoyagerResult> {
    return await this.exec("session start");
  }

  /**
   * End a Voyager session
   */
  async sessionEnd(): Promise<VoyagerResult> {
    return await this.exec("session end");
  }

  /**
   * Update brain state
   */
  async brainUpdate(): Promise<VoyagerResult> {
    return await this.exec("brain update");
  }

  /**
   * Get brain state
   */
  async getBrain(): Promise<Brain | null> {
    try {
      const config = vscode.workspace.getConfiguration("voyager");
      const stateDir = config.get("stateDir") || ".voyager";
      const brainPath = path.join(this.workspaceRoot || "", stateDir, "brain.md");

      if (!fs.existsSync(brainPath)) {
        return null;
      }

      const markdown = fs.readFileSync(brainPath, "utf-8");

      // Parse brain markdown (simplified)
      const brain: Brain = {
        goals: [],
        context: {},
        decisions: [],
        nextSteps: [],
        markdown,
      };

      // Simple parsing
      const lines = markdown.split("\n");
      let section = "";

      for (const line of lines) {
        if (line.startsWith("## Goals")) {
          section = "goals";
        } else if (line.startsWith("## Context")) {
          section = "context";
        } else if (line.startsWith("## Decisions")) {
          section = "decisions";
        } else if (line.startsWith("## Next Steps")) {
          section = "next";
        } else if (line.startsWith("- ") && section === "goals") {
          brain.goals.push(line.substring(2));
        } else if (line.startsWith("- ") && section === "decisions") {
          brain.decisions.push(line.substring(2));
        } else if (line.startsWith("- ") && section === "next") {
          brain.nextSteps.push(line.substring(2));
        }
      }

      return brain;
    } catch (error) {
      console.error("Failed to get brain:", error);
      return null;
    }
  }

  /**
   * Find skills by query
   */
  async skillFind(query: string): Promise<Skill[]> {
    const result = await this.exec(`skill find "${query}"`);

    if (!result.success || !result.output) {
      return [];
    }

    // Parse skill results (simplified - actual format may vary)
    const skills: Skill[] = [];
    const lines = result.output.split("\n");

    for (const line of lines) {
      const match = line.match(/^(.+?)\s+\(score:\s*([\d.]+)\)\s*-\s*(.+)$/);
      if (match) {
        skills.push({
          name: match[1].trim(),
          score: parseFloat(match[2]),
          description: match[3].trim(),
        });
      }
    }

    return skills;
  }

  /**
   * Index skills
   */
  async skillIndex(): Promise<VoyagerResult> {
    return await this.exec("skill index --verbose");
  }

  /**
   * Create curriculum
   */
  async curriculumPlan(): Promise<VoyagerResult> {
    const config = vscode.workspace.getConfiguration("voyager");
    const stateDir = config.get("stateDir") || ".voyager";
    return await this.exec(`curriculum plan --output ${stateDir}`);
  }

  /**
   * Get curriculum path
   */
  async getCurriculumPath(): Promise<string | null> {
    const config = vscode.workspace.getConfiguration("voyager");
    const stateDir = config.get("stateDir") || ".voyager";
    const curriculumPath = path.join(this.workspaceRoot || "", stateDir, "curriculum.md");

    if (fs.existsSync(curriculumPath)) {
      return curriculumPath;
    }
    return null;
  }

  /**
   * Propose skills
   */
  async factoryPropose(): Promise<VoyagerResult> {
    return await this.exec("factory propose");
  }

  /**
   * Get Voyager state directory
   */
  getStateDir(): string {
    const config = vscode.workspace.getConfiguration("voyager");
    const stateDir = config.get("stateDir") || ".voyager";
    return path.join(this.workspaceRoot || "", stateDir);
  }

  /**
   * Get skills directory
   */
  getSkillsDir(): string {
    const config = vscode.workspace.getConfiguration("voyager");
    const skillsDir = config.get("skillsDir") || ".voyager/skills";
    return path.join(this.workspaceRoot || "", skillsDir);
  }

  /**
   * Check if Voyager CLI is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await exec(`${this.cliPath} --help`);
      return true;
    } catch {
      return false;
    }
  }
}
