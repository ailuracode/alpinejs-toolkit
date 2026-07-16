# @ailuracode/alpine-collection

Framework-agnostic collection primitives for Alpine.js — filtering, sorting,
grouping, pagination, and active-item navigation over a stable key registry.

## Install

```bash
pnpm add @ailuracode/alpine-collection
```

## Quick start

```ts
import { createCollectionController } from "@ailuracode/alpine-collection";

type Item = { id: string; name: string; group: "fruit" | "veg" };

const collection = createCollectionController<Item>({
  items: [
    { id: "a", name: "Apple", group: "fruit" },
    { id: "b", name: "Banana", group: "fruit" },
    { id: "c", name: "Carrot", group: "veg" },
  ],
  getKey: (item) => item.id,
  isDisabled: (item) => item.id === "b",
  filter: { match: (item, query) => item.name.toLowerCase().includes(query) },
  sort: { compare: (a, b) => a.name.localeCompare(b.name) },
  group: { by: (item) => item.group },
});

collection.setFilter("ap");
collection.view; // [Apple] (Carrot filtered, Banana disabled + filtered)
collection.setActiveKey("c");
collection.nextActiveKey(); // "a" (filters + sort)
```

## Architectural role

`alpine-collection` is the **derived-state layer** below feature packages such
as `@ailuracode/alpine-command`, `@ailuracode/alpine-menu`, and any consumer
that owns a list of items with selection, navigation, or pagination. It owns:

- A **stable key-based item registry** derived from a source array.
- A **pipeline** of pure stages (`filter → sort → group → paginate`) whose
  results are memoized per-stage and exposed as readonly derived views.
- **Active-item navigation** that survives dynamic inserts, removes, and reorders.
- **Disabled and hidden item flags** consulted by every stage so neither view
  nor navigation surface unreachable items.

It ships no Alpine plugin and has no hard Alpine dependency. The controller
never touches `window`, `document`, or timers in its constructor.

## What this package is NOT

| Concern | Belongs in |
|---|---|
| Render tables, lists, trees, listboxes | UI layer of the consumer |
| Persist or fetch remote data | `@ailuracode/alpine-query` |
| Own selection values | `@ailuracode/alpine-selection` |
| Virtualize oversize windows | `@ailuracode/alpine-virtual` |
| State management reactivity | Alpine, Nanostores, Zustand (consumers) |

## Controller API

```ts
const collection = createCollectionController<Item, Key>(options);
```

| Member | Kind | Description |
|---|---|---|
| `view` | readonly getter | Items after `filter → sort → group → paginate` as a `ReadonlyArray`. |
| `groups` | readonly getter | `ReadonlyArray<CollectionGroup<T>>` when `group.by` is configured. |
| `page` | readonly getter | The current page (when `paginate.pageSize` is set). |
| `pageCount` | readonly getter | Total pages. |
| `count` | readonly getter | `view.length`. |
| `source` | readonly getter | The original source array (frozen snapshot). |
| `keys` | readonly getter | All registered keys in source order. |
| `activeKey` | getter/setter | Anchor for `nextActiveKey` / `prevActiveKey`. |
| `query` | getter/setter | Current filter query (`setFilter(value)` updates this). |
| `setItems(items)` | command | Replace the source registry. |
| `insert(item)` | command | Append a single item. |
| `remove(key)` | command | Remove by key. |
| `setFilter(query)` | command | Update the filter text + recompute. |
| `sort` | command | Update sort options. |
| `group` | command | Update group options. |
| `paginate` | command | Update pagination options. |
| `setPage(page)` | command | Set the active page. |
| `nextActiveKey()` | command | Move active forward (skips disabled/hidden, wraps when `wrap`). |
| `prevActiveKey()` | command | Move active backward. |
| `firstActiveKey()` | command | First selectable key in the current view. |
| `lastActiveKey()` | command | Last selectable key in the current view. |
| `on(event, listener)` | event | Listen for `change` and `view` events. |
| `destroy()` | command | Idempotent teardown. |

## Plugin options

```ts
export interface CollectionOptions<T, K extends string | number> {
  readonly items?: readonly T[];
  readonly getKey?: (item: T) => K;
  readonly initialKey?: K | null;
  readonly isDisabled?: (item: T) => boolean;
  readonly isHidden?: (item: T) => boolean;
  readonly filter?: CollectionFilterOptions<T>;
  readonly sort?: CollectionSortOptions<T>;
  readonly group?: CollectionGroupOptions<T>;
  readonly paginate?: CollectionPaginateOptions;
  readonly wrap?: boolean;
}
```

## Roadmap

The Alpine plugin (`Alpine.store('collection', …)`, `$collection` magic) and a
devtools overlay are planned in follow-up Linear issues. This package ships the
controller first so consumers can integrate before the plugin layer lands.

## License

MIT © [ailuracode](https://github.com/ailuracode)
