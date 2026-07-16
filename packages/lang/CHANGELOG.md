# @ailuracode/alpine-lang

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
- d10cfcb: Move initialization side effects out of `ToggleController` and `LangController` constructors.

  - `ToggleController` no longer schedules microtasks or emits events during construction; `mount()` owns the initialization `change` event.
  - `LangController` no longer reads the global `navigator` during construction; browser detection runs in `mount()` when no navigator is injected.
  - `createToggle()` and `createLang()` continue to return fully initialized controllers by constructing and mounting internally.

- ade9bc7: Add package-owned Playwright E2E coverage for Alpine Toolkit packages under epic ALP-55.
- 9a44380: `@ailuracode/alpine-lang` `LangPluginOptions` now accepts a `storeKey` so hosts with a pre-existing `$store.lang` collision can move the integration surface without forking the controller. The new `DEFAULT_LANG_STORE_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "lang"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `langPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-lang` from the `registrationGuardPending` migration list tracked by `architecture:check`.
- 12ca21e: Minify published package builds to reduce final dist artifact size and declare `@ailuracode/alpine-core` as a peer dependency where package runtime code uses core primitives.
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

### Minor Changes

- 7a9418a: Migrate to the headless controller architecture shared with `@ailuracode/alpine-theme`. The package now exposes a `LangController extends BaseController<LangEvents>` plus a headless `createLang(options)` factory (singleton per document); `langPlugin(options)` is a thin Alpine adapter that wires the controller into `$store.lang` and `$lang`.

  **Breaking changes:**

  - Drop the default export. Import the named `langPlugin` factory instead:
    ```diff
    - import lang from "@ailuracode/alpine-lang";
    - Alpine.plugin(lang({ fallback: "en" }));
    + import { langPlugin } from "@ailuracode/alpine-lang";
    + Alpine.plugin(langPlugin({ fallback: "en" }));
    ```
  - Drop the registration-time `LangPluginOptions.onChange` callback. Subscribe to the manager's typed `change` event for side effects, with multiple subscribers and runtime (un)subscription:

    ```js
    import { createLang } from "@ailuracode/alpine-lang";

    const lang = createLang({ fallback: "en" });
    const stop = lang.on("change", (detail) => {
      // detail: { current, base, region, languages, fallback, isDetected, source, previous }
      // source is "initialization" | "user" | "reset".
      document.documentElement.lang = detail.current;
      loadMessages(detail.current);
    });
    ```

    `Alpine.plugin(langPlugin(...))` and `createLang(...)` reach the same singleton controller, so you can subscribe from any module without coordinating with Alpine's startup sequence.

  **New additions:**

  - `createLang(options)` returns the singleton `LangController` for non-Alpine consumers (custom stores, server adapters, tests).
  - `NavigatorLike` injection via `createLang({ navigator })` for SSR adapters and test fixtures. Pass `null` to disable browser detection explicitly.
  - Typed `LangEvents` event map + `LangListener` callback alias (re-exported from the package root).
  - `manager.get()` returns an immutable `LangState` snapshot (`current` / `base` / `region` / `languages` / `fallback` / `isDetected`).
  - `LangChangeSource = "initialization" | "user" | "reset"` and structured `LangChangeDetail` (with `previous` and full snapshot) reach every subscriber.

  **Internal:**

  - Split the monolithic source into `controller.ts` / `events.ts` / `plugin.ts` / `types.ts` / `internal/language-tag.ts`; `index.ts` is re-exports only.
  - Drop the `Alpine.Stores` / `Alpine.Magics<T>` augmentation in `src/global.d.ts` — same pattern as `@ailuracode/alpine-theme`. Consumers that need typed `$store.lang` access should declare the augmentation in their own `*.d.ts` (or use `Alpine<{ lang: LangStore }>` from `@ailuracode/alpine-core`).
  - Add `@ailuracode/alpine-core` as both `peerDependencies` and `devDependencies`.
  - Tests split into `manager.test.ts` (controller-level with navigator injection), `plugin.test.ts` (mock-Alpine registration + real-Alpine reactivity), `helpers.test.ts`, and `types.test.ts`.

### Patch Changes

- Updated dependencies [7a9418a]
  - @ailuracode/alpine-core@0.2.0

## 0.1.0

### Minor Changes

- 55ae7a1: Add `@ailuracode/alpine-lang` — a reactive `$store.lang` store that detects the browser language, exposes `current` / `base` / `region` / `languages`, and supports dynamic language switching via `set()` / `reset()` / `is()` / `includes()`. Does not translate content — pair it with any i18n library via the `onChange` callback.
