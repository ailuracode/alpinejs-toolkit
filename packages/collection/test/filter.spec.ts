/**
 * Filter stage — exact, contains, custom matcher, dynamic updates, default
 * open. Source is not mutated.
 */

import { describe, expect, it } from "vitest";
import { createCollectionController } from "../src/index.js";
import type { Item } from "./fixtures.js";
import { makeItems } from "./fixtures.js";

describe("filter stage", () => {
  it("returns the full source when no filter is configured", () => {
    const ctrl = createCollectionController<Item>({ items: makeItems() });
    expect(ctrl.view.map((entry) => entry.key)).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("filters items via the user-supplied match function", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      filter: {
        match: (item, query) => item.name.toLowerCase().startsWith(query.toLowerCase()),
      },
    });
    ctrl.setFilter("b");
    expect(ctrl.view.map((entry) => entry.key)).toEqual(["b"]);
    ctrl.setFilter("cher");
    expect(ctrl.view.map((entry) => entry.key)).toEqual(["c"]);
  });

  it("does not mutate the source array", () => {
    const items = makeItems();
    const snapshot = JSON.stringify(items);
    const ctrl = createCollectionController<Item>({
      items,
      filter: {
        match: (item, query) => item.name.toLowerCase().includes(query.toLowerCase()),
      },
    });
    ctrl.setFilter("z");
    expect(JSON.stringify(items)).toBe(snapshot);
  });

  it("treats `enabled: false` as a pass-through", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      filter: {
        enabled: false,
        match: () => false,
        initial: "anything",
      },
    });
    expect(ctrl.view.length).toBe(5);
  });

  it("skips items flagged as hidden before running the user predicate", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      filter: {
        match: (item, query) => item.name.toLowerCase().includes(query.toLowerCase()),
      },
      isHidden: (item) => item.id === "b" || item.id === "e",
    });
    ctrl.setFilter("b");
    // Banana (b) and Elderberry (e) are hidden → no items remain.
    expect(ctrl.view.map((entry) => entry.key)).toEqual([]);
  });

  it("recomputes view when query changes", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      filter: {
        match: (item, query) => item.name.toLowerCase().includes(query.toLowerCase()),
      },
    });
    ctrl.setFilter("an");
    expect(ctrl.view.map((entry) => entry.key)).toEqual(["b"]); // Banana contains "an"
    ctrl.setFilter("be");
    expect(ctrl.view.map((entry) => entry.key)).toEqual(["e"]); // only Elderberry contains "be"
  });
});
