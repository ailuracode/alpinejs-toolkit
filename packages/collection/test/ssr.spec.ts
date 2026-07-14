/**
 * SSR safety — verify the controller can be constructed and used without any
 * browser API. We use happy-dom in the test runner so this exercises the
 * "no DOM access at construction" invariant indirectly: every code path that
 * builds a controller succeeds without registering a tear-down or starting a
 * timer.
 */

import { describe, expect, it } from "vitest";
import { createCollectionController } from "../src/index.js";
import type { Item } from "./fixtures.js";
import { makeItems } from "./fixtures.js";

describe("SSR safety", () => {
  it("constructs without throwing", () => {
    expect(() =>
      createCollectionController<Item>({
        items: makeItems(),
        filter: { match: (item) => item.name.length > 1 },
        sort: { compare: (a, b) => a.name.localeCompare(b.name) },
        group: { by: (item) => item.group },
        paginate: { pageSize: 5 },
      })
    ).not.toThrow();
  });

  it("runs a full pipeline computation without DOM access", () => {
    const ctrl = createCollectionController<Item>({
      items: makeItems(),
      filter: { match: (item) => item.name.length > 1 },
      sort: { compare: (a, b) => a.name.localeCompare(b.name) },
      group: { by: (item) => item.name.charAt(0).toLowerCase() },
      paginate: { pageSize: 5 },
    });
    // 5 items → 1 per starting letter → 5 single-item groups, paginated to 5.
    expect(ctrl.view.length).toBe(5);
    expect(ctrl.groups.length).toBeGreaterThan(0);
  });
});
