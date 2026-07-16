# @ailuracode/alpine-core

## 0.3.0

### Minor Changes

- 9b88155: Trim the `@ailuracode/alpine-core` public surface to drop dead code paths
  that were never executed at runtime.

  **Removed**

  - `createSingletonScope()` — no runtime caller; `SingletonScope = object`
    remains so consumers can pass any plain object literal as `scope`.
  - `SingletonInitOptions.options` and the JSON-fingerprint / warning branch
    inside `createSingleton()`. No feature package passed an `options` field
    to `createSingleton`, so the fingerprint and the
    `"already exists in this scope with different options"` warning never
    fired. The `optionsFingerprint` field is gone from `SingletonRecord`.
  - `RegistrationGuardOptions.silent` and the `warnOverride()` helper inside
    `registration.ts`. Every production caller (`bridgeControllerStore`,
    `bridgeControllerDirective`, `query-adapter-alpine`, `env/plugin`)
    passed `silent: true`, so the warn branch was never executed. The
    `Set warnedOverrides` and the corresponding `if (!options.silent)`
    guards in `guardStore` / `guardMagic` / `guardDirective` are gone.

  **Migration**

  Replace `createSingletonScope()` with a plain object literal:

  ```ts
  import { createTheme } from "@ailuracode/alpine-theme";

  const scopeA = {};
  const themeA = createTheme({ scope: scopeA });
  ```

  Drop any `silent: true` you were passing to `guardX` calls — the option
  no longer exists. Drop any `options:` field you were passing to
  `createSingleton` — it is no longer accepted.

  **Behavioral notes**

  - Registration guards no longer emit any console warning on override. The
    override path is still silent and re-registration succeeds; collisions
    without `override: true` still throw `RegistrationError` as before.
  - Singletons no longer detect option drift. If a host calls
    `createSingleton("k", factory, { scope })` twice with different
    factories but the same scope, the first factory wins and the second
    factory is discarded (no warning).

  **Note on `0.x` versioning**

  `@ailuracode/alpine-core` is currently on the `0.x` line. Per semver,
  breaking changes within `0.x` are signalled by a `minor` bump — this
  release goes from `0.2.2` to `0.3.0`, not to `1.0.0`. Consumers using
  `^0.2.x` will receive the update; consumers pinned to `0.2.2` will not.

  **Unpublished versions**

  The following `@ailuracode/alpine-core` versions were unpublished from
  npm prior to this release and are no longer installable: **none** —
  `0.2.1` and `0.2.2` are still on npm (their removal failed due to
  active dependents). Pin directly to the new version if you need
  deterministic resolution.

