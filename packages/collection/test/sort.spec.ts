/**
 * Sort stage — comparator, direction, stable ties, mutating option at
 * runtime.
 */

import { describe, expect, it } from "vitest";
import { createCollectionController } from "../src/index.js";
import type { Item } from "./fixtures.js";

function makeItems(): Item[] {
  return [
    { id: "a", name: "Apple", group: "fruit" },
    { id: "b", name: "Banana", group: "fruit" },
    { id: "c", name: "Cherry", group: "fruit" },
    { id: "d", name: "Date", group: "fruit" },
    { id: "e", name: "Elderberry", group: "fruit" },
  ];
}

describe("sort stage", () => {
  it("sorts ascending by comparator", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      sort: { compare: (a, b) => a.name.localeCompare(b.name) },
    });
    expect(ctrl.view.map((entry) => entry.item.name)).toEqual([
      "Apple",
      "Banana",
      "Cherry",
      "Date",
      "Elderberry",
    ]);
  });

  it("sorts descending when direction is `desc`", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      sort: {
        compare: (a, b) => a.name.localeCompare(b.name),
        direction: "desc",
      },
    });
    expect(ctrl.view.map((entry) => entry.item.name)).toEqual([
      "Elderberry",
      "Date",
      "Cherry",
      "Banana",
      "Apple",
    ]);
  });

  it("keeps stable source order on ties", () => {
    const ctrl = createCollectionController<Item>({
      items: [
        { id: "1", name: "Same", group: "fruit" },
        { id: "2", name: "Same", group: "fruit" },
        { id: "3", name: "Same", group: "fruit" },
      ],
      sort: { compare: () => 0 },
    });
    expect(ctrl.view.map((entry) => entry.key)).toEqual(["1", "2", "3"]);
  });

  it("toggles sort options at runtime via setSort(null) to disable", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      sort: { compare: (a, b) => a.name.localeCompare(b.name) },
    });
    expect(ctrl.view[0]?.item.name).toBe("Apple");
    ctrl.setSort(null);
    expect(ctrl.view[0]?.key).toBe("a");
  });

  it("does not mutate the source array", () => {
    const items = makeItems();
    const original = items.map((item) => item.name).join(",");
    const ctrl = createCollectionController<Item>({
      items,
      sort: { compare: (a, b) => a.name.localeCompare(b.name) },
    });
    ctrl.view;
    expect(items.map((item) => item.name).join(",")).toBe(original);
  });
});
