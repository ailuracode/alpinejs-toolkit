/**
 * Option normalization for `@ailuracode/alpine-collection`.
 */

import { CollectionError } from "./error.js";
import type {
  CollectionCompareFn,
  CollectionFilterOptions,
  CollectionGroupKeyFn,
  CollectionGroupOptions,
  CollectionKey,
  CollectionKeyFn,
  CollectionPaginateOptions,
  CollectionPredicate,
  CollectionSortDirection,
  CollectionSortOptions,
  CollectionViewItem,
} from "./types.js";

export type NormalizedCollectionFilter<T> = {
  readonly enabled: boolean;
  readonly query: string;
  readonly predicate: CollectionPredicate<T>;
};

export type NormalizedCollectionSort<T> = {
  readonly compare: CollectionCompareFn<T>;
  readonly direction: CollectionSortDirection;
};

export type NormalizedCollectionGroup<T> = {
  readonly enabled: boolean;
  readonly by: CollectionGroupKeyFn<T>;
  readonly label: (key: CollectionKey | null) => string;
};

export type NormalizedCollectionPagination = {
  readonly pageSize: number;
  readonly page: number;
};

export type NormalizedCollectionOptions<T, K extends CollectionKey> = {
  readonly getKey: CollectionKeyFn<T, K>;
  readonly initialKey: K | null;
  readonly isDisabled: CollectionPredicate<T>;
  readonly isHidden: CollectionPredicate<T>;
  readonly filter: NormalizedCollectionFilter<T>;
  readonly sort: NormalizedCollectionSort<T> | null;
  readonly group: NormalizedCollectionGroup<T> | null;
  readonly pagination: NormalizedCollectionPagination | null;
  readonly wrap: boolean;
};

function defaultGetKey<T, K extends CollectionKey>(item: T): K {
  if (item === null || typeof item !== "object") {
    throw new CollectionError(
      "Cannot derive a default key for non-object items; provide getKey",
      "INVALID_OPTIONS"
    );
  }
  const record = item as Record<string, unknown>;
  if ("id" in record && (typeof record.id === "string" || typeof record.id === "number")) {
    return record.id as K;
  }
  if ("key" in record && (typeof record.key === "string" || typeof record.key === "number")) {
    return record.key as K;
  }
  throw new CollectionError(
    "Cannot derive a default key — items must expose `id` or `key`, or supply getKey",
    "INVALID_OPTIONS"
  );
}

function normalizeFilter<T>(
  raw: CollectionFilterOptions<T> | undefined
): NormalizedCollectionFilter<T> {
  if (!raw) {
    return { enabled: false, query: "", predicate: () => true };
  }
  const enabled = raw.enabled ?? true;
  const query = raw.initial ?? "";
  const match = raw.match;
  return {
    enabled,
    query,
    predicate: (item) => (enabled ? match(item, query) : true),
  };
}

function normalizeSort<T>(
  raw: CollectionSortOptions<T> | undefined
): NormalizedCollectionSort<T> | null {
  if (!raw) {
    return null;
  }
  if (typeof raw.compare !== "function") {
    throw new CollectionError("sort.compare must be a function", "INVALID_OPTIONS");
  }
  return {
    compare: raw.compare,
    direction: raw.direction ?? "asc",
  };
}

function groupLabel(key: CollectionKey | null): string {
  if (key === null) {
    return "Ungrouped";
  }
  return String(key);
}

function normalizeGroup<T>(
  raw: CollectionGroupOptions<T> | undefined
): NormalizedCollectionGroup<T> | null {
  if (!raw) {
    return null;
  }
  if (typeof raw.by !== "function") {
    throw new CollectionError("group.by must be a function", "INVALID_OPTIONS");
  }
  return {
    enabled: raw.enabled ?? true,
    by: raw.by,
    label: groupLabel,
  };
}

