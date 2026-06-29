import { describe, expect, it } from "vitest";
import { formatKeyJson, formatQueryKeyLabel } from "../src/devtools/format-key.js";

describe("format-key", () => {
  it("formats query keys as readable breadcrumb labels", () => {
    expect(formatQueryKeyLabel(["pokemon", "zustand", 1])).toBe("pokemon › zustand › 1");
    expect(formatQueryKeyLabel(["pokemon", "zustand", 1], { omitAdapterName: "Zustand" })).toBe(
      "pokemon › 1"
    );
    expect(
      formatQueryKeyLabel(["pokemon", "alpine", 1], { omitAdapterName: "Alpine.reactive" })
    ).toBe("pokemon › 1");
    expect(formatQueryKeyLabel(["in-flight"])).toBe("in-flight");
    expect(formatQueryKeyLabel([])).toBe("∅");
  });

  it("keeps JSON formatting for filters and tooltips", () => {
    expect(formatKeyJson(["pokemon", 1])).toBe('["pokemon",1]');
  });
});
