# @ailuracode/alpine-query-kit

## 0.2.2

### Patch Changes

- @ailuracode/alpine-query-adapter-alpine@5.0.0

## 0.2.1

### Patch Changes

- baa901a: Add local development dependency metadata for peer packages so bundle analysis tools can resolve published package entries.
- Updated dependencies [baa901a]
  - @ailuracode/alpine-query-adapter-alpine@4.1.1

## 0.2.0

### Minor Changes

- dee4b0f: Document and enforce a path-scoped styling exception for Query Devtools (ALP-36).

  ## `@ailuracode/alpine-query-kit`

  - Main entry is now **headless only** — no devtools UI in the default bundle.
  - Devtools move to **`@ailuracode/alpine-query-kit/devtools`** subpath.
  - `queryKitWithDevtoolsPlugin` replaces `queryKit({ devtools: options })`.
  - `repo:check` scans for headless CSS violations outside `packages/query-kit/src/devtools/**`.

  ## Migration

  ```diff
  - import queryKit, { queryDevtoolsPlugin } from "@ailuracode/alpine-query-kit";
  + import queryKit from "@ailuracode/alpine-query-kit";
  + import { queryDevtoolsPlugin } from "@ailuracode/alpine-query-kit/devtools";

  Alpine.plugin(queryKit());
  - Alpine.plugin(queryKit({ devtools: { theme: "dark" } }));
  + import { queryKitWithDevtoolsPlugin } from "@ailuracode/alpine-query-kit/devtools";
  + Alpine.plugin(queryKitWithDevtoolsPlugin({ devtools: { theme: "dark" } }));
  ```

  Production apps that only need the cache + Nanostores adapter can keep `import queryKit from "@ailuracode/alpine-query-kit"` without pulling devtools styles into the bundle.

### Patch Changes

- 0008894: Add `QueryCache.destroy()` and `QueryStore.destroy()` lifecycle cleanup for global focus/visibility listeners, query timers, in-flight requests, adapter handles, and devtools subscriptions. Focus listeners detach automatically when no observers remain. The Alpine query plugin wires teardown through `Alpine.cleanup()`.
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
- ade9bc7: Add package-owned Playwright E2E coverage for Alpine Toolkit packages under epic ALP-55.
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

## 0.1.0

### Minor Changes

- 531ed60: Unify the recommended Alpine query stack into one package with inlined source.

  - Nanostores adapter (`nanostoresQueryAdapter`, `createAlpineNanostoresAdapter`, `NanoStores`)
  - Query devtools panel (`queryDevtoolsPlugin`, `mountQueryDevtools`)
  - Re-exports `@ailuracode/alpine-query`

  Removed standalone packages: `@ailuracode/alpine-query-adapter-nanostores`, `@ailuracode/alpine-query-devtools`.

  Migrate imports to `@ailuracode/alpine-query-kit`. Use `queryKit({ devtools: false })` when you only need the cache + Nanostores adapter.
