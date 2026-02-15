import { describe, expect, it } from "vitest";
import { selectCompactionLayer } from "./compaction-layers.js";

describe("selectCompactionLayer", () => {
  it("selects prune when usage exceeds 80% and tool output is heavy", () => {
    const layer = selectCompactionLayer({
      usagePercent: 82,
      hasOversizedToolOutput: true,
    });
    expect(layer?.id).toBe("prune");
  });

  it("selects summarize when usage exceeds 88% regardless of tool output", () => {
    const layer = selectCompactionLayer({
      usagePercent: 90,
      hasOversizedToolOutput: false,
    });
    expect(layer?.id).toBe("summarize");
  });

  it("selects full when usage exceeds 95%", () => {
    const layer = selectCompactionLayer({
      usagePercent: 97,
      hasOversizedToolOutput: false,
    });
    expect(layer?.id).toBe("full");
  });

  it("returns null when below all thresholds", () => {
    const layer = selectCompactionLayer({
      usagePercent: 50,
      hasOversizedToolOutput: true,
    });
    expect(layer).toBeNull();
  });

  it("skips prune when tool output is not heavy", () => {
    const layer = selectCompactionLayer({
      usagePercent: 82,
      hasOversizedToolOutput: false,
    });
    expect(layer).toBeNull();
  });
});
