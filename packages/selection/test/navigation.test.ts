import { describe, expect, it } from "vitest";
import {
  firstSelectableIndex,
  firstSelectableKey,
  lastSelectableIndex,
  lastSelectableKey,
  moveSelectableIndex,
  moveSelectableKey,
} from "../src/navigation.js";

describe("@ailuracode/alpine-selection navigation", () => {
  it("moves across selectable indices", () => {
    const selectable = [false, true, false, true];
    expect(moveSelectableIndex(1, 1, selectable)).toBe(3);
    expect(firstSelectableIndex(selectable)).toBe(1);
    expect(lastSelectableIndex(selectable)).toBe(3);
  });

  it("moves across selectable keys", () => {
    const keys = ["a", "b", "c", "d"];
    const disabled = ["b"];
    expect(moveSelectableKey("a", 1, keys, disabled)).toBe("c");
    expect(firstSelectableKey(keys, disabled)).toBe("a");
    expect(lastSelectableKey(keys, disabled)).toBe("d");
  });

  it("wraps backward from index 0", () => {
    const selectable = [true, false, true];
    expect(moveSelectableIndex(0, -1, selectable)).toBe(2);
  });

  it("wraps forward from last index", () => {
    const selectable = [true, false, true];
    expect(moveSelectableIndex(2, 1, selectable)).toBe(0);
  });

  it("returns current when array is empty", () => {
    expect(moveSelectableIndex(0, 1, [])).toBe(0);
    expect(firstSelectableIndex([])).toBe(0);
    expect(lastSelectableIndex([])).toBe(0);
  });

  it("returns current when all items are disabled", () => {
    const selectable = [false, false, false];
    expect(moveSelectableIndex(1, 1, selectable)).toBe(1);
    expect(firstSelectableIndex(selectable)).toBe(0);
    expect(lastSelectableIndex(selectable)).toBe(0);
  });

  it("key navigation wraps forward and backward", () => {
    const keys = ["a", "b", "c"];
    expect(moveSelectableKey("c", 1, keys)).toBe("a");
    expect(moveSelectableKey("a", -1, keys)).toBe("c");
  });

  it("returns null when all keys are disabled", () => {
    const keys = ["a", "b", "c"];
    expect(moveSelectableKey("a", 1, keys, ["a", "b", "c"])).toBeNull();
    expect(firstSelectableKey(keys, ["a", "b", "c"])).toBeNull();
    expect(lastSelectableKey(keys, ["a", "b", "c"])).toBeNull();
  });

  it("returns null for empty keys array", () => {
    expect(firstSelectableKey([])).toBeNull();
    expect(lastSelectableKey([])).toBeNull();
    expect(moveSelectableKey(null, 1, [])).toBeNull();
  });

  it("moves forward from null current key", () => {
    const keys = ["a", "b", "c"];
    expect(moveSelectableKey(null, 1, keys)).toBe("a");
  });

  it("moves backward from null current key", () => {
    const keys = ["a", "b", "c"];
    expect(moveSelectableKey(null, -1, keys)).toBe("c");
  });

  it("handles currentKey not in enabled list (moves to first selectable)", () => {
    const keys = ["a", "b", "c"];
    const disabled = ["b"];
    expect(moveSelectableKey("b", 1, keys, disabled)).toBe("a");
  });

  it("skips disabled keys during navigation", () => {
    const keys = ["a", "b", "c", "d", "e"];
    const disabled = ["b", "d"];
    expect(moveSelectableKey("a", 1, keys, disabled)).toBe("c");
    expect(moveSelectableKey("c", 1, keys, disabled)).toBe("e");
    expect(moveSelectableKey("e", -1, keys, disabled)).toBe("c");
  });

  it("single selectable item wraps to itself", () => {
    const keys = ["a", "b", "c"];
    const disabled = ["a", "c"];
    expect(moveSelectableKey("b", 1, keys, disabled)).toBe("b");
    expect(moveSelectableKey("b", -1, keys, disabled)).toBe("b");
  });
});
