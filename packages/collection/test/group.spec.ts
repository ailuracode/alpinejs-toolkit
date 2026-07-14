/**
 * Group stage — by function, label resolution, order preservation, empty
 * stages.
 */

import { describe, expect, it } from "vitest";
import { createCollectionController } from "../src/index.js";
import type { Item } from "./fixtures.js";

function makeItems(): Item[] {
  return [
    { id: "a", name: "Apple", group: "fruit" },
    { id: "b", name: "Banana", group: "fruit" },
    { id: "c", name: "Carrot", group: "veg" },
    { id: "d", name: "Date", group: "fruit" },
    { id: "e", name: "Eggplant", group: "veg" },
  ];
}

describe("group stage", () => {
  it("groups items by the supplied key function", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      group: { by: (item) => item.group },
    });
    const groups = ctrl.groups;
    expect(groups).toHaveLength(2);
    expect(groups[0]?.key).toBe("fruit");
    expect(groups[0]?.items.map((entry) => entry.key)).toEqual(["a", "b", "d"]);
    expect(groups[1]?.key).toBe("veg");
    expect(groups[1]?.items.map((entry) => entry.key)).toEqual(["c", "e"]);
  });

  it("returns an empty groups array when no group stage is configured", () => {
    const ctrl = createCollectionController<Item>({ items: makeItems() });
    expect(ctrl.groups).toEqual([]);
  });

  it("supports null as a group key (ungrouped)", () => {
    const ctrl = createCollectionController<Item, string>({
      items: [
        { id: "a", name: "Apple", group: "fruit" },
        { id: "b", name: "Banana", group: "fruit" },
      ],
      group: { by: () => null },
    });
    expect(ctrl.groups).toHaveLength(1);
    expect(ctrl.groups[0]?.label).toBe("Ungrouped");
  });

  it("exposes the flat view across group boundaries", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      group: { by: (item) => item.group },
      sort: { compare: (a, b) => a.name.localeCompare(b.name) },
    });
    expect(ctrl.view.map((entry) => entry.item.name)).toEqual([
      "Apple",
      "Banana",
      "Date",
      "Carrot",
      "Eggplant",
    ]);
  });

  it("recomputes groups when setGroup mutates", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      group: { by: (item) => item.group },
    });
    ctrl.setGroup(null);
    expect(ctrl.groups).toEqual([]);
  });
});
