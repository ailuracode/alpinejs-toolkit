import { describe, expect, it } from "vitest";
import {
  deserializeSelection,
  parseSelectionParam,
  serializeSelection,
  writeSelectionParam,
} from "../src/serialization.js";

describe("@ailuracode/alpine-selection serialization", () => {
  it("serializes single, multiple, and range values", () => {
    expect(serializeSelection("alpha", "single")).toBe("alpha");
    expect(serializeSelection(["a", "b"], "multiple")).toBe("a,b");
    expect(serializeSelection({ from: "a", to: "c" }, "range")).toBe("a..c");
  });

  it("deserializes stored values", () => {
    expect(deserializeSelection("alpha", "single")).toBe("alpha");
    expect(deserializeSelection("a,b", "multiple")).toEqual(["a", "b"]);
    expect(deserializeSelection("a..c", "range")).toEqual({ from: "a", to: "c" });
  });

  it("serializes null/empty values to empty string", () => {
    expect(serializeSelection(null, "single")).toBe("");
    expect(serializeSelection([], "multiple")).toBe("");
    expect(serializeSelection(null, "range")).toBe("");
  });

  it("serializes range with only from (no to)", () => {
    expect(serializeSelection({ from: "a" }, "range")).toBe("a");
  });

  it("deserializes empty string to mode-appropriate default", () => {
    expect(deserializeSelection("", "single")).toBeNull();
    expect(deserializeSelection("", "multiple")).toEqual([]);
    expect(deserializeSelection("", "range")).toBeNull();
  });

  it("deserializes range with only from", () => {
    expect(deserializeSelection("a", "range")).toEqual({ from: "a" });
  });

  it("deserializes single mode ignores extra separators", () => {
    expect(deserializeSelection("a,b,c", "single")).toBe("a,b,c");
  });

  it("deserializes multiple with whitespace and empty segments", () => {
    expect(deserializeSelection("a, , b", "multiple")).toEqual(["a", "b"]);
  });

  it("throws on invalid range serialization", () => {
    expect(() => deserializeSelection("..", "range")).toThrow();
    expect(() => deserializeSelection("a..", "range")).toThrow();
    expect(() => deserializeSelection("..b", "range")).toThrow();
  });

  it("parses selection from URLSearchParams", () => {
    const params = new URLSearchParams("sel=a&other=1");
    expect(parseSelectionParam(params, "sel", "single")).toBe("a");
    expect(parseSelectionParam(params, "sel", "multiple")).toEqual(["a"]);
    expect(parseSelectionParam(params, "sel", "range")).toEqual({ from: "a" });
  });

  it("returns default when param is missing", () => {
    const params = new URLSearchParams();
    expect(parseSelectionParam(params, "sel", "single")).toBeNull();
    expect(parseSelectionParam(params, "sel", "multiple")).toEqual([]);
    expect(parseSelectionParam(params, "sel", "range")).toBeNull();
  });

  it("writes selection value to URLSearchParams", () => {
    const params = new URLSearchParams();
    writeSelectionParam(params, "sel", "a", "single");
    expect(params.get("sel")).toBe("a");
  });

  it("writes multiple selection as comma-separated", () => {
    const params = new URLSearchParams();
    writeSelectionParam(params, "sel", ["a", "b"], "multiple");
    expect(params.get("sel")).toBe("a,b");
  });

  it("writes range selection with separator", () => {
    const params = new URLSearchParams();
    writeSelectionParam(params, "sel", { from: "a", to: "c" }, "range");
    expect(params.get("sel")).toBe("a..c");
  });

  it("deletes param when value is empty", () => {
    const params = new URLSearchParams("sel=old");
    writeSelectionParam(params, "sel", null, "single");
    expect(params.has("sel")).toBe(false);
  });

  it("deletes param for empty multiple", () => {
    const params = new URLSearchParams("sel=old");
    writeSelectionParam(params, "sel", [], "multiple");
    expect(params.has("sel")).toBe(false);
  });

  it("round-trips serialize/deserialize for all modes", () => {
    const single = serializeSelection("x", "single");
    expect(deserializeSelection(single, "single")).toBe("x");

    const multiple = serializeSelection(["a", "b", "c"], "multiple");
    expect(deserializeSelection(multiple, "multiple")).toEqual(["a", "b", "c"]);

    const range = serializeSelection({ from: "a", to: "c" }, "range");
    expect(deserializeSelection(range, "range")).toEqual({ from: "a", to: "c" });
  });
});
