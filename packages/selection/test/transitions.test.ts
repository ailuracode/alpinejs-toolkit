import { describe, expect, it } from "vitest";
import { keysInSpan, pruneRangeValue } from "../src/internal/keys.js";
import {
  clearSelection,
  extendSelection,
  replaceSelection,
  selectAllSelection,
  toggleSelection,
} from "../src/internal/transitions.js";
import { convertValueForModeChange } from "../src/options.js";

describe("@ailuracode/alpine-selection transitions", () => {
  const keys = ["a", "b", "c", "d", "e"];
  const disabled = new Set(["c"]);

  it("replaces selection per mode", () => {
    expect(replaceSelection("single", "b")).toBe("b");
    expect(replaceSelection("multiple", "b")).toEqual(["b"]);
    expect(replaceSelection("range", "b")).toEqual({ from: "b" });
  });

  it("toggles multiple membership", () => {
    expect(toggleSelection("multiple", ["a"], "b")).toEqual(["a", "b"]);
    expect(toggleSelection("multiple", ["a", "b"], "a")).toEqual(["b"]);
  });

  it("extends range across disabled items", () => {
    const next = extendSelection("range", null, "a", "e", keys, disabled, false);
    expect(next).toEqual({ from: "a", to: "e" });
    const span = keysInSpan(keys, "a", "e", disabled, false);
    expect(span).toEqual(["a", "b", "d", "e"]);
  });

  it("select-all skips disabled keys by default", () => {
    expect(selectAllSelection("multiple", keys, disabled, false)).toEqual(["a", "b", "d", "e"]);
  });

  it("clears per mode", () => {
    expect(clearSelection("single")).toBeNull();
    expect(clearSelection("multiple")).toEqual([]);
  });

  it("converts values when mode changes", () => {
    expect(convertValueForModeChange("b", "single", "multiple", keys)).toEqual(["b"]);
    expect(convertValueForModeChange(["a", "c", "e"], "multiple", "range", keys)).toEqual({
      from: "a",
      to: "e",
    });
  });

  it("prunes range endpoints when keys are removed", () => {
    const pruned = pruneRangeValue(["a", "b", "d"], { from: "a", to: "e" }, disabled, false);
    expect(pruned).toEqual({ from: "a", to: "d" });
  });
});
