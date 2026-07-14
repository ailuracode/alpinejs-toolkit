/**
 * Event surface — change and view emissions are scoped to the controller
 * lifecycle.
 */

import { describe, expect, it } from "vitest";
import { createCollectionController } from "../src/index.js";
import type { Item } from "./fixtures.js";
import { makeItems } from "./fixtures.js";

describe("events", () => {
  it("emits change + view on a successful filter update", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      filter: {
        match: (item, query) => item.name.toLowerCase().startsWith(query.toLowerCase()),
      },
    });
    const changes: string[] = [];
    ctrl.on("change", (detail) => changes.push(detail.reason));
    ctrl.setFilter("a");
    expect(changes).toEqual(["filter"]);
  });

  it("does not emit when setFilter is a no-op", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
    });
    let count = 0;
    ctrl.on("change", () => count++);
    ctrl.setFilter("");
    expect(count).toBe(0);
  });

  it("emits `items` after setItems", () => {
    const ctrl = createCollectionController<Item>({ items: makeItems() });
    const reasons: string[] = [];
    ctrl.on("change", (detail) => reasons.push(detail.reason));
    ctrl.setItems(makeItems().slice(0, 2));
    expect(reasons).toEqual(["items"]);
  });

  it("removes listeners after destroy", () => {
    const ctrl = createCollectionController<Item>({ items: makeItems() });
    let count = 0;
    const unsub = ctrl.on("change", () => count++);
    unsub();
    ctrl.destroy();
    expect(count).toBe(0);
  });
});
