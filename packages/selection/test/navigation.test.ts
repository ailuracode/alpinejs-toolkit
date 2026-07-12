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
});
