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

  it("formats number and boolean segments", () => {
    expect(formatQueryKeyLabel([42, true, false])).toBe("42 › true › false");
  });

  it("formats null and undefined segments", () => {
    expect(formatQueryKeyLabel([null, undefined])).toBe("null › undefined");
  });

  it("formats object segments via JSON.stringify", () => {
    expect(formatQueryKeyLabel([{ id: 1, name: "test" }])).toBe('{"id":1,"name":"test"}');
  });

  it("falls back to String() for circular references", () => {
    const circular: any = {};
    circular.self = circular;
    expect(formatQueryKeyLabel([circular])).toBe("[object Object]");
  });

  it("falls back to original segment when filter would empty array", () => {
    expect(formatQueryKeyLabel(["alpine"], { omitAdapterName: "Alpine.reactive" })).toBe("alpine");
  });
});
