# @ailuracode/alpine-collection

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
