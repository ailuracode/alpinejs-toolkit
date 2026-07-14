/**
 * Internal — sort stage.
 *
 * Uses the canonical `Array.prototype.sort` which is stable in V8, JSC, and
 * SpiderMonkey since 2019. We do not rely on that stability at the API layer
 * — when `compare(a, b)` returns `0` we fall back to the entry's source index
 * to guarantee stable ordering across engines.
 */

import type { CollectionCompareFn, CollectionKey, CollectionSortDirection } from "../types.js";
import type { CollectionEntry } from "./entries.js";

export function runSort<T, K extends CollectionKey>(
  entries: readonly CollectionEntry<T, K>[],
  compare: CollectionCompareFn<T>,
  direction: CollectionSortDirection
): CollectionEntry<T, K>[] {
  const indexed = entries.map((entry, position) => ({ entry, position }));
  indexed.sort((a, b) => {
    const primary = compare(a.entry.item, b.entry.item);
    if (primary !== 0) {
      return direction === "asc" ? primary : -primary;
    }
    return a.position - b.position;
  });
  return indexed.map((record) => record.entry);
}
