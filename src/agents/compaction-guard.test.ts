import { describe, expect, it } from "vitest";
import { evaluateDegradation, shouldBlockFurtherCompaction } from "./compaction-guard.js";

describe("evaluateDegradation", () => {
  it("returns low risk for zero compactions", () => {
    const report = evaluateDegradation(0);
    expect(report.riskLevel).toBe("low");
    expect(report.compactionCount).toBe(0);
    expect(report.informationLossEstimate).toBe(0);
  });

  it("returns medium risk for 2 compactions", () => {
    const report = evaluateDegradation(2);
    expect(report.riskLevel).toBe("medium");
    expect(report.compactionCount).toBe(2);
    expect(report.informationLossEstimate).toBe(20);
  });

  it("returns high risk at soft limit", () => {
    const report = evaluateDegradation(3);
    expect(report.riskLevel).toBe("high");
    expect(report.informationLossEstimate).toBeGreaterThanOrEqual(30);
  });

  it("returns critical risk at or above hard limit and caps info loss", () => {
    const report = evaluateDegradation(15);
    expect(report.riskLevel).toBe("critical");
    expect(report.informationLossEstimate).toBe(90);
  });
});

describe("shouldBlockFurtherCompaction", () => {
  it("does not block when limit is zero", () => {
    expect(shouldBlockFurtherCompaction(10, { maxAutoCompactions: 0 })).toBe(false);
  });

  it("does not block when below limit", () => {
    expect(shouldBlockFurtherCompaction(2, { maxAutoCompactions: 3 })).toBe(false);
  });

  it("blocks at or above limit", () => {
    expect(shouldBlockFurtherCompaction(3, { maxAutoCompactions: 3 })).toBe(true);
    expect(shouldBlockFurtherCompaction(4, { maxAutoCompactions: 3 })).toBe(true);
  });
});
