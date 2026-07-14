/**
 * Multi-controller + structural selection hook tests.
 *
 * Verifies two collections can share overlapping keys without state leakage,
 * and that the selection integration is fully structural.
 */

import { describe, expect, it } from "vitest";
import { createCollectionController } from "../src/index.js";
import type { Item } from "./fixtures.js";
import { makeItems } from "./fixtures.js";

describe("multi-controller + selection composition", () => {
  it("two controllers with overlapping keys stay isolated", () => {
    const shared = makeItems();
    const a = createCollectionController<Item>({ items: shared });
    const b = createCollectionController<Item>({
      items: makeItems(),
      initialKey: "b",
    });
    a.setActiveKey("c");
    expect(a.activeKey).toBe("c");
    expect(b.activeKey).toBe("b");
    expect(b.view[0]?.key).toBe("a");
  });

  it("isSelected reflects an external structural selection", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      initialKey: "c",
    });
    const selectionLike = {
      selectedKeys: ["a", "c", "d"],
    };
    expect(ctrl.isSelected(selectionLike)).toBe(true);
    ctrl.setActiveKey("b");
    expect(ctrl.isSelected(selectionLike)).toBe(false);
  });

  it("isSelected returns false when the hook is undefined", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      initialKey: "c",
    });
    expect(ctrl.isSelected(undefined)).toBe(false);
  });

  it("view array reports the same length as count", () => {
    const ctrl = createCollectionController<Item>({ items: makeItems() });
    expect(ctrl.view.length).toBe(ctrl.count);
    expect(ctrl.count).toBe(5);
  });
});
