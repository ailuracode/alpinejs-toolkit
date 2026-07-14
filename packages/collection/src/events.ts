/**
 * Typed event surface for `@ailuracode/alpine-collection`.
 */

import type { CollectionInstance, CollectionKey, CollectionViewItem } from "./types.js";

export type CollectionChangeDetail<T, K extends CollectionKey = string> = {
  readonly id: string;
  readonly reason: CollectionChangeReason;
  readonly previous: CollectionInstance<T, K>;
  readonly snapshot: CollectionInstance<T, K>;
};

export type CollectionViewDetail<T, K extends CollectionKey = string> = {
  readonly id: string;
  readonly view: readonly CollectionViewItem<T, K>[];
  readonly reason: CollectionChangeReason;
};

export type CollectionChangeReason =
  | "items"
  | "filter"
  | "sort"
  | "group"
  | "paginate"
  | "active"
  | "options";

export type CollectionEvents<T, K extends CollectionKey = string> = {
  change: CollectionChangeDetail<T, K>;
  view: CollectionViewDetail<T, K>;
};
