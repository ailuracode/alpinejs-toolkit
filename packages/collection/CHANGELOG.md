# @ailuracode/alpine-collection

## 0.1.0

### Minor Changes

- 2bba92c: Add `@ailuracode/alpine-collection` — a framework-agnostic controller that owns a stable key-based item registry and exposes derived readonly views through a memoized `filter → sort → group → flatten → paginate` pipeline.

  - `createCollectionController<T, K>(options)` returns a `CollectionController` with no Alpine dependency. The constructor never touches browser globals, timers, or microtasks.
  - Readonly getters: `source`, `keys`, `count`, `activeKey`, `query`, `wrap`, `view`, `groups`, `page`, `pageCount`.
  - Commands: `setItems`, `insert`, `remove`, `setFilter`, `setSort`, `setGroup`, `setPaginate`, `setPage`, `setActiveKey`, `nextActiveKey`, `prevActiveKey`, `firstActiveKey`, `lastActiveKey`, `snapshot`, `destroy`.
  - Events: `change` (every confirmed state transition) and `view` (derived-view recomputation).
  - Errors: `CollectionError` with stable codes `INVALID_OPTIONS`, `INVALID_KEY`, `INVALID_PAGINATION`, `INVALID_COMPARATOR`, `CONTROLLER_DESTROYED`.
  - Optional structural selection composition via `isSelected(...)` — no runtime dependency on `@ailuracode/alpine-selection`, preserving the zero-cycle contract.

  This release ships the controller only. The Alpine plugin (`Alpine.store('collection', …)` / `$collection` magic) and per-package demo land in follow-up Linear issues.

### Patch Changes

- 12ca21e: Minify published package builds to reduce final dist artifact size and declare `@ailuracode/alpine-core` as a peer dependency where package runtime code uses core primitives.
- Updated dependencies [3c8b40f]
- Updated dependencies [1ae869c]
- Updated dependencies [ade9bc7]
- Updated dependencies [556055a]
- Updated dependencies [a488cbb]
- Updated dependencies [aa88539]
- Updated dependencies [173379d]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [364ad60]
- Updated dependencies [3031b13]
  - @ailuracode/alpine-core@0.2.1

## 0.1.0

### Minor Changes

- Add `@ailuracode/alpine-collection` — a framework-agnostic controller that owns a stable key-based item registry and exposes derived readonly views through a memoized `filter → sort → group → paginate` pipeline. Includes active-item navigation that survives dynamic inserts, removes, reorders, and supports disabled/hidden flags.

  - `createCollectionController<T, K>(options)` returns a `CollectionController` that does not depend on Alpine. The constructor never touches browser globals, timers, or microtasks.
  - `CollectionController.view`, `groups`, `page`, `pageCount`, `count`, `source`, `keys`, and `query` are readonly getters backed by per-stage memoization, invalidated only when their input revision changes.
  - Commands: `setItems`, `insert`, `remove`, `setFilter`, `setSort`, `setGroup`, `setPaginate`, `setPage`, `setActiveKey`, `nextActiveKey`, `prevActiveKey`, `firstActiveKey`, `lastActiveKey`, `snapshot`, `destroy`.
  - Events: `change` (emitted after every confirmed state transition) and `view` (emitted only when derived views recompute).
  - Errors: `CollectionError` with stable codes `INVALID_OPTIONS`, `INVALID_KEY`, `INVALID_PAGINATION`, `INVALID_COMPARATOR`, `CONTROLLER_DESTROYED`.
  - Selection composition is opt-in via a structural `selectionLike` slot — no runtime dependency on `@ailuracode/alpine-selection`, avoiding circular package imports.

  This release ships the controller only. The Alpine plugin (`Alpine.store('collection', …)` / `$collection` magic) is a follow-up and lives in a separate Linear issue.
