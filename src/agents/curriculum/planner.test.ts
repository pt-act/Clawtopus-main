import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  analyzeCodebaseStructure,
  generateCurriculum,
  saveCurriculum,
  loadCurriculum,
  listCurriculums,
  formatCurriculumAsMarkdown,
} from "./planner.js";

vi.mock("../../config/paths.js", () => ({
  resolveStateDir: () => path.join(os.tmpdir(), "test-voyager-curriculum"),
}));

const TEST_DIR = path.join(os.tmpdir(), "test-voyager-curriculum");

describe("curriculum planner", () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe("analyzeCodebaseStructure", () => {
    it("detects TypeScript files", () => {
      const testDir = path.join(TEST_DIR, "project-ts");
      fs.mkdirSync(testDir);
      fs.writeFileSync(path.join(testDir, "index.ts"), "const x = 1;");

      const result = analyzeCodebaseStructure(testDir);
      expect(result.languages).toContain("TypeScript");
    });

    it("detects JavaScript files", () => {
      const testDir = path.join(TEST_DIR, "project-js");
      fs.mkdirSync(testDir);
      fs.writeFileSync(path.join(testDir, "index.js"), "const x = 1;");

      const result = analyzeCodebaseStructure(testDir);
      expect(result.languages).toContain("JavaScript");
    });

    it("returns directory structure", () => {
      const testDir = path.join(TEST_DIR, "project-struct");
      fs.mkdirSync(testDir);
      fs.mkdirSync(path.join(testDir, "src"));
      fs.mkdirSync(path.join(testDir, "tests"));

      const result = analyzeCodebaseStructure(testDir);
      expect(result.structure).toContain("src");
      expect(result.structure).toContain("tests");
    });

    it("returns empty for non-existent directory", () => {
      const result = analyzeCodebaseStructure("/nonexistent/path");
      expect(result.languages).toEqual([]);
      expect(result.frameworks).toEqual([]);
    });
  });

  describe("generateCurriculum", () => {
    it("generates curriculum with base modules", () => {
      const analysis = {
        languages: ["TypeScript"],
        frameworks: ["React"],
        structure: ["src", "tests"],
      };

      const curriculum = generateCurriculum("TestProject", analysis);
      expect(curriculum.id).toBeDefined();
      expect(curriculum.name).toContain("TestProject");
      expect(curriculum.modules.length).toBeGreaterThan(0);
    });

    it("adds framework module when frameworks detected", () => {
      const analysis = {
        languages: ["TypeScript"],
        frameworks: ["React", "Express"],
        structure: ["src"],
      };

      const curriculum = generateCurriculum("TestProject", analysis);
      const frameworkModule = curriculum.modules.find((m) => m.title.includes("Framework"));
      expect(frameworkModule).toBeDefined();
    });
  });

  describe("saveCurriculum and loadCurriculum", () => {
    it("saves and loads curriculum", () => {
      const analysis = {
        languages: ["TypeScript"],
        frameworks: [],
        structure: ["src"],
      };

      const curriculum = generateCurriculum("TestProject", analysis);
      saveCurriculum(curriculum);

      const loaded = loadCurriculum(curriculum.id);
      expect(loaded).not.toBeNull();
      expect(loaded!.id).toBe(curriculum.id);
      expect(loaded!.name).toBe(curriculum.name);
    });

    it("returns null for non-existent curriculum", () => {
      const loaded = loadCurriculum("non-existent-id");
      expect(loaded).toBeNull();
    });
  });

  describe("listCurriculums", () => {
    it("returns empty array when no curriculums", () => {
      const curriculums = listCurriculums();
      expect(curriculums).toEqual([]);
    });

    it("lists saved curriculums", () => {
      const analysis = { languages: ["TypeScript"], frameworks: [], structure: [] };
      const c1 = generateCurriculum("Project1", analysis);
      saveCurriculum(c1);
      
      const c2 = generateCurriculum("Project2", analysis);
      saveCurriculum(c2);

      const curriculums = listCurriculums();
      expect(curriculums.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("formatCurriculumAsMarkdown", () => {
    it("formats curriculum as markdown", () => {
      const analysis = { languages: ["TypeScript"], frameworks: [], structure: [] };
      const curriculum = generateCurriculum("Test", analysis);

      const markdown = formatCurriculumAsMarkdown(curriculum);
      expect(markdown).toContain("# Test Learning Curriculum");
      expect(markdown).toContain("## Modules");
    });
  });
});
