/**
 * Controller smoke tests — construction, source frozen, basic view output,
 * initial key, lifecycle.
 */

import { describe, expect, it } from "vitest";
import { createCollectionController } from "../src/controller.js";
import { CollectionError } from "../src/error.js";

interface Item {
  id: string;
  name: string;
  group: "fruit" | "veg";
}

const ITEMS: Item[] = [
  { id: "a", name: "Apple", group: "fruit" },
  { id: "b", name: "Banana", group: "fruit" },
  { id: "c", name: "Carrot", group: "veg" },
  { id: "d", name: "Date", group: "fruit" },
];

describe("createCollectionController — construction", () => {
  it("registers all items in source order", () => {
    const ctrl = createCollectionController<Item>({ items: ITEMS });
    expect(ctrl.keys).toEqual(["a", "b", "c", "d"]);
  });

  it("returns a frozen source array", () => {
    const ctrl = createCollectionController<Item>({ items: [...ITEMS] });
    expect(Object.isFrozen(ctrl.source)).toBe(true);
  });

  it("uses the default `id` key extractor when no getKey is supplied", () => {
    const ctrl = createCollectionController<Item>({ items: ITEMS });
    expect(ctrl.view.map((entry) => entry.key)).toEqual(["a", "b", "c", "d"]);
  });

  it("throws when no key extractor can be derived", () => {
    expect(() =>
      createCollectionController<{ name: string }>({
        items: [{ name: "orphan" }],
      })
    ).toThrow(CollectionError);
  });

  it("uses custom key extractors", () => {
    const ctrl = createCollectionController<Item, string>({
      items: ITEMS,
      getKey: (item) => item.name,
    });
    expect(ctrl.keys).toEqual(["Apple", "Banana", "Carrot", "Date"]);
  });

  it("de-duplicates items with the same key (first wins)", () => {
    const ctrl = createCollectionController<Item>({
      items: [
        { id: "x", name: "First", group: "fruit" },
        { id: "x", name: "Second", group: "fruit" },
      ],
    });
    expect(ctrl.view.length).toBe(1);
    expect(ctrl.view[0]?.item.name).toBe("First");
  });

  it("honors `initialKey` when the key exists", () => {
    const ctrl = createCollectionController<Item>({
      items: ITEMS,
      initialKey: "c",
    });
    expect(ctrl.activeKey).toBe("c");
  });

  it("ignores `initialKey` when the key is unknown", () => {
    const ctrl = createCollectionController<Item>({
      items: ITEMS,
      initialKey: "missing",
    });
    expect(ctrl.activeKey).toBe(null);
  });

  it("destroys idempotently", () => {
    const ctrl = createCollectionController<Item>({ items: ITEMS });
    ctrl.destroy();
    ctrl.destroy();
    expect(() => ctrl.setItems(ITEMS)).toThrow(CollectionError);
    expect(() => ctrl.destroy()).not.toThrow();
  });
});
