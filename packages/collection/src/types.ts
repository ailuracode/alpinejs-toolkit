/**
 * Public types for `@ailuracode/alpine-collection`.
 *
 * The controller is generic over the user item shape `T` and a canonical key
 * type `K`. `K` defaults to `string` so existing JSON-friendly IDs work out of
 * the box; consumers with numeric IDs can specialize `K`.
 */

export type CollectionKey = string | number;

export type CollectionKeyFn<T, K extends CollectionKey> = (item: T) => K;

export type CollectionPredicate<T> = (item: T) => boolean;

/**
 * Compares two items. Returning `0` signals equal-sort — the pipeline keeps the
 * original source order to guarantee stable sort.
 */
export type CollectionCompareFn<T> = (a: T, b: T) => number;

export type CollectionMatchFn<T> = (item: T, query: string) => boolean;

export type CollectionGroupKey = string | number | null;

export type CollectionGroupKeyFn<T> = (item: T) => CollectionGroupKey;

export type CollectionSortDirection = "asc" | "desc";

export interface CollectionSortOptions<T> {
  readonly compare: CollectionCompareFn<T>;
  readonly direction?: CollectionSortDirection;
}

export interface CollectionFilterOptions<T> {
  readonly match: CollectionMatchFn<T>;
  readonly initial?: string;
  readonly enabled?: boolean;
}

export interface CollectionGroupOptions<T> {
  readonly by: CollectionGroupKeyFn<T>;
  readonly initialKey?: CollectionGroupKey;
  readonly enabled?: boolean;
}

export interface CollectionPaginateOptions {
  readonly pageSize: number;
  readonly initialPage?: number;
}

export interface CollectionOptions<T, K extends CollectionKey = string> {
  readonly items?: readonly T[];
  readonly getKey?: CollectionKeyFn<T, K>;
  readonly initialKey?: K | null;
  readonly isDisabled?: CollectionPredicate<T>;
  readonly isHidden?: CollectionPredicate<T>;
  readonly filter?: CollectionFilterOptions<T>;
  readonly sort?: CollectionSortOptions<T>;
  readonly group?: CollectionGroupOptions<T>;
  readonly paginate?: CollectionPaginateOptions;
  readonly wrap?: boolean;
}

/**
 * A derived view entry — exposes the original item plus an index for consumers
 * that need a stable row handle across reorders. `index` reflects the position
 * in the post-filter, post-sort view, NOT the position in the source array.
 */
export interface CollectionViewItem<T, K extends CollectionKey = string> {
  readonly item: T;
  readonly key: K;
  readonly index: number;
  readonly disabled: boolean;
  readonly hidden: boolean;
}

export interface CollectionGroup<T, K extends CollectionKey = string> {
  readonly key: CollectionGroupKey;
  readonly label: string;
  readonly items: readonly CollectionViewItem<T, K>[];
  readonly count: number;
}

export interface CollectionInstance<T, K extends CollectionKey = string> {
  readonly keys: readonly K[];
  readonly count: number;
  readonly source: readonly T[];
  readonly view: readonly CollectionViewItem<T, K>[];
  readonly groups: readonly CollectionGroup<T, K>[];
  readonly page: number;
  readonly pageCount: number;
  readonly activeKey: K | null;
  readonly query: string;
}

export interface CollectionPagination {
  readonly page: number;
  readonly pageCount: number;
  readonly pageSize: number;
}

/**
 * Structural contract for an external selection controller. Defined here so
 * `@ailuracode/alpine-collection` can read selected-key lists without
 * importing `@ailuracode/alpine-selection`.
 *
 * Consumers that own selection state pass an object matching this shape via
 * `CollectionOptions.selection` (added in a later revision). The contract is
 * intentionally minimal — only what's needed to compute "am I currently
 * selected?".
 */
export interface CollectionSelectionLike<K extends CollectionKey = string> {
  readonly selectedKeys: ReadonlyArray<K>;
}
