# @ailuracode/alpine-query-adapter-zustand

## 4.0.0

### Patch Changes

- Updated dependencies [e0c7f02]
  - @ailuracode/alpine-query@0.6.0

## 3.0.1

### Patch Changes

- 78e57f6: Fix publish DTS builds when query packages are rebuilt in parallel during release.

## 3.0.0

### Patch Changes

- 28938e3: Query devtools panel overhaul: responsive mobile layout, resizable bottom panel, follow-latest and remember-open preferences, adapter badges, readable query keys, fetch duration, JSON tree editor, and toolbar back button beside reset. Query core adds fetch timing to devtools snapshots, `resetQueries`, and typed options. New `@ailuracode/alpine-toggle` magic plugin. Store plugins and example app updated; Vitest config migrated to TypeScript.
- Updated dependencies [28938e3]
  - @ailuracode/alpine-query@0.5.0

## 2.0.1

### Patch Changes

- 4abe365: Fix Nanostores and Zustand adapters to apply `undefined` patch values (e.g. mutation `reset()` clears `data`). Route multi-store devtools actions by unique store id when adapter names repeat.

## 2.0.0

### Patch Changes

- e164010: Add `query({ adapter })` as the primary Alpine plugin API. Pass a state adapter, then the plugin registers `$store.query`. Adapter packages export factories for use with `query()`.
- Updated dependencies [e164010]
  - @ailuracode/alpine-query@0.4.0

## 1.0.1

### Patch Changes

- 26bf083: Add required `name` on `QueryStateAdapter` and show it in query devtools (`Alpine Query · Nanostores`).
- Updated dependencies [26bf083]
  - @ailuracode/alpine-query@0.3.1

## 1.0.0

### Minor Changes

- 75eb769: Add three independent query adapter plugins (Alpine.reactive, Nanostores, Zustand). The core package is now store-agnostic and no longer exports a default Alpine plugin.

### Patch Changes

- Updated dependencies [75eb769]
  - @ailuracode/alpine-query@0.3.0
