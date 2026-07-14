/**
 * Internal — group stage.
 *
 * Groups are computed AFTER filter+sort so consumers can paginate groups in
 * display order. Group label resolution is provided by the caller via the
 * `label` parameter (kept on the public type for future i18n integration).
 */

import type {
  CollectionGroup,
  CollectionGroupKey,
  CollectionKey,
  CollectionViewItem,
} from "../types.js";
import type { CollectionEntry } from "./entries.js";
import { toViewItem } from "./entries.js";

export function runGroup<T, K extends CollectionKey>(
  entries: readonly CollectionEntry<T, K>[],
  by: (item: T) => CollectionGroupKey,
  label: (key: CollectionGroupKey) => string
): CollectionGroup<T, K>[] {
  const ordered: CollectionGroupKey[] = [];
  const buckets = new Map<CollectionGroupKey, CollectionEntry<T, K>[]>();

  for (const entry of entries) {
    const key = by(entry.item);
    if (!buckets.has(key)) {
      ordered.push(key);
      buckets.set(key, []);
    }
    buckets.get(key)?.push(entry);
  }

  const groups: CollectionGroup<T, K>[] = [];
  for (const key of ordered) {
    const items = (buckets.get(key) ?? []).map((entry, viewIndex) => toViewItem(entry, viewIndex));
    groups.push({
      key,
      label: label(key),
      items,
      count: items.length,
    });
  }

  return groups;
}

export function flattenGroups<T, K extends CollectionKey>(
  groups: readonly CollectionGroup<T, K>[]
): CollectionViewItem<T, K>[] {
  const out: CollectionViewItem<T, K>[] = [];
  for (const group of groups) {
    for (const item of group.items) {
      out.push(item);
    }
  }
  return out;
}
