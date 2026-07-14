/**
 * Collection controller — framework-agnostic core of
 * `@ailuracode/alpine-collection`.
 *
 * The controller owns:
 *   - A frozen snapshot of the source array.
 *   - A normalized entry map (key, item, source index, disabled, hidden).
 *   - A per-stage derived-view cache invalidated only by stage-specific
 *     counters that monotonically increase on every mutation of that stage.
 *   - An active key pinned by key (not index) so dynamic reorders preserve it.
 *
 * The pipeline runs `entries → filter → sort → group → flatten → paginate`
 * against the snapshot. Group + paginate are optional and no-op when their
 * stage is null.
 *
 * Lifecycle invariants (see `.cursor/rules/new-package.mdc`):
 *   - Constructor does not touch browser globals, timers, or microtasks.
 *   - `mount()` is idempotent; `destroy()` clears the cleanup stack and event
 *     emitter then marks the phase.
 *   - View getters are O(1) cache reads after first computation in the same
 *     stage revision.
 */

import { BaseController } from "@ailuracode/alpine-core";
import { CollectionError } from "./error.js";
import type {
  CollectionChangeDetail,
  CollectionChangeReason,
  CollectionEvents,
  CollectionViewDetail,
} from "./events.js";
import type { CollectionEntry } from "./internal/entries.js";
import { buildEntries, freezeSource, toViewItem } from "./internal/entries.js";
import { runFilter } from "./internal/filter.js";
import { flattenGroups, runGroup } from "./internal/group.js";
import {
  defaultSelectablePredicate,
  firstSelectableKey,
  lastSelectableKey,
  nextActiveKey,
  prevActiveKey,
  reconcileActiveKey,
} from "./internal/navigation.js";
import { computePageCount, paginate } from "./internal/paginate.js";
import { runSort } from "./internal/sort.js";
import {
  clampPage,
  type NormalizedCollectionFilter,
  type NormalizedCollectionGroup,
  type NormalizedCollectionOptions,
  type NormalizedCollectionPagination,
  type NormalizedCollectionSort,
  normalizeCollectionOptions,
} from "./options.js";
import type {
  CollectionGroup,
  CollectionKey,
  CollectionMatchFn,
  CollectionOptions,
  CollectionViewItem,
} from "./types.js";