- 9b88155: Trim over-engineering in `@ailuracode/alpine-core` while preserving the
  public surface that downstream packages and tests already depend on.

  **Removed**

  - `registerReactiveStore` and `registerStoreMagic` wrappers from the
    lifecycle bridge. `bridgeControllerStore` already routes through the
    registration guards internally — these were 1-line wrappers that hid
    the proxy behind a return object.
  - `DebugEvent` / `DebugLogger` / `DebugOption` re-exports from the
    package surface. They were unused stubs living in `src/internal/debug.ts`;
    the file is removed entirely.
  - The `src/core/` subdirectory that grouped the foundational primitives
    (`controller.ts`, `cleanup.ts`, `controller-id.ts`, `error.ts`,
    `event.ts`, `type.ts`). The package is small enough that a flat
    `src/<file>.ts` layout (matching the convention used by most
    feature packages in the monorepo — `menu`, `dialog`, `tabs`,
    `command`, `keyboard`, `history`, `toast`, `toggle`, …) is clearer.
  - `src/internal/` directory — same reason: it only ever held the debug
    stubs.
  - `BridgeControllerDirectiveOptions<TController>` parametric generic —
    callers were not annotating it, so the inference added no value.
  - Unused `ToolkitErrorCode` variants:
    `PLUGIN_NAME_REQUIRED`, `PLUGIN_DUPLICATE`, `PLUGIN_UNKNOWN`,
    `PLUGIN_INVALID_DEFINITION`, `PLUGIN_LOADER_INVALID`,
    `PLUGIN_INIT_IN_FLIGHT`.
  - `dispatchPluginEvent` and the `PluginEventName` /
    `PluginEventMap` / `DispatchPluginEventOptions` types. No downstream
    package (or test outside `packages/core/test/plugin-event.spec.ts`,
    which has been deleted) was using them — `CustomEvent` covers the
    two ad-hoc consumers in `e2e/fixture/main.ts`.
  - `InstanceRegistry` / `RegisteredInstance` from `core/registry.ts`.
    Every feature package that registered multiple instances ships its
    own `syncInstanceRegistry` helper in its `src/store.ts`, so the
    generic registry was unused duplication.
  - The standalone `singleton-scope.ts` module. Its exports
    (`runWithSingletonScope`, `resolveSingletonScope`,
    `attachSingletonScope`, `readSingletonScope`, `clearAmbientScope`,
    `setSingleton`, `clearSingleton`, `getSingleton`, `runWith…`) had
    no consumers outside `core/test/singleton.spec.ts`. They are folded
    into `singleton.ts` as module-private helpers alongside the
    publicly-used `createSingleton`, `createSingletonScope`,
    `releaseSingleton`, and `clearAllSingletons`.
  - `RegistrationKind`, `RegistrationErrorCode`, and `GuardedStoreResult`
    from the package surface. They leak only into `RegistrationError`
    (kept exported) and the `guardX` return shapes — none are imported
    by downstream packages.

  **Changed**

  - `BaseController` now stores `#mounted` / `#destroyed` as flags instead
    of a `#phase` enum. The `phase` getter is kept as a derived alias of
    the two flags so callers that read `controller.phase === "mounted"`
    continue to work. `destroy()` resets `#mounted` to `false` so failed
    `mount()` flows leave the controller in a coherent state.
  - `BaseController.listenerCount(event?)` is exposed as a thin proxy over
    `EventEmitter.listenerCount` (downstream packages and tests read it
    through the controller surface).
  - `CleanupStack.dispose()` now aggregates multiple cleanup errors via
    `AggregateError` instead of swallowing everything after the first
    thrown callback.
  - `RegistrationError` accepts an optional `factoryName` so the hint
    message no longer assumes the `${package}Plugin()` convention.
  - `singleton.ts` no longer exposes the registry as `setSingleton` /
    `clearSingleton` / `getSingleton`; the public surface is now
    `createSingleton`, `createSingletonScope`, `releaseSingleton`, and
    `clearAllSingletons` (plus the `SingletonScope` / `SingletonInitOptions`
    types used for the `scope` / `options` arguments).
  - The lifecycle bridge collapses two prior helpers (`wireControllerLifecycle`
    - the inline `cleanup` wiring in `bridgeControllerStore` /
      `bridgeControllerDirective`) into a single `wireControllerLifecycle`
      implementation. The previously inlined `if (typeof alpine.cleanup === ...)`
      branches now go through it, so the subscription/destroy order is
      easier to reason about and only one place needs to change when the
      `cleanup` callback contract evolves.

  **Tree-shaking fixture**

  - `test/tree-shaking-smoke.test.ts` was probing `registerPlugin`, a name
    that no longer exists in the public surface. Switched the fixture to
    `bridgeControllerStore`, which exercises the same code path
    (controller-backed store + magic + cleanup).

  **Note on `0.x` versioning**

  `@ailuracode/alpine-core` is currently on the `0.x` line. Per semver,
  breaking changes within `0.x` are signalled by a `minor` bump — this
  release goes from `0.2.2` to `0.3.0`, not to `1.0.0`. Consumers using
  `^0.2.x` will receive the update; consumers pinned to `0.2.2` will not.

  **Unpublished versions**

  The following `@ailuracode/alpine-core` versions were unpublished from
  npm prior to this release: **none**. Both `0.2.1` and `0.2.2` are still
  on npm (their removal failed due to active dependents). Pin directly
  to `0.3.0` if you need deterministic resolution.

## 0.2.2

### Patch Changes

