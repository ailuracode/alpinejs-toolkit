# @ailuracode/alpine-query-devtools

## 0.2.1

### Patch Changes

- 78e57f6: Fix publish DTS builds when query packages are rebuilt in parallel during release.

## 0.2.0

### Minor Changes

- 28938e3: Query devtools panel overhaul: responsive mobile layout, resizable bottom panel, follow-latest and remember-open preferences, adapter badges, readable query keys, fetch duration, JSON tree editor, and toolbar back button beside reset. Query core adds fetch timing to devtools snapshots, `resetQueries`, and typed options. New `@ailuracode/alpine-toggle` magic plugin. Store plugins and example app updated; Vitest config migrated to TypeScript.

### Patch Changes

- Updated dependencies [28938e3]
  - @ailuracode/alpine-query@0.5.0

## 0.1.9

### Patch Changes

- 4abe365: Fix Nanostores and Zustand adapters to apply `undefined` patch values (e.g. mutation `reset()` clears `data`). Route multi-store devtools actions by unique store id when adapter names repeat.

## 0.1.8

### Patch Changes

- 035bfac: Inspect multiple query clients in one devtools panel via `additionalStores` (e.g. `$store.query` plus headless `createQueryClient()` instances). Merged snapshots show adapter labels and route cache actions to the correct client.

## 0.1.7

### Patch Changes

- c7952c7: Add dark mode to the devtools panel. Follows the host app theme via `data-theme`, `.dark`, or system preference, with optional `theme: "light" | "dark" | "system"`.

## 0.1.6

### Patch Changes

- 8bd678d: Restyle the devtools panel with a shadcn/ui-inspired light theme: zinc palette, subtle borders, tab list, outline badges, and primary/destructive/ghost button variants.

## 0.1.5

### Patch Changes

- Updated dependencies [e164010]
  - @ailuracode/alpine-query@0.4.0

## 0.1.4

### Patch Changes

- 26bf083: Add required `name` on `QueryStateAdapter` and show it in query devtools (`Alpine Query · Nanostores`).
- Updated dependencies [26bf083]
  - @ailuracode/alpine-query@0.3.1

## 0.1.3

### Patch Changes

- Updated dependencies [75eb769]
  - @ailuracode/alpine-query@0.3.0

## 0.1.2

### Patch Changes

- Updated dependencies [c7d717d]
  - @ailuracode/alpine-query@0.2.0

## 0.1.1

### Patch Changes

- Updated dependencies [cdf3436]
  - @ailuracode/alpine-query@0.1.2

## 0.1.0

### Minor Changes

- 190d37c: Add `@ailuracode/alpine-query-devtools` panel and expose `$store.query.devtools` snapshot/subscribe API on the query plugin.

### Patch Changes

- Updated dependencies [190d37c]
  - @ailuracode/alpine-query@0.1.1