interface CollectionSnapshot<T, K extends CollectionKey> {
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

type InternalState<T, K extends CollectionKey> = {
  source: readonly T[];
  entries: CollectionEntry<T, K>[];
  filter: NormalizedCollectionFilter<T>;
  filterMatch: CollectionMatchFn<T>;
  sort: NormalizedCollectionSort<T> | null;
  group: NormalizedCollectionGroup<T> | null;
  pagination: NormalizedCollectionPagination | null;
  wrap: boolean;
  activeKey: K | null;
  // Monotonic counters — every mutation that should invalidate a stage's
  // derived output bumps the corresponding counter. Cache entries compare
  // exact equality; bumping by 1 is enough.
  sourceRevision: number;
  filterRevision: number;
  sortRevision: number;
  groupRevision: number;
  paginationRevision: number;
};

type DerivedCache<T, K extends CollectionKey> = {
  filtered: CollectionEntry<T, K>[];
  sorted: CollectionEntry<T, K>[];
  grouped: CollectionGroup<T, K>[];
  flat: CollectionViewItem<T, K>[];
  paginated: CollectionViewItem<T, K>[];
  filterAt: number;
  sortAt: number;
  groupAt: number;
  flatAt: number;
  paginateAt: number;
};

export class CollectionController<T, K extends CollectionKey = string> extends BaseController<
  CollectionEvents<T, K>
> {
  #state: InternalState<T, K>;
  readonly #cache: DerivedCache<T, K>;
  readonly #options: NormalizedCollectionOptions<T, K>;

  constructor(options?: CollectionOptions<T, K>, id?: string) {
    super(id);
    const normalized = normalizeCollectionOptions<T, K>(options);
    const source = freezeSource(options?.items ?? []);
    const entries = buildEntries(
      source,
      normalized.getKey,
      normalized.isDisabled,
      normalized.isHidden
    );
    const initialActive =
      normalized.initialKey !== null && entries.some((entry) => entry.key === normalized.initialKey)
        ? normalized.initialKey
        : null;

    this.#options = normalized;
    // Capture the user-supplied match function so dynamic `setFilter` reruns
    // it against the latest query, instead of storing a snapshot predicate.
    const userMatch: CollectionMatchFn<T> | undefined = options?.filter?.match;

    this.#state = {
      source,
      entries,
      filter: normalized.filter,
      filterMatch: userMatch ?? (() => true),
      sort: normalized.sort,
      group: normalized.group,
      pagination: normalized.pagination,
      wrap: normalized.wrap,
      activeKey: initialActive,
      sourceRevision: 1,
      filterRevision: 1,
      sortRevision: normalized.sort ? 1 : 0,
      groupRevision: normalized.group?.enabled ? 1 : 0,
      paginationRevision: normalized.pagination ? 1 : 0,
    };
    this.#cache = {
      filtered: [],
      sorted: [],
      grouped: [],
      flat: [],
      paginated: [],
      // Negative sentinel so the first `>=` guard always recomputes once,
      // even when the corresponding stage is disabled (state.rev = 0).
      filterAt: -1,
      sortAt: -1,
      groupAt: -1,
      flatAt: -1,
      paginateAt: -1,
    };
  }

  // ── readonly state ------------------------------------------------------

  get source(): readonly T[] {
    return this.#state.source;
  }

  get keys(): readonly K[] {
    return this.#state.entries.map((entry) => entry.key);
  }

  get count(): number {
    this.#ensurePaginationFresh();
    return this.#cache.paginated.length;
  }

  get page(): number {
    this.#ensurePaginationConsistent();
    return this.#state.pagination?.page ?? 1;
  }

  get pageCount(): number {
    this.#ensurePaginationConsistent();
    const pagination = this.#state.pagination;
    if (!pagination) {
      return 1;
    }
    this.#ensureFlatFresh();
    return computePageCount(this.#cache.flat.length, pagination.pageSize);
  }

  get activeKey(): K | null {
    return this.#state.activeKey;
  }

  get query(): string {
    return this.#state.filter.query;
  }

  get wrap(): boolean {
    return this.#state.wrap;
  }

  /** Derived readonly view — post filter, sort, group, paginate. */
  get view(): readonly CollectionViewItem<T, K>[] {
    return this.#paginatedView();
  }

  #paginatedView(): readonly CollectionViewItem<T, K>[] {
    this.#ensurePaginationFresh();
    return this.#cache.paginated;
  }

  /** Derived readonly groups — present only when a group stage is configured. */
  get groups(): readonly CollectionGroup<T, K>[] {
    this.#ensureGroupsFresh();
    return this.#cache.grouped;
  }

  /**
   * Structural selection hook — returns whether the current active key is in
   * the supplied selection. `selection` is defined structurally and never
   * imported, preserving the zero-runtime-dep contract.
   */
  isSelected(selection: { readonly selectedKeys: ReadonlyArray<K> } | undefined): boolean {
    if (!selection) {
      return false;
    }
    const active = this.#state.activeKey;
    if (active === null) {
      return false;
    }
    return selection.selectedKeys.includes(active);
  }

  // ── item registry ------------------------------------------------------

  setItems(items: readonly T[]): void {
    this.#assertAlive("setItems");
    const previous = this.#snapshot();
    const source = freezeSource(items);
    const entries = buildEntries(
      source,
      this.#options.getKey,
      this.#options.isDisabled,
      this.#options.isHidden
    );
    this.#state = {
      ...this.#state,
      source,
      entries,
      sourceRevision: this.#state.sourceRevision + 1,
      filterRevision: this.#state.filterRevision + 1,
      sortRevision: this.#state.sortRevision + 1,
      groupRevision: this.#state.groupRevision + 1,
      paginationRevision: this.#state.paginationRevision + 1,
    };
    this.#reconcileActive(previous);
    this.#commit("items", previous);
  }

  insert(item: T): void {
    this.#assertAlive("insert");
    const previous = this.#snapshot();
    const source = freezeSource([...this.#state.source, item]);
    const entries = buildEntries(
      source,
      this.#options.getKey,
      this.#options.isDisabled,
      this.#options.isHidden
    );
    this.#state = {
      ...this.#state,
      source,
      entries,
      sourceRevision: this.#state.sourceRevision + 1,
      filterRevision: this.#state.filterRevision + 1,
      sortRevision: this.#state.sortRevision + 1,
      groupRevision: this.#state.groupRevision + 1,
      paginationRevision: this.#state.paginationRevision + 1,
    };
    this.#reconcileActive(previous);
    this.#commit("items", previous);
  }

  remove(key: K): void {
    this.#assertAlive("remove");
    if (!this.#state.entries.some((entry) => entry.key === key)) {
      throw new CollectionError(`key "${String(key)}" is not registered`, "INVALID_KEY");
    }
    const previous = this.#snapshot();
    const source = freezeSource(
      this.#state.source.filter((item) => this.#options.getKey(item) !== key)
    );
    const entries = buildEntries(
      source,
      this.#options.getKey,
      this.#options.isDisabled,
      this.#options.isHidden
    );
    this.#state = {
      ...this.#state,
      source,
      entries,
      sourceRevision: this.#state.sourceRevision + 1,
      filterRevision: this.#state.filterRevision + 1,
      sortRevision: this.#state.sortRevision + 1,
      groupRevision: this.#state.groupRevision + 1,
      paginationRevision: this.#state.paginationRevision + 1,
    };
    this.#reconcileActive(previous);
    this.#commit("items", previous);
  }

  // ── filter -------------------------------------------------------------

  setFilter(query: string): void {
    this.#assertAlive("setFilter");
    if (this.#state.filter.query === query) {
      return;
    }
    const previous = this.#snapshot();
    const match = this.#state.filterMatch;
    const enabled = this.#state.filter.enabled;
    const predicate = enabled ? (item: T) => match(item, query) : () => true;
    this.#state = {
      ...this.#state,
      filter: { ...this.#state.filter, query, predicate },
      filterRevision: this.#state.filterRevision + 1,
      sortRevision: this.#state.sortRevision + 1,
      groupRevision: this.#state.groupRevision + 1,
      paginationRevision: this.#state.paginationRevision + 1,
    };
    this.#commit("filter", previous);
  }

  // ── sort ---------------------------------------------------------------

  setSort(options: NormalizedCollectionSort<T> | null): void {
    this.#assertAlive("setSort");
    if (this.#state.sort === options) {
      return;
    }
    const previous = this.#snapshot();
    this.#state = {
      ...this.#state,
      sort: options,
      sortRevision: this.#state.sortRevision + 1,
      groupRevision: this.#state.groupRevision + 1,
      paginationRevision: this.#state.paginationRevision + 1,
    };
    this.#commit("sort", previous);
  }

  // ── group --------------------------------------------------------------

  setGroup(options: NormalizedCollectionGroup<T> | null): void {
    this.#assertAlive("setGroup");
    if (this.#state.group === options) {
      return;
    }
    const previous = this.#snapshot();
    this.#state = {
      ...this.#state,
      group: options,
      groupRevision: this.#state.groupRevision + 1,
      paginationRevision: this.#state.paginationRevision + 1,
    };
    this.#commit("group", previous);
  }

  // ── paginate -----------------------------------------------------------

  setPaginate(options: NormalizedCollectionPagination | null): void {
    this.#assertAlive("setPaginate");
    if (this.#state.pagination === options) {
      return;
    }
    const previous = this.#snapshot();
    this.#state = {
      ...this.#state,
      pagination: options,
      paginationRevision: this.#state.paginationRevision + 1,
    };
    this.#commit("paginate", previous);
  }

  setPage(page: number): void {
    this.#assertAlive("setPage");
    const pagination = this.#state.pagination;
    if (!pagination) {
      return;
    }
    this.#ensureFlatFresh();
    const pageCount = computePageCount(this.#cache.flat.length, pagination.pageSize);
    const safePage = clampPage(page, pageCount);
    if (safePage === pagination.page) {
      return;
    }
    const previous = this.#snapshot();
    this.#state = {
      ...this.#state,
      pagination: { pageSize: pagination.pageSize, page: safePage },
      paginationRevision: this.#state.paginationRevision + 1,
    };
    this.#commit("paginate", previous);
  }

  // ── active navigation --------------------------------------------------

  setActiveKey(key: K | null): void {
    this.#assertAlive("setActiveKey");
    if (this.#state.activeKey === key) {
      return;
    }
    const previous = this.#snapshot();
    this.#state = { ...this.#state, activeKey: key };
    this.#commit("active", previous);
  }

  nextActiveKey(): K | null {
    this.#assertAlive("nextActiveKey");
    this.#ensureFlatFresh();
    const next = nextActiveKey(this.#cache.flat, this.#state.activeKey, this.#navigationOptions());
    if (next === this.#state.activeKey) {
      return next;
    }
    const previous = this.#snapshot();
    this.#state = { ...this.#state, activeKey: next };
    this.#commit("active", previous);
    return next;
  }

  prevActiveKey(): K | null {
    this.#assertAlive("prevActiveKey");
    this.#ensureFlatFresh();
    const next = prevActiveKey(this.#cache.flat, this.#state.activeKey, this.#navigationOptions());
    if (next === this.#state.activeKey) {
      return next;
    }
    const previous = this.#snapshot();
    this.#state = { ...this.#state, activeKey: next };
    this.#commit("active", previous);
    return next;
  }

  firstActiveKey(): K | null {
    this.#assertAlive("firstActiveKey");
    this.#ensureFlatFresh();
    const next = firstSelectableKey(this.#cache.flat, defaultSelectablePredicate<K>);
    if (next === this.#state.activeKey) {
      return next;
    }
    const previous = this.#snapshot();
    this.#state = { ...this.#state, activeKey: next };
    this.#commit("active", previous);
    return next;
  }

  lastActiveKey(): K | null {
    this.#assertAlive("lastActiveKey");
    this.#ensureFlatFresh();
    const next = lastSelectableKey(this.#cache.flat, defaultSelectablePredicate<K>);
    if (next === this.#state.activeKey) {
      return next;
    }
    const previous = this.#snapshot();
    this.#state = { ...this.#state, activeKey: next };
    this.#commit("active", previous);
    return next;
  }

  /** Returns a defensive snapshot of the controller's public surface. */
  snapshot(): CollectionSnapshot<T, K> {
    return this.#snapshot();
  }

  // ── internal computation ----------------------------------------------

  #ensureFilterFresh(): void {
    if (this.#cache.filterAt >= this.#state.filterRevision) {
      return;
    }
    this.#cache.filtered = runFilter(this.#state.entries, this.#state.filter.predicate);
    this.#cache.filterAt = this.#state.filterRevision;
    // Downstream invalidation — sorted depends on filtered.
    this.#cache.sortAt = -1;
  }

  #ensureSortFresh(): void {
    this.#ensureFilterFresh();
    if (this.#cache.sortAt >= this.#state.sortRevision) {
      return;
    }
    if (!this.#state.sort) {
      this.#cache.sorted = [...this.#cache.filtered];
    } else {
      this.#cache.sorted = runSort(
        this.#cache.filtered,
        this.#state.sort.compare,
        this.#state.sort.direction
      );
    }
    this.#cache.sortAt = this.#state.sortRevision;
    // Downstream invalidation — grouped depends on sorted.
    this.#cache.groupAt = -1;
  }

  #ensureGroupsFresh(): void {
    this.#ensureSortFresh();
    if (this.#cache.groupAt >= this.#state.groupRevision) {
      return;
    }
    if (!this.#state.group?.enabled) {
      this.#cache.grouped = [];
    } else {
      this.#cache.grouped = runGroup(
        this.#cache.sorted,
        this.#state.group.by,
        this.#state.group.label
      );
    }
    this.#cache.groupAt = this.#state.groupRevision;
    // Downstream invalidation — flat depends on grouped.
    this.#cache.flatAt = -1;
  }

  #ensureFlatFresh(): void {
    this.#ensureGroupsFresh();
    if (this.#cache.flatAt >= this.#state.groupRevision) {
      return;
    }
    if (this.#cache.grouped.length === 0) {
      this.#cache.flat = this.#cache.sorted.map((entry, viewIndex) => toViewItem(entry, viewIndex));
    } else {
      this.#cache.flat = flattenGroups(this.#cache.grouped);
    }
    this.#cache.flatAt = this.#state.groupRevision;
    // Downstream invalidation — paginated depends on flat.
    this.#cache.paginateAt = -1;
  }

  #ensurePaginationFresh(): void {
    this.#ensureFlatFresh();
    if (this.#cache.paginateAt >= this.#state.paginationRevision) {
      return;
    }
    const pagination = this.#state.pagination;
    if (!pagination) {
      this.#cache.paginated = [...this.#cache.flat];
    } else {
      const pageCount = computePageCount(this.#cache.flat.length, pagination.pageSize);
      const safePage = clampPage(pagination.page, pageCount);
      this.#cache.paginated = paginate(this.#cache.flat, safePage, pagination.pageSize);
    }
    this.#cache.paginateAt = this.#state.paginationRevision;
  }

  #ensurePaginationConsistent(): void {
    const pagination = this.#state.pagination;
    if (!pagination) {
      return;
    }
    this.#ensureFlatFresh();
    const expected = computePageCount(this.#cache.flat.length, pagination.pageSize);
    if (pagination.page > expected) {
      this.#state = {
        ...this.#state,
        pagination: { pageSize: pagination.pageSize, page: expected },
        paginationRevision: this.#state.paginationRevision + 1,
      };
    }
  }

  #navigationOptions(): {
    wrap: boolean;
    selectable: (item: CollectionViewItem<unknown, K>) => boolean;
  } {
    const wrap = this.#state.wrap;
    const selectable: (item: CollectionViewItem<unknown, K>) => boolean = (item) =>
      defaultSelectablePredicate<K>(item);
    return { wrap, selectable };
  }

  #reconcileActive(previous: CollectionSnapshot<T, K>) {
    this.#ensureFlatFresh();
    const next = reconcileActiveKey(
      this.#state.activeKey,
      this.#cache.flat,
      this.#navigationOptions(),
      previous.activeKey
    );
    this.#state = { ...this.#state, activeKey: next };
  }

  #commit(reason: CollectionChangeReason, previous: CollectionSnapshot<T, K>) {
    const snapshot = this.#snapshot();
    const detail: CollectionChangeDetail<T, K> = {
      id: this.id,
      reason,
      previous,
      snapshot,
    };
    this.emit("change", detail);
    const viewDetail: CollectionViewDetail<T, K> = {
      id: this.id,
      view: snapshot.view,
      reason,
    };
    this.emit("view", viewDetail);
  }

  #snapshot(): CollectionSnapshot<T, K> {
    this.#ensurePaginationFresh();
    const view = this.#cache.paginated;
    return {
      keys: this.#state.entries.map((entry) => entry.key),
      count: view.length,
      source: this.#state.source,
      view,
      groups: this.groups,
      page: this.page,
      pageCount: this.#computePageCount(),
      activeKey: this.#state.activeKey,
      query: this.#state.filter.query,
    };
  }

  #computePageCount(): number {
    const pagination = this.#state.pagination;
    if (!pagination) {
      return 1;
    }
    this.#ensureFlatFresh();
    return computePageCount(this.#cache.flat.length, pagination.pageSize);
  }

  #assertAlive(command: string): void {
    if (this.isDestroyed) {
      throw new CollectionError(
        `Cannot invoke "${command}" on destroyed controller "${this.id}"`,
        "CONTROLLER_DESTROYED"
      );
    }
  }
}

/**
 * Public factory — preferred over `new CollectionController(...)` so callers
 * get a precise `CollectionController<T, K>` type with the inferred generics.
 */
export function createCollectionController<T, K extends CollectionKey = string>(
  options?: CollectionOptions<T, K>,
  id?: string
): CollectionController<T, K> {
  return new CollectionController<T, K>(options, id);
}