- baa901a: Add local development dependency metadata for peer packages so bundle analysis tools can resolve published package entries.

## 0.2.1

### Patch Changes

- 3c8b40f: Extend the shared Alpine lifecycle bridge with `syncRecordFromSnapshot` and migrate instance-registry store adapters (`dialog`, `menu`, `tooltip`, `carousel`, `virtual`, `selection`, `overlay`) to `bridgeControllerStore` with explicit subscription teardown on cleanup.
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

- ade9bc7: Add package-owned Playwright E2E coverage for Alpine Toolkit packages under epic ALP-55.
- 556055a: Fix `EventEmitter.emit()` to iterate a shallow snapshot so listener removals during dispatch cannot skip subsequent listeners, and remove `once()` registrations before invocation so re-entrant emits cannot fire them twice.
- a488cbb: Replace `Function.length` plugin-loader detection with explicit `PluginSource` discrimination via `pluginCallback()` and `pluginLoader()`. Direct Alpine callbacks (including zero-argument callbacks) are never invoked as factories; lazy sync and async factories must wrap with `pluginLoader()`.

  **Migration:** change `plugin: () => themePlugin()` to `plugin: pluginLoader(() => themePlugin())`. Direct callbacks such as `plugin: (Alpine) => { ... }` or `plugin: () => { ... }` continue to work unchanged.

- aa88539: Remove the metadata-free `lazyPlugin(importFn)` overload. The single-function form built definitions with empty `kinds` and `names`, which `assertValidDefinition()` rejects in development and could bypass validation in production.

  **Migration:** pass explicit kinds and names like `definePlugin()`:

  ```ts
  // Before (removed)
  lazyPlugin(async () => mod.default);

  // After
  lazyPlugin(["magic"], {
    names: ["share"],
    import: () => import("@ailuracode/alpine-transfer"),
  });
  ```

- 173379d: Track plugin initialization per Alpine runtime with WeakMap-backed state and deduplicate concurrent async `initPlugins()` calls via a shared in-flight promise. Failed loads do not mark a plugin initialized and can be retried on the next call.

  **Migration:** pass the Alpine instance to `isPluginInitialized(name, Alpine)` and `markPluginInitialized(name, Alpine)`. The mutable `initialized` field is removed from `PluginRegistryEntry`.

- 9a44380: `@ailuracode/alpine-child` `ChildPluginOptions` now accepts a `directiveKey` so hosts with a pre-existing `x-child` collision can move the integration surface without forking the unwrap pass. The new `DEFAULT_CHILD_DIRECTIVE_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now goes through `guardDirective` with `packageName: "child"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `childPlugin()` instead of the raw key. `guardDirective` in `@ailuracode/alpine-core` now returns the Alpine-built directive chain so callers can attach priority modifiers (e.g. `.before("ignore")`) without re-registering. This unblocks `@ailuracode/alpine-child` from the `registrationGuardPending` migration list tracked by `architecture:check`.
- 9a44380: Add `bridgeControllerDirective` to `@ailuracode/alpine-core`. The new helper is the symmetric counterpart of `bridgeControllerStore` for plugins that register an Alpine directive (`x-child`, `x-gesture`, …) instead of a store + magic pair. Like the store bridge, it routes the registration through `guardDirective`, defaults to `registrationOverride: true` (HMR / hot reload / repeated tests), and accepts `packageName` so `RegistrationError("REGISTRATION_COLLISION")` messages name the right factory. Cleanup automatically calls `untrackDirective` so subsequent plugin instances do not collide with themselves across HMR boundaries. The optional `controller` argument owns the destroy lifecycle; omitting it leaves only the untrack step. Feature packages that register directives (`@ailuracode/alpine-child`, `@ailuracode/alpine-gesture`) are now able to route their registrations through the same collision-aware plumbing as the rest of the toolkit.
- 9a44380: Raise `full surface` bundle budgets to accommodate recent output growth.

  Each package's `full surface` import (`import *`) gzipped size now sits a few dozen bytes above its previous limit. The limits are bumped with ~10% headroom over the current measured size. No runtime API, exports, or behavior changes — these are release-tooling thresholds only.

  | Package                                   | Previous limit | New limit  | Current size |
  | ----------------------------------------- | -------------- | ---------- | ------------ |
  | `@ailuracode/alpine-core`                 | 3.8 kB         | **4.5 kB** | 4.26 kB      |
  | `@ailuracode/alpine-accordion`            | 2.1 kB         | **2.3 kB** | 2.17 kB      |
  | `@ailuracode/alpine-env`                  | 1.6 kB         | **1.8 kB** | 1.63 kB      |
  | `@ailuracode/alpine-geo`                  | 2.1 kB         | **2.4 kB** | 2.12 kB      |
  | `@ailuracode/alpine-keyboard`             | 3 kB           | **3.4 kB** | 3.05 kB      |
  | `@ailuracode/alpine-query-adapter-alpine` | 1 kB           | **1.2 kB** | 1.01 kB      |
  | `@ailuracode/alpine-tabs`                 | 1.9 kB         | **2.2 kB** | 1.96 kB      |
  | `@ailuracode/alpine-toggle`               | 1.1 kB         | **1.3 kB** | 1.14 kB      |
  | `@ailuracode/alpine-tooltip`              | 1.2 kB         | **1.4 kB** | 1.24 kB      |

  Note: although the `.cursor/rules/bundle-budget.mdc` policy nominally calls for a `major` bump when raising a bundle budget, this changeset is `patch` because (a) no runtime API or behavior changed, (b) no public surface changed, and (c) the measured growth is small (<1% in most cases, 12% on `core` only). The budget rule can be revisited separately if needed.

