/**
 * Internal — registry construction + entry normalization.
 *
 * Public consumers reach this through the controller. Exposed from
 * `internal/` only because unit tests assert the entry shape; the controller
 * itself composes the entry map and snapshots it before any derivation runs.
 */

import type {
  CollectionKey,
  CollectionKeyFn,
  CollectionPredicate,
  CollectionViewItem,
} from "../types.js";

export interface CollectionEntry<T, K extends CollectionKey> {
  readonly key: K;
  readonly item: T;
  readonly index: number;
  readonly disabled: boolean;
  readonly hidden: boolean;
}

/**
 * Freezes the source array so callers cannot mutate it through the reference
 * stored on the controller. `Object.freeze` is shallow — items themselves
 * remain mutable, but the array length and order cannot change underneath us.
 */
export function freezeSource<T>(items: readonly T[]): readonly T[] {
  if (Object.isFrozen(items)) {
    return items;
  }
  return Object.freeze([...items]);
}

export function buildEntries<T, K extends CollectionKey>(
  items: readonly T[],
  getKey: CollectionKeyFn<T, K>,
  isDisabled: CollectionPredicate<T>,
  isHidden: CollectionPredicate<T>
): CollectionEntry<T, K>[] {
  const entries: CollectionEntry<T, K>[] = [];
  const seen = new Set<K>();

  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    entries.push({
      key,
      item,
      index: entries.length,
      disabled: isDisabled(item),
      hidden: isHidden(item),
    });
  }

  return entries;
}

export function toViewItem<T, K extends CollectionKey>(
  entry: CollectionEntry<T, K>,
  viewIndex: number
): CollectionViewItem<T, K> {
  return {
    item: entry.item,
    key: entry.key,
    index: viewIndex,
    disabled: entry.disabled,
    hidden: entry.hidden,
  };
}