function normalizePagination(
  raw: CollectionPaginateOptions | undefined,
  total: number
): NormalizedCollectionPagination | null {
  if (!raw) {
    return null;
  }
  if (!Number.isInteger(raw.pageSize) || raw.pageSize < 1) {
    throw new CollectionError(
      `paginate.pageSize must be a positive integer (received ${String(raw.pageSize)})`,
      "INVALID_PAGINATION"
    );
  }
  const pageCount = Math.max(1, Math.ceil(Math.max(total, 0) / raw.pageSize));
  const requested = raw.initialPage ?? 1;
  const page = clamp(requested, 1, pageCount);
  return { pageSize: raw.pageSize, page };
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

/**
 * Normalizes raw options once at instance creation. Later mutations go through
 * `applyCollectionFilterOptions` / `applyCollectionSortOptions` / etc. (added
 * in the controller layer) which reuse the helpers below.
 */
export function normalizeCollectionOptions<T, K extends CollectionKey>(
  raw:
    | {
        items?: readonly T[];
        getKey?: CollectionKeyFn<T, K>;
        initialKey?: K | null;
        isDisabled?: CollectionPredicate<T>;
        isHidden?: CollectionPredicate<T>;
        filter?: CollectionFilterOptions<T>;
        sort?: CollectionSortOptions<T>;
        group?: CollectionGroupOptions<T>;
        paginate?: CollectionPaginateOptions;
        wrap?: boolean;
      }
    | undefined
): NormalizedCollectionOptions<T, K> {
  const items = raw?.items ?? [];
  const total = items.length;
  const filter = normalizeFilter(raw?.filter);
  const sort = normalizeSort(raw?.sort);
  const group = normalizeGroup(raw?.group);
  const pagination = normalizePagination(raw?.paginate, total);

  return {
    getKey: raw?.getKey ?? (defaultGetKey as CollectionKeyFn<T, K>),
    initialKey: raw?.initialKey ?? null,
    isDisabled: raw?.isDisabled ?? (() => false),
    isHidden: raw?.isHidden ?? (() => false),
    filter,
    sort,
    group,
    pagination,
    wrap: raw?.wrap ?? true,
  };
}

export function clampPage(page: number, pageCount: number): number {
  if (pageCount < 1) {
    return 1;
  }
  return clamp(page, 1, pageCount);
}

/**
 * Stable key check used across commands. Throws when a key is unknown — the
 * pipeline preserves insertion order, so unknown keys come from the consumer,
 * not the controller.
 */
export function assertKnownKey<K extends CollectionKey>(
  keys: readonly K[],
  key: K,
  helper: "INVALID_KEY"
): void {
  if (!keys.includes(key)) {
    throw new CollectionError(`key "${String(key)}" is not registered`, helper);
  }
}

/**
 * Adjacent-key navigation helper used by the navigation stage and unit tests.
 * Given the current key (or start position) and a delta of +1 / -1, returns
 * the next selectable key while honoring the selectable predicate and `wrap`.
 */
export function moveActiveKey<K extends CollectionKey>(
  view: readonly CollectionViewItem<unknown, K>[],
  currentKey: K | null,
  delta: number,
  options: { selectable: (item: CollectionViewItem<unknown, K>) => boolean; wrap: boolean }
): K | null {
  if (view.length === 0) {
    return null;
  }

  const startIndex = resolveStartIndex(view, currentKey, delta);
  const target = startIndex + delta;

  if (!options.wrap) {
    return resolveNonWrap(view, target, currentKey);
  }

  return findSelectableWithWrap(view, target, delta, options.selectable);
}

function resolveStartIndex<K extends CollectionKey>(
  view: readonly CollectionViewItem<unknown, K>[],
  currentKey: K | null,
  delta: number
): number {
  if (currentKey === null) {
    return delta > 0 ? -1 : view.length;
  }
  const found = view.findIndex((entry) => entry.key === currentKey);
  return found === -1 ? (delta > 0 ? -1 : view.length) : found;
}

function resolveNonWrap<K extends CollectionKey>(
  view: readonly CollectionViewItem<unknown, K>[],
  target: number,
  currentKey: K | null
): K | null {
  if (target < 0 || target >= view.length) {
    return currentKey;
  }
  return view[target]?.key ?? null;
}

function findSelectableWithWrap<K extends CollectionKey>(
  view: readonly CollectionViewItem<unknown, K>[],
  start: number,
  delta: number,
  selectable: (item: CollectionViewItem<unknown, K>) => boolean
): K | null {
  const total = view.length;
  let next = start;

  for (let count = 0; count < total; count++) {
    next = wrapIndex(next, total);
    const candidate = view[next];
    if (candidate && selectable(candidate)) {
      return candidate.key;
    }
    next += delta;
  }

  return null;
}

function wrapIndex(index: number, total: number): number {
  if (index < 0) {
    return total - 1;
  }
  if (index >= total) {
    return 0;
  }
  return index;
}