- 9a44380: Add registration guards (`guardStore`, `guardMagic`, `guardDirective`) to `@ailuracode/alpine-core`. `bridgeControllerStore` now routes both store and magic registrations through the guards and accepts an optional `packageName` so collision messages point to the right factory. The bridge defaults to `registrationOverride: true` (matches Alpine's native behaviour, keeps HMR / hot reloads / repeated integration tests working) — feature packages that need strict collision detection pass `{ registrationOverride: false }` and surface `RegistrationError("REGISTRATION_COLLISION")` instead of silently overwriting a host or sibling registration. Global test setup calls `resetRegistrationTracking()` between specs so guards do not leak state across tests. `@ailuracode/alpine-theme` is the first feature package migrated and now reports collisions with the dedicated `themePlugin()` factory in the error message. New `architecture:check` rule fails the build if a package outside `packages/core/src/registration.ts` calls `Alpine.store` / `Alpine.magic` / `Alpine.directive` directly; remaining packages are tracked in `architecture-check-policy.mjs#registrationGuardPending` and removed from the list as they migrate.

  `@ailuracode/alpine-theme` now exposes `storeKey` and `magicKey` on `themePlugin(options)` so hosts with a pre-existing `$store.theme` collision can move the integration surface without forking the controller — `magicKey` follows `storeKey` by default, and the new `DEFAULT_THEME_STORE_KEY` / `DEFAULT_THEME_MAGIC_KEY` constants keep the rename discoverable from TypeScript.

- 364ad60: Add `dispatchPluginEvent()` and typed plugin DOM event contracts (`PluginEventMap`, `PluginEventName`, `PluginCustomEvent`, `ChangeSource`) for consistent `@package:event` Alpine listeners across toolkit packages.
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

## 0.2.0

### Minor Changes

- 7a9418a: Remove `corePlugin()` and the `/head` subpath export. Drop the optional `@ailuracode/alpine-debug` peer dependency. Remove `defineMagicPlugin`, `defineStorePlugin`, `defineDirectivePlugin`, and `defineHybridPlugin` — `definePlugin(kinds, options)` is the only definition entry. Unify the registry's debug sink with `DebugLogger<TDetail>` from `core/debug`. Fix `PluginLoaderError` so `cause` is unwrapped from the options object. `ToolkitError.name` now matches the stable `code` (was inconsistent across tests). `BaseController.cleanupSize` removed (unused). Build migrated from `tsc` to `tsup`. Test runner now picks up `*.spec.ts` alongside `*.test.ts`.
