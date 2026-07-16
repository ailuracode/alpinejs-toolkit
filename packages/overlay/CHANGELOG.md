# @ailuracode/alpine-overlay

## 1.1.0

### Minor Changes

- 3031b13: Scope controller singletons to a document or explicit runtime context.

  ### `@ailuracode/alpine-core`

  - Singleton registries are now keyed by `SingletonScope` (`document`, an explicit object from `createSingletonScope()`, or an ambient scope from `runWithSingletonScope()`).
  - New exports: `createSingletonScope`, `runWithSingletonScope`, `resolveSingletonScope`, `releaseSingleton`, `SingletonScope`, `SingletonInitOptions`.
  - `createSingleton` accepts an optional third argument for `scope` and options-conflict diagnostics (first configuration wins; later mismatches emit a `console.warn`).
  - SSR without `document` must pass `scope` or wrap work in `runWithSingletonScope()` — otherwise factories throw `TOOLKIT_SINGLETON_SCOPE_REQUIRED`.

  ### Controller factories (`theme`, `media`, `scroll`, `sidebar`, `lang`, `overlay`, `toast`, `env`)

  - Each `create*()` options object accepts an optional `scope?: SingletonScope`.
  - `destroy()` releases only the slot for the scope the instance was created in.

  ### Migration

  **Browser (unchanged for typical apps):** omit `scope` — the active `document` is used automatically.

  **SSR / tests / multi-realm:**

  ```ts
  import {
    createSingletonScope,
    runWithSingletonScope,
    createTheme,
  } from "@ailuracode/alpine-core";

  // Per-request scope (recommended)
  const scope = createSingletonScope();
  const theme = createTheme({ scope, defaultTheme: "dark" });

  // Or ambient scope for a render pass
  runWithSingletonScope(scope, () => {
    createTheme({ defaultTheme: "dark" });
  });
  ```

  **Conflicting options:** repeated `createTheme({ ... })` calls in the same scope with different options keep the first instance and warn on mismatch.

### Patch Changes

- 3c8b40f: Extend the shared Alpine lifecycle bridge with `syncRecordFromSnapshot` and migrate instance-registry store adapters (`dialog`, `menu`, `tooltip`, `carousel`, `virtual`, `selection`, `overlay`) to `bridgeControllerStore` with explicit subscription teardown on cleanup.
- ade9bc7: Add package-owned Playwright E2E coverage for Alpine Toolkit packages under epic ALP-55.
- 9a44380: `@ailuracode/alpine-overlay` `OverlayOptions` now accepts a `storeKey` so hosts with a pre-existing `$store.overlay` collision can move the integration surface without forking the controller. The new `DEFAULT_OVERLAY_STORE_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "overlay"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `overlayPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-overlay` from the `registrationGuardPending` migration list tracked by `architecture:check`.
- df761b7: Simplify plugin test scaffolding by sharing the mock Alpine harness across packages, and trim duplicated boilerplate from `theme`/`sidebar` storage and `theme`/`sidebar`/`overlay` internal observers. No public API changes.
- 12ca21e: Minify published package builds to reduce final dist artifact size and declare `@ailuracode/alpine-core` as a peer dependency where package runtime code uses core primitives.
- Updated dependencies [3c8b40f]
- Updated dependencies [31949cf]
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
  - @ailuracode/alpine-ui@1.0.1

## 1.0.0

### Minor Changes

- 7a9418a: Add `@ailuracode/alpine-overlay` — a centralized portal root, z-index slot allocator, and open-stack registry for Alpine.js applications.

  - `$store.overlay` exposes `stack`, `count`, `root`, `baseZIndex`, `step` plus `configure({ root, baseZIndex, step })`, `register(plugin, id)`, `unregister(plugin, id)`, `zIndexOf(plugin, id)`, `isOpen(plugin, id)`, and `on('change', listener)`.
  - `$overlay` magic shorthand for the same surface.
  - Idempotent `register()` — repeat calls return the existing z-index and do not emit `change`. Burned slots guarantee monotonic z-index scale (no reuse on release).
  - Stack order matches z-index ascending (top of stack = highest = last element), aligned with OS-level modal stacking semantics.
  - Lazy portal root creation via `safeDocument()` — controller is SSR-safe (constructor never touches `document`).
  - `OverlayController` extends a headless controller shape, exposes a singleton via `createOverlay(options)`, and ships an `OverlayError(INVALID_PLUGIN_ID | INVALID_OPTIONS | OVERLAY_NOT_CONFIGURED | ALREADY_REGISTERED)` taxonomy.
  - Soft-peer contract: `alpine-dialog`, `alpine-menu`, `alpine-tooltip`, `alpine-command` source MUST NOT import `@ailuracode/alpine-overlay`. Overlay-driven demo templates document a legacy fallback (`x-teleport="body"` + manual `z-[N]`) for consumers who do not load overlay.
  - New packages start at `0.0.0`; first publish will be `0.1.0`.

  Add `@ailuracode/alpine-ui` — a thin intermediate layer between `@ailuracode/alpine-core` and the feature packages that ships generic, framework-agnostic UI primitives.

  - `createLocalStorageAdapter<Value>({ key, parse, serialize, crossTab? })` — SSR-safe `window.localStorage` adapter with cross-tab `storage` event forwarding filtered by key + parse. Falls back to a no-op `subscribe` when `crossTab` is disabled.
  - `createMemoryAdapter<Value>({ initial? })` — hermetic in-process cell with pub/sub. `remove()` emits `null` so consumers can distinguish "storage cleared" from "new value set".
  - `createMediaQueryListener(query, listener)` — SSR-safe `matchMedia` subscription with idempotent `Unsubscribe` (re-callable without throwing).
  - `createPortalRoot({ id?, className?, as? })` — SSR-safe portal container factory used by the overlay plugin and exposed for downstream consumers.

  This package publishes no Alpine plugin and has no Alpine dependency — it is purely a set of primitives that feature packages compose.

### Patch Changes

- Updated dependencies [7a9418a]
- Updated dependencies [7a9418a]
- Updated dependencies [7a9418a]
  - @ailuracode/alpine-core@0.2.0
  - @ailuracode/alpine-ui@1.0.0
