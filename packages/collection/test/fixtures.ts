/**
 * Shared test fixtures.
 */

import { createCollectionController } from "../src/index.js";

export interface Item {
  id: string;
  name: string;
  group: "fruit" | "veg";
}

export function makeItems(): Item[] {
  return [
    { id: "a", name: "Apple", group: "fruit" },
    { id: "b", name: "Banana", group: "fruit" },
    { id: "c", name: "Cherry", group: "fruit" },
    { id: "d", name: "Date", group: "fruit" },
    { id: "e", name: "Elderberry", group: "fruit" },
  ];
}

export function makeNavFixture(options?: { wrap?: boolean }): {
  ctrl: ReturnType<typeof createCollectionController<Item>>;
  firstKey: Item["id"];
  lastKey: Item["id"];
} {
  const ctrl = createCollectionController<Item>({
    items: makeItems(),
    wrap: options?.wrap ?? true,
  });
  return {
    ctrl,
    firstKey: "a",
    lastKey: "e",
  };
}
