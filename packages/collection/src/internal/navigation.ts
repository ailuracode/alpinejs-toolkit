/**
 * Internal — active-item navigation.
 *
 * The active key is anchored to a key, not an index, so it survives reorders
 * and dynamic inserts. Navigation walks the post-filter, post-sort view
 * (NOT the post-pagination slice — pagination is purely cosmetic for layout).
 */

import { moveActiveKey } from "../options.js";
import type { CollectionKey, CollectionViewItem } from "../types.js";

export interface NavigationOptions<K extends CollectionKey = CollectionKey> {
  readonly wrap: boolean;
  readonly selectable: (item: CollectionViewItem<unknown, K>) => boolean;
}

export function nextActiveKey<K extends CollectionKey>(
  view: readonly CollectionViewItem<unknown, K>[],
  currentKey: K | null,
  options: NavigationOptions<K>
): K | null {
  return moveActiveKey(view, currentKey, 1, options);
}

export function prevActiveKey<K extends CollectionKey>(
  view: readonly CollectionViewItem<unknown, K>[],
  currentKey: K | null,
  options: NavigationOptions<K>
): K | null {
  return moveActiveKey(view, currentKey, -1, options);
}

export function firstSelectableKey<K extends CollectionKey>(
  view: readonly CollectionViewItem<unknown, K>[],
  selectable: NavigationOptions<K>["selectable"]
): K | null {
  for (const entry of view) {
    if (entry && selectable(entry)) {
      return entry.key;
    }
  }
  return null;
}

export function lastSelectableKey<K extends CollectionKey>(
  view: readonly CollectionViewItem<unknown, K>[],
  selectable: NavigationOptions<K>["selectable"]
): K | null {
  for (let i = view.length - 1; i >= 0; i--) {
    const entry = view[i];
    if (entry && selectable(entry)) {
      return entry.key;
    }
  }
  return null;
}

/**
 * Default selectable predicate: anything not disabled. Hidden items are
 * absent from the view already, so they're naturally excluded.
 */
export function defaultSelectablePredicate<K extends CollectionKey>(
  item: CollectionViewItem<unknown, K>
): boolean {
  return !item.disabled;
}

/**
 * Reconciles the active key after the registry changes. If the current key is
 * gone, prefer (in order): an explicit next-best match supplied by the caller,
 * the navigation `nextActiveKey` walk, or `null`.
 */
export function reconcileActiveKey<K extends CollectionKey>(
  previous: K | null,
  view: readonly CollectionViewItem<unknown, K>[],
  options: NavigationOptions<K>,
  fallback?: K | null
): K | null {
  if (previous !== null && view.some((entry) => entry.key === previous)) {
    return previous;
  }
  if (fallback !== undefined && fallback !== null && view.some((entry) => entry.key === fallback)) {
    return fallback;
  }
  if (previous !== null) {
    return nextActiveKey(view, previous, options);
  }
  return firstSelectableKey(view, options.selectable);
}
