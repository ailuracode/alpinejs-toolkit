---
"@ailuracode/alpine-collection": minor
---

Add `@ailuracode/alpine-collection` — a framework-agnostic controller that owns a stable key-based item registry and exposes derived readonly views through a memoized `filter → sort → group → flatten → paginate` pipeline.

- `createCollectionController<T, K>(options)` returns a `CollectionController` with no Alpine dependency. The constructor never touches browser globals, timers, or microtasks.
- Readonly getters: `source`, `keys`, `count`, `activeKey`, `query`, `wrap`, `view`, `groups`, `page`, `pageCount`.
- Commands: `setItems`, `insert`, `remove`, `setFilter`, `setSort`, `setGroup`, `setPaginate`, `setPage`, `setActiveKey`, `nextActiveKey`, `prevActiveKey`, `firstActiveKey`, `lastActiveKey`, `snapshot`, `destroy`.
- Events: `change` (every confirmed state transition) and `view` (derived-view recomputation).
- Errors: `CollectionError` with stable codes `INVALID_OPTIONS`, `INVALID_KEY`, `INVALID_PAGINATION`, `INVALID_COMPARATOR`, `CONTROLLER_DESTROYED`.
- Optional structural selection composition via `isSelected(...)` — no runtime dependency on `@ailuracode/alpine-selection`, preserving the zero-cycle contract.

This release ships the controller only. The Alpine plugin (`Alpine.store('collection', …)` / `$collection` magic) and per-package demo land in follow-up Linear issues.
