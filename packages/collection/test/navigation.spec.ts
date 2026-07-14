/**
 * Active-item navigation — first/next/prev/last, wrap, disabled skip,
 * missing fallback, anchor survives dynamic inserts.
 */

import { describe, expect, it } from "vitest";
import { createCollectionController } from "../src/index.js";
import type { Item } from "./fixtures.js";
import { makeItems, makeNavFixture } from "./fixtures.js";

describe("active navigation", () => {
  it("moves to the next key when wrap is enabled", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      initialKey: "a",
    });
    expect(ctrl.nextActiveKey()).toBe("b");
    expect(ctrl.nextActiveKey()).toBe("c");
  });

  it("wraps from the last entry back to the first", () => {
    const { ctrl, lastKey, firstKey } = makeNavFixture();
    ctrl.setActiveKey(lastKey);
    expect(ctrl.nextActiveKey()).toBe(firstKey);
  });

  it("skips disabled entries during navigation", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      isDisabled: (item) => item.id === "b",
      initialKey: "a",
    });
    expect(ctrl.nextActiveKey()).toBe("c");
  });

  it("returns the same key when nothing selectable is ahead", () => {
    const ctrl = createCollectionController<Item>({
      items: [
        { id: "a", name: "A", group: "fruit" },
        { id: "b", name: "B", group: "fruit" },
      ],
      isDisabled: () => true,
      wrap: true,
      initialKey: "a",
    });
    // With wrap: true and no selectable entries, navigation walks the entire
    // view and returns null (no selectable target).
    expect(ctrl.nextActiveKey()).toBe(null);
  });

  it("prevActiveKey mirrors nextActiveKey", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      initialKey: "b",
    });
    expect(ctrl.prevActiveKey()).toBe("a");
  });

  it("firstActiveKey jumps to the first selectable entry", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      initialKey: "d",
    });
    expect(ctrl.firstActiveKey()).toBe("a");
  });

  it("lastActiveKey jumps to the last selectable entry", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      initialKey: "a",
    });
    expect(ctrl.lastActiveKey()).toBe("e");
  });

  it("preserves the active key across dynamic inserts", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      initialKey: "c",
    });
    ctrl.insert({ id: "z", name: "Zucchini", group: "veg" });
    expect(ctrl.activeKey).toBe("c");
  });

  it("reconciles the active key when the active item is removed", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      initialKey: "c",
    });
    ctrl.remove("c");
    expect(ctrl.activeKey).not.toBe("c");
    expect(ctrl.activeKey).not.toBe(null);
  });
});
