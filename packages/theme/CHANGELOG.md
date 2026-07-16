# @ailuracode/alpine-theme

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
- 9a44380: Add registration guards (`guardStore`, `guardMagic`, `guardDirective`) to `@ailuracode/alpine-core`. `bridgeControllerStore` now routes both store and magic registrations through the guards and accepts an optional `packageName` so collision messages point to the right factory. The bridge defaults to `registrationOverride: true` (matches Alpine's native behaviour, keeps HMR / hot reloads / repeated integration tests working) — feature packages that need strict collision detection pass `{ registrationOverride: false }` and surface `RegistrationError("REGISTRATION_COLLISION")` instead of silently overwriting a host or sibling registration. Global test setup calls `resetRegistrationTracking()` between specs so guards do not leak state across tests. `@ailuracode/alpine-theme` is the first feature package migrated and now reports collisions with the dedicated `themePlugin()` factory in the error message. New `architecture:check` rule fails the build if a package outside `packages/core/src/registration.ts` calls `Alpine.store` / `Alpine.magic` / `Alpine.directive` directly; remaining packages are tracked in `architecture-check-policy.mjs#registrationGuardPending` and removed from the list as they migrate.

  `@ailuracode/alpine-theme` now exposes `storeKey` and `magicKey` on `themePlugin(options)` so hosts with a pre-existing `$store.theme` collision can move the integration surface without forking the controller — `magicKey` follows `storeKey` by default, and the new `DEFAULT_THEME_STORE_KEY` / `DEFAULT_THEME_MAGIC_KEY` constants keep the rename discoverable from TypeScript.

- df761b7: Simplify plugin test scaffolding by sharing the mock Alpine harness across packages, and trim duplicated boilerplate from `theme`/`sidebar` storage and `theme`/`sidebar`/`overlay` internal observers. No public API changes.
- Updated dependencies [3c8b40f]
- Updated dependencies [31949cf]
- Updated dependencies [1ae869c]
- Updated dependencies [d10cfcb]
- Updated dependencies [ade9bc7]
- Updated dependencies [556055a]
- Updated dependencies [a488cbb]
- Updated dependencies [aa88539]
- Updated dependencies [173379d]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [7856668]
- Updated dependencies [364ad60]
- Updated dependencies [3031b13]
  - @ailuracode/alpine-core@0.2.1
  - @ailuracode/alpine-ui@1.0.1
  - @ailuracode/alpine-toggle@1.0.1

## 1.0.0

### Minor Changes

- 7a9418a: Drop the `declare global { namespace Alpine }` augmentation in `src/global.d.ts` — `global.d.ts` now only re-exports `ThemeStore` (matches `@ailuracode/alpine-core`'s stance). Consumers that depended on the triple-slash augmentation should declare it in their own `*.d.ts` or use `Alpine<{ theme: ThemeStore }>` from `@ailuracode/alpine-core`. Replace the package-local `ThemeAlpine` definition with the toolkit's generic `Alpine<{ theme: ThemeStore }>` (intersected with `cleanup?`). Fix `ThemeController` constructor calling `super({ id })` with an object instead of a string. Fix `local-storage.ts` type-only import. Build migrated from `tsc` + inline `node -e` to `tsup`. Remove unused `demo`/`demo:build`/`demo:preview` scripts.
- 7a9418a: Fix cross-tab null propagation. `ThemeStorage.subscribe` listener signature widened to `(next: ThemePreference | null) => void`; the in-memory and localStorage adapters now emit `null` when the underlying store is cleared (previously they emitted `'system'`, which was a fabricated value). The controller treats `null` as "external clear" and applies the configured default with `source: 'storage'`. The `#lastWritten` echo marker now uses `undefined` as the "no pending echo" sentinel so legitimate cross-tab clears are no longer mistaken for self-echoes after `reset()`.

  Break the `events.ts ↔ types.ts` import cycle. `ThemeState`, `ThemeChangeSource`, and `ThemeChangeDetail` now live in `types.ts` (where the manager interface references them); `events.ts` owns the `ThemeEvents` event map and the `ThemeListener` alias.

  Move `buildDomOptions` from `controller.ts` to `internal/dom-strategy/options.ts` (it configures strategies, lives next to them). Extract `defaultDomTarget` to `internal/dom-strategy/default-target.ts` (was duplicated in `class.ts` and `attribute.ts`). Inline `createThemeStore` in `plugin.ts` — drop the `as ThemeStore` cast and the `seedStoreFields` / `bindStoreCommands` / `syncFromManager` helpers.

  Reorder `index.ts` exports by domain. `destroy()` order is now `super.destroy()` first (runs registered cleanups against a live lifecycle), then `this.#dom.destroy()`. The `Extract<ThemeChangeSource, ...>` inline type on `applySet` becomes a named `ApplySetSource` alias. `localStorage` private helpers (`readLocalStorage`, `writeLocalStorage`, `removeLocalStorage`, `subscribeLocalStorage`) are no longer exported.

- 7a9418a: `ThemeController` now composes a `ToggleController<'light', 'dark', 'system'>` from `@ailuracode/alpine-toggle` internally to model the three-value `current` state machine. Public API unchanged — every existing test passes against the new composition. Persistence, DOM application, system observation, and cross-tab synchronization continue to live on `ThemeController`. `@ailuracode/alpine-toggle@^0.3` is now a peer dependency.

### Patch Changes

- Updated dependencies [7a9418a]
- Updated dependencies [7a9418a]
- Updated dependencies [7a9418a]
  - @ailuracode/alpine-core@0.2.0
  - @ailuracode/alpine-toggle@1.0.0
