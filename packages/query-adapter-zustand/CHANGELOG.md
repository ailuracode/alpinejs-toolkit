# @ailuracode/alpine-query-adapter-zustand

## 4.0.3

### Patch Changes

- baa901a: Add local development dependency metadata for peer packages so bundle analysis tools can resolve published package entries.
- Updated dependencies [baa901a]
  - @ailuracode/alpine-query-adapter-alpine@4.1.1

## 4.0.2

### Patch Changes

- 5c4e9d3: Restore the framework-agnostic boundary of `@ailuracode/alpine-query` by moving all Alpine-specific code into `@ailuracode/alpine-query-adapter-alpine`.

  ## Moved Alpine-specific exports (`@ailuracode/alpine-query`)

  The following exports now live in `@ailuracode/alpine-query-adapter-alpine`:

  - `query` (default export) — use `query` from `@ailuracode/alpine-query-adapter-alpine` instead
  - `createQueryPlugin` — use from `@ailuracode/alpine-query-adapter-alpine`
  - `createAlpineBridgedAdapter` — use from `@ailuracode/alpine-query-adapter-alpine`
  - `bridgeQueryHandleToAlpine` — use from `@ailuracode/alpine-query-adapter-alpine`
  - `bridgeMutationHandleToAlpine` — use from `@ailuracode/alpine-query-adapter-alpine`
  - `QueryAdapterFactory` type — use from `@ailuracode/alpine-query-adapter-alpine`
  - `QueryRegisterOptions` type — use from `@ailuracode/alpine-query-adapter-alpine`

  The `alpinejs` peer dependency has been removed. `@ailuracode/alpine-query` can now be imported and used without Alpine installed at runtime.

  ## Migration

  Replace Alpine-specific imports:

  ```diff
  - import query from "@ailuracode/alpine-query";
  + import query from "@ailuracode/alpine-query-adapter-alpine";

  - import { createAlpineBridgedAdapter } from "@ailuracode/alpine-query";
  + import { createAlpineBridgedAdapter } from "@ailuracode/alpine-query-adapter-alpine";
  ```

  Framework-agnostic imports remain unchanged:

  ```ts
  import {
    createQueryClient,
    vanillaQueryAdapter,
  } from "@ailuracode/alpine-query";
  ```

  ## New exports (`@ailuracode/alpine-query-adapter-alpine`)

  The adapter package now provides:

  - `query` (default export) — Alpine.js query plugin factory
  - `createQueryPlugin` — programmatic plugin creation
  - `createAlpineBridgedAdapter` — wraps any adapter with Alpine.reactive bindings
  - `bridgeQueryHandleToAlpine` / `bridgeMutationHandleToAlpine` — low-level bridge helpers
  - `QueryAdapterFactory` / `QueryRegisterOptions` types

- 2511f89: Declare `"sideEffects": false` on publishable packages that were missing the metadata, and enforce the policy in `repo:check` and `pack:check`.
- 12ca21e: Minify published package builds to reduce final dist artifact size and declare `@ailuracode/alpine-core` as a peer dependency where package runtime code uses core primitives.
- Updated dependencies [0008894]
- Updated dependencies [577c59e]
- Updated dependencies [5c4e9d3]
- Updated dependencies [2511f89]
- Updated dependencies [8b079b0]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [12ca21e]
  - @ailuracode/alpine-query@0.6.2
  - @ailuracode/alpine-query-adapter-alpine@4.1.0

## 4.0.1

### Patch Changes

- Updated dependencies
  - @ailuracode/alpine-query@0.6.1

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
