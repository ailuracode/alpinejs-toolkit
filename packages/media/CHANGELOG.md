# @ailuracode/alpine-media

## 1.1.0

### Minor Changes

- 1ae869c: Move all public API modules out of `src/internal/` directories and into top-level `src/` locations so the public surface stays consistent with the architecture visibility contract (ALP-30). No runtime behavior changes — every previously-public helper is still reachable through the package barrel.

  ## `@ailuracode/alpine-core`

  The following modules moved from `src/internal/` to `src/`:

  | Module         | Exports                                                                                                                                                                                                                                                 |
  | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `browser.ts`   | `isBrowser`, `safeDocument`, `safeMatchMedia`, `safeWindow`                                                                                                                                                                                             |
  | `define.ts`    | `definePlugin`, `lazyPlugin`, `DefinePluginOptions`, `LazyPluginOptions`                                                                                                                                                                                |
  | `init.ts`      | `createAlpinePlugin`, `initPlugins`, `initPluginsSync`                                                                                                                                                                                                  |
  | `loader.ts`    | `PluginLoaderError`                                                                                                                                                                                                                                     |
  | `registry.ts`  | `registerPlugin`, `unregisterPlugin`, `getRegisteredPlugin`, `getRegisteredPlugins`, `isPluginInitialized`, `markPluginInitialized`, `resetPluginRegistry`, `resolvePluginEntries`, `setRegistryDebugSink`, `getRegistryDebugSink`, `RegistryEventLike` |
  | `singleton.ts` | `createSingleton`, `getSingleton`, `setSingleton`, `clearSingleton`, `clearAllSingletons`                                                                                                                                                               |

  `internal/` now contains only `assert.ts` (truly private validation).

  ## `@ailuracode/alpine-lang`

  | Module            | Exports                                    |
  | ----------------- | ------------------------------------------ |
  | `language-tag.ts` | `normalizeLanguageTag`, `parseLanguageTag` |

  `internal/` is now empty and has been removed.

  ## `@ailuracode/alpine-media`

  | Module          | Exports                  |
  | --------------- | ------------------------ |
  | `breakpoint.ts` | `resolveMediaBreakpoint` |

  `internal/` keeps only the truly-private runtime helpers (`match-media.ts`, `viewport.ts`, `visibility.ts`).

  ## `@ailuracode/alpine-theme`

  The following modules moved from `src/internal/` to `src/`:

  | Module               | Exports                                                             |
  | -------------------- | ------------------------------------------------------------------- |
  | `local-storage.ts`   | `createLocalStorageThemeStorage`, `LocalStorageThemeStorageOptions` |
  | `memory-storage.ts`  | `createMemoryThemeStorage`                                          |
  | `system-observer.ts` | `readSystemTheme`                                                   |

  `internal/storage/` was emptied by this move and has been removed. `internal/` keeps `validation.ts`, `browser.ts`, and `dom-strategy/` (all truly private).

  ## Migration

  The public package barrel (`@ailuracode/alpine-core`, etc.) keeps exporting every helper with the same name. Application-level consumers don't need any changes — only direct imports into the internal subpath (which violates the architecture contract) are affected.

  If your codebase currently imports from a subpath that was moved (e.g. accidentally through `@ailuracode/alpine-core/internal/browser`), update the import to the public barrel or the new top-level path:

  ```diff
  - import { isBrowser } from "@ailuracode/alpine-core/internal/browser";
  + import { isBrowser } from "@ailuracode/alpine-core";
  ```

  ## Architecture tooling

  A new top-level test (`test/architecture-boundary.test.ts`) enforces the contract: any future `src/index.ts` barrel re-exporting from `src/internal/` fails CI.

  A companion test (`test/public-surface-contract.test.ts`) locks the public surface contract of every moved helper so a future refactor cannot silently drop a public export.

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
- 9a44380: `@ailuracode/alpine-media` `CreateMediaOptions` now accepts a `storeKey` so hosts with a pre-existing `$store.media` collision can move the integration surface without forking the controller. The new `DEFAULT_MEDIA_STORE_KEY` constant keeps the rename discoverable from TypeScript; `MEDIA_STORE_KEY` is retained as a deprecated alias for back-compat. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "media"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `mediaPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-media` from the `registrationGuardPending` migration list tracked by `architecture:check`.
- Updated dependencies [3c8b40f]
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
