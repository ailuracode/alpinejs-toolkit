# @ailuracode/alpine-ui

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

- 7a9418a: Add `@ailuracode/alpine-ui` — a thin intermediate layer between `@ailuracode/alpine-core` and the feature packages in this monorepo that ships generic, framework-agnostic UI primitives.

  - `createLocalStorageAdapter<Value>({ key, parse, serialize, crossTab? })` — SSR-safe `window.localStorage` adapter. Swallows `SecurityError` (Safari private mode, quota exceeded) and forwards cross-tab `storage` events filtered by key + parse. Exposes a no-op `subscribe` when `crossTab` is disabled so consumers can rely on the member existing.
  - `createMemoryAdapter<Value>({ initial? })` — hermetic in-process cell with pub/sub for tests + SSR seeding. `remove()` emits `null` so consumers can distinguish "storage cleared" from "new value set".
  - `createMediaQueryListener(query, listener)` — SSR-safe `matchMedia` subscription helper. Listener receives the raw `MediaQueryListEvent`. `Unsubscribe` is idempotent (re-callable without throwing) and falls back to a no-op when `matchMedia` is unavailable.
  - `createPortalRoot({ id?, className?, as? })` — SSR-safe portal container factory. Returns the existing element when present, otherwise creates and appends a new one to `document.body`. Returns `null` under SSR so callers can short-circuit.

  Both factories return a `SubscribableStorageAdapter<Value>` (the `subscribe` member is always present). `Unsubscribe` is re-exported for one-stop imports.

  This package publishes no Alpine plugin and has no Alpine dependency — it is purely a set of primitives that feature packages compose.

### Patch Changes

- Updated dependencies [7a9418a]
  - @ailuracode/alpine-core@0.2.0
