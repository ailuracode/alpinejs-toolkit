/**
 * Pagination stage — page size, page math, manual page navigation.
 */

import { describe, expect, it } from "vitest";
import { createCollectionController } from "../src/index.js";
import type { Item } from "./fixtures.js";

function makeItems(): Item[] {
  return Array.from({ length: 25 }, (_, index) => ({
    id: String(index + 1),
    name: `Item ${index + 1}`,
    group: index % 2 === 0 ? "fruit" : "veg",
  }));
}

describe("pagination stage", () => {
  it("returns the full view when no pagination is configured", () => {
    const ctrl = createCollectionController<Item>({ items: makeItems() });
    expect(ctrl.view.length).toBe(25);
    expect(ctrl.pageCount).toBe(1);
    expect(ctrl.page).toBe(1);
  });

  it("slices by pageSize and exposes pageCount", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      paginate: { pageSize: 10 },
    });
    expect(ctrl.view.length).toBe(10);
    expect(ctrl.pageCount).toBe(3);
  });

  it("clamps page beyond the available range", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      paginate: { pageSize: 10, initialPage: 99 },
    });
    expect(ctrl.page).toBe(3);
    expect(ctrl.pageCount).toBe(3);
  });

  it("navigates with setPage", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      paginate: { pageSize: 10 },
    });
    ctrl.setPage(2);
    expect(ctrl.page).toBe(2);
    expect(ctrl.view.map((entry) => entry.key)).toEqual([
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
      "18",
      "19",
      "20",
    ]);
  });

  it("setPage is a no-op when pagination is disabled", () => {
    const ctrl = createCollectionController<Item>({ items: makeItems() });
    ctrl.setPage(5);
    expect(ctrl.page).toBe(1);
  });

  it("recomputes page when items shrink below the active page", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      paginate: { pageSize: 10 },
    });
    ctrl.setPage(3);
    expect(ctrl.page).toBe(3);
    ctrl.setItems(makeItems().slice(0, 5));
    expect(ctrl.page).toBe(1);
  });
});
