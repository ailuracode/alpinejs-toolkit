# @ailuracode/alpine-query

## 0.6.2

### Patch Changes

- 0008894: Add `QueryCache.destroy()` and `QueryStore.destroy()` lifecycle cleanup for global focus/visibility listeners, query timers, in-flight requests, adapter handles, and devtools subscriptions. Focus listeners detach automatically when no observers remain. The Alpine query plugin wires teardown through `Alpine.cleanup()`.
- 577c59e: Unify `QueryCache` entry removal so `remove`, `removeEntry`, garbage collection, `reset`, and `destroy` share the same disposal path. Adapter `dispose` and devtools unsubscribe now run exactly once; timers and in-flight requests are canceled consistently on every removal path.
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
- 8b079b0: Fix `observe()` returning a shared `destroy()` that was not idempotent per subscription. Each observer now gets its own release handle while sharing the underlying query state via `observer.state`.
- 12ca21e: Minify published package builds to reduce final dist artifact size and declare `@ailuracode/alpine-core` as a peer dependency where package runtime code uses core primitives.

## 0.6.1

### Patch Changes

- Add `throwOnHttpError` option to `typedFetch` for JSON:API error document parsing.

## 0.6.0

### Minor Changes

- e0c7f02: Add `typedFetch` helper for strongly typed JSON `fetch` calls in `queryFn` callbacks, with `HttpError` for non-OK responses.

## 0.5.0

### Minor Changes

- 28938e3: Query devtools panel overhaul: responsive mobile layout, resizable bottom panel, follow-latest and remember-open preferences, adapter badges, readable query keys, fetch duration, JSON tree editor, and toolbar back button beside reset. Query core adds fetch timing to devtools snapshots, `resetQueries`, and typed options. New `@ailuracode/alpine-toggle` magic plugin. Store plugins and example app updated; Vitest config migrated to TypeScript.

## 0.4.0

### Minor Changes

- e164010: Add `query({ adapter })` as the primary Alpine plugin API. Pass a state adapter, then the plugin registers `$store.query`. Adapter packages export factories for use with `query()`.

## 0.3.1

### Patch Changes

- 26bf083: Add required `name` on `QueryStateAdapter` and show it in query devtools (`Alpine Query · Nanostores`).

## 0.3.0

### Minor Changes

- 75eb769: Add three independent query adapter plugins (Alpine.reactive, Nanostores, Zustand). The core package is now store-agnostic and no longer exports a default Alpine plugin.

## 0.2.0

### Minor Changes

- c7d717d: Make the query cache store-agnostic via pluggable `QueryStateAdapter`. Export `vanillaQueryAdapter` (default), `nanostoresQueryAdapter` (recommended), and `createAlpineNanostoresAdapter` for the Alpine plugin with `@nanostores/alpine`.

## 0.1.2

### Patch Changes

- cdf3436: Migrate internal query cache state from Alpine.reactive to Nanostores. Export `createQueryClient()` for framework-agnostic usage; Alpine plugin bridges Nanostores into `$store.query`.

## 0.1.1

### Patch Changes

- 190d37c: Add `@ailuracode/alpine-query-devtools` panel and expose `$store.query.devtools` snapshot/subscribe API on the query plugin.

## 0.1.0

### Minor Changes

- 8e32c64: Add `@ailuracode/alpine-query` — TanStack Query-style async data fetching with caching, invalidation, retries, polling, and mutations for Alpine.js.
