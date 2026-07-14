/**
 * Internal — filter stage.
 *
 * Hidden entries are dropped before the predicate runs: the `isHidden` flag
 * outranks user-supplied filtering. Disabled entries survive filtering so the
 * navigation stage can decide whether to surface them.
 */

import type { CollectionKey, CollectionPredicate } from "../types.js";
import type { CollectionEntry } from "./entries.js";

export function runFilter<T, K extends CollectionKey>(
  entries: readonly CollectionEntry<T, K>[],
  predicate: CollectionPredicate<T>
): CollectionEntry<T, K>[] {
  const out: CollectionEntry<T, K>[] = [];

  for (const entry of entries) {
    if (entry.hidden) {
      continue;
    }
    if (!predicate(entry.item)) {
      continue;
    }
    out.push(entry);
  }

  return out;
}
