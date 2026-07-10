# @ailuracode/alpine-media

## 1.0.0

### Major Changes

- 7a9418a: Breaking rewrite aligned to `@ailuracode/alpine-theme@0.2.x` and `@ailuracode/alpine-toggle@0.3.x`. The package now exposes a controller-based architecture and named exports. The default export is gone — use the named `mediaPlugin(options?)` factory (matches `themePlugin` / `togglePlugin`). The new `MediaController` extends `BaseController` from `@ailuracode/alpine-core`, exposing `id`, `phase`, `isDestroyed`, `mount()`, `destroy()`, and a typed `on('change', listener)` event bus with `{ current, previous, source }` detail payload (`source: 'initialization' | 'viewport' | 'user'`). `@ailuracode/alpine-core` is now a `peerDependency`. `src/global.d.ts` no longer augments `Alpine.Stores` / `Alpine.Magics<T>` — it re-exports public types only. Single `src/index.ts` (492 lines) split into `controller.ts` / `plugin.ts` / `types.ts` / `events.ts` / `internal/*` to match the rest of the toolkit. `store.refresh()` / `refreshWidth()` / `refreshHeight()` now keep the reactive mirror in sync. Build migrated from `tsc` + inline `node -e` to `tsup`. Migration table in the [package README](https://github.com/ailuracode/alpinejs-toolkit/tree/main/packages/media#readme).

### Minor Changes

- 7a9418a: Removed the breakpoint comparison helpers `is(name)`, `isMobile`, `isTablet`, and `isDesktop` from `$store.media`, the `$media` magic, and the `MediaController` surface. These were thin wrappers over `breakpoint === name` that were not reactive in Alpine bindings (the call delegated to the controller without touching the reactive proxy, so `x-bind:class` and `x-show` did not re-evaluate on resize). Compare against the reactive `breakpoint` field directly instead:

  ```html
  <span x-show="$store.media.breakpoint === 'mobile'">Mobile nav</span>
  <span x-show="$store.media.breakpoint === 'desktop'">Desktop nav</span>
  ```

- 7a9418a: Input validation errors (`createMedia` / `resolveMediaBreakpoint` / `MediaController` constructor with empty `intervals`) now throw `@ailuracode/alpine-core`'s `ToolkitError` with `code: 'TOOLKIT_INVALID_ARGUMENT'` instead of a plain `Error`. Consumers can now branch on the error code:

  ```ts
  import { ToolkitError } from "@ailuracode/alpine-core";

  try {
    createMedia({ intervals: [] });
  } catch (err) {
    if (
      err instanceof ToolkitError &&
      err.code === "TOOLKIT_INVALID_ARGUMENT"
    ) {
      // handle invalid intervals
    }
  }
  ```

### Patch Changes

- 7a9418a: Fix reactivity and lifecycle bugs in the Alpine integration:

  - **Feature fields are now live on the reactive proxy.** `prefersReducedMotion`, `prefersContrast`, `prefersColorScheme`, `hover`, `pointer`, `orientation`, and `maxTouchPoints` were previously plain fields seeded once at plugin init; the change event handler never updated them, so `$store.media.prefersColorScheme` (and the rest) returned stale values after the user toggled dark mode. They are now getters that delegate to the controller — every Alpine render reads the live value. The viewport mirror (`width` / `height` / `breakpoint`) keeps its plain-field shape so the change handler can still trigger the proxy.

  - **`mediaPlugin` now routes through the `createMedia()` singleton.** Re-running `Alpine.plugin(mediaPlugin())` returns the same controller instead of leaking a second `resize` listener and a second set of `matchMedia` subscriptions. `Alpine.cleanup` now also unsubscribes the bus listener before destroying the controller, so the slot releases cleanly on HMR / teardown.

  - **`MediaController` constructor no longer touches `window` / `matchMedia`.** All `MediaQueryList` instances are allocated lazily during `mount()`, matching the SSR-safe contract declared in the controller's own docstring. `CachedFeatureMedia` is built once and captured by every `read()` closure, so `refresh()` and per-feature change events never re-invoke `window.matchMedia(...)`.

  - **`#handleFeatureChange` reads only the feature that fired.** Previously a single `matchMedia` change ran `#syncFeatures()` and re-read all six features; it now reads exactly the changed one and emits only when the value moved.

  - **`MEDIA_SINGLETON_KEY` is exported from the package root** so tests and advanced consumers can call `clearSingleton(MEDIA_SINGLETON_KEY)` without re-typing the key string. The per-package test setup resets the slot in `afterEach` so cases are independent of cleanup order.

- Updated dependencies [7a9418a]
  - @ailuracode/alpine-core@0.2.0

## 0.1.0

### Minor Changes

- Unify viewport and media feature plugins into `@ailuracode/alpine-media` with inlined source.

  - Absorbs `screen` and `touch` into a single `$store.media` store

  Removed standalone packages: `@ailuracode/alpine-screen`, `@ailuracode/alpine-touch`.

  Migrate imports to `@ailuracode/alpine-media`.

## 0.0.0

### Major Changes

- Rename `@ailuracode/alpine-screen` to `@ailuracode/alpine-media` with store `$store.media`.
- Add browser media feature detection: `prefersReducedMotion`, `prefersContrast`, `prefersColorScheme`, `hover`, `pointer`, and `orientation`.
- Add `height`, `breakpoint`, and convenience getters `isMobile`, `isTablet`, `isDesktop`.
