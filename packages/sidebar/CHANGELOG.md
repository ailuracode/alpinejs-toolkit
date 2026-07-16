# @ailuracode/alpine-sidebar

## 3.1.1

### Patch Changes

- baa901a: Add local development dependency metadata for peer packages so bundle analysis tools can resolve published package entries.
- Updated dependencies [baa901a]
  - @ailuracode/alpine-core@0.2.2
  - @ailuracode/alpine-scroll@2.0.2
  - @ailuracode/alpine-toggle@1.0.2

## 3.1.0

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

- 3acfd53: Fix incorrect `previous.matchesBreakpoint` snapshots on breakpoint and reset transitions.

  - Breakpoint events now report the true prior `matchesBreakpoint` value alongside `previous.visible`.
  - `reset()` emits when only breakpoint state changes and stays a no-op when neither field moves.

- 3c8b40f: Extend the shared Alpine lifecycle bridge with `syncRecordFromSnapshot` and migrate instance-registry store adapters (`dialog`, `menu`, `tooltip`, `carousel`, `virtual`, `selection`, `overlay`) to `bridgeControllerStore` with explicit subscription teardown on cleanup.
- ade9bc7: Add package-owned Playwright E2E coverage for Alpine Toolkit packages under epic ALP-55.
- 669329c: Fix scroll lock leaking when non-user transitions hide the sidebar.

  - Release the held `scroll` lock whenever visibility becomes `false`, regardless of transition source (Escape, breakpoint, `reset()`, cross-tab storage).
  - Lock acquisition remains user-driven only (`show()` / `toggle()`).
  - Repeated show/hide calls stay idempotent.

- 9a44380: `@ailuracode/alpine-sidebar` `CreateSidebarOptions` now accepts a `storeKey` so hosts with a pre-existing `$store.sidebar` collision can move the integration surface without forking the controller. The new `DEFAULT_SIDEBAR_STORE_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "sidebar"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `sidebarPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-sidebar` from the `registrationGuardPending` migration list tracked by `architecture:check`.
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
- Updated dependencies [9a44380]
- Updated dependencies [7856668]
- Updated dependencies [364ad60]
- Updated dependencies [3031b13]
  - @ailuracode/alpine-core@0.2.1
  - @ailuracode/alpine-scroll@2.0.1
  - @ailuracode/alpine-ui@1.0.1
  - @ailuracode/alpine-toggle@1.0.1

## 3.0.0

### Major Changes

- 7a9418a: Migrate to the headless controller architecture shared with `@ailuracode/alpine-theme` and `@ailuracode/alpine-lang`. The package now exposes a `SidebarController extends BaseController<SidebarEvents>` plus a headless `createSidebar(options)` factory (singleton per document); `sidebarPlugin(options)` is a thin Alpine adapter that wires the controller into `$store.sidebar` and `$sidebar`.

  **Breaking changes:**

  - Drop the default export. Import the named `sidebarPlugin` factory instead:
    ```diff
    - import sidebar from "@ailuracode/alpine-sidebar";
    - Alpine.plugin(sidebar({ onShow: lock, onHide: unlock }));
    + import { sidebarPlugin, createSidebar } from "@ailuracode/alpine-sidebar";
    + Alpine.plugin(sidebarPlugin({ breakpoint: { query: "(min-width: 1024px)", onMismatch: "hide" } }));
    + createSidebar().on("change", (detail) => {
    +   if (detail.source !== "user") return;
    +   detail.visible ? lock() : unlock();
    + });
    ```
  - Drop the registration-time `onShow` / `onHide` / `onOverlayClick` callbacks. Subscribe to the controller's typed `change` event for side effects, with multiple subscribers and runtime (un)subscription. The payload includes `visible`, `matchesBreakpoint`, `source` (`'user' | 'breakpoint' | 'escape' | 'reset' | 'initialization'`), `previous`, and an optional `event` (`KeyboardEvent | MediaQueryListEvent`, only when `source` is `'escape'` or `'breakpoint'`).
  - `breakpoint` shape changed from `string` to `{ query: string; onMismatch: 'hide' | 'keep' }`. Pick `'hide'` to preserve the v1 auto-hide behaviour; `'keep'` only updates `matchesBreakpoint`.
  - `onOverlayClick` plugin option removed (it had no runtime effect). Wire the overlay's `@click` to `$store.sidebar.hide()` in your template.

  **Not breaking:**

  - The `$store.sidebar` surface (`.visible`, `.isVisible`, `.hasOverlay`, `.matchesBreakpoint`, `.show()`, `.hide()`, `.toggle()`) is unchanged. Templates that read `$store.sidebar.*` keep working without edits.
  - `closeOnEscape` and `closeOnOverlayClick` plugin options are preserved with their v1 defaults.

  **New additions:**

  - `createSidebar(options)` returns the singleton `SidebarController` for non-Alpine consumers (custom stores, SSR adapters, tests).
  - Typed `SidebarEvents` event map + `SidebarListener` callback alias (re-exported from the package root).
  - `controller.reset()` hides + restores initial breakpoint state with `source: 'reset'`.
  - SSR-safe: the constructor is pure — no `window`, `document`, or `matchMedia` access. `safeMatchMedia` is the resolution path under all environments.

  **Internal:**

  - Split the monolithic source into `controller.ts` / `plugin.ts` / `types.ts` / `events.ts` / `internal/*`; `index.ts` is re-exports only.
  - Composes `ToggleController<true, false>` from `@ailuracode/alpine-toggle` internally for the boolean `visible` state machine (mirrors `@ailuracode/alpine-theme`'s `ToggleComposition` pattern).
  - `@ailuracode/alpine-core` and `@ailuracode/alpine-toggle` are added as both `peerDependencies` and `devDependencies`.
  - Tests split into `manager.spec.ts` (26 controller specs covering all 5 `SidebarChangeSource` values + lifecycle + leak detection), `plugin.spec.ts` (6 Alpine integration specs), and `types.test.ts` (6 compile-time `expectTypeOf` assertions).

### Minor Changes

- 7a9418a: `@ailuracode/alpine-sidebar@2.1.0` — opt-in persistence for the sidebar `visible` boolean.

  **New `SidebarStorage` interface and three built-in adapters:**

  - `createLocalStorageSidebarStorage({ key?, crossTab? })` — persist to `window.localStorage` and sync across tabs via the `storage` event.
  - `createMemorySidebarStorage(initial?)` — hermetic in-process adapter for tests and SSR.
  - `persistSidebarVisible(Alpine, options?)` + `withSidebarVisiblePersist(store, options?)` — wire the sidebar's `visible` to Alpine's `@alpinejs/persist` helper.

  **New `CreateSidebarOptions` fields:**

  - `initial?: boolean` — SSR / cookie-injection seam. Renamed from `initialVisible` (TypeScript compile error for v2.0 callers passing the old name).
  - `storage?: SidebarStorage` — explicit persistence adapter. Wins over `persistKey` when both are present (silent preference).
  - `persistKey?: string` — convenience shortcut for `createLocalStorageSidebarStorage({ key })`.

  **Cross-tab sync via the `storage` event.** Echo detection (`#lastWritten`) prevents same-tab feedback loops. `newValue: null` falls back to `initial`. Last-writer-wins per tab — documented limitation.

  **New `SidebarChangeSource` value: `'storage'`.** Additive; no existing consumer code breaks. The discriminator is now a 6-value union.

  **Persistence is opt-in.** Consumers who do not pass `storage` / `persistKey` see byte-identical behavior to v2.0.

  **Cookie-bridge pattern documented** for SSR consumers using httpOnly cookies — the package does NOT implement httpOnly cookie support itself; the README + Starlight page show a custom `SidebarStorage` adapter that proxies to `fetch('/api/sidebar', { credentials: 'include' })`.

- 7a9418a: Sidebar now manages body scroll-lock internally via the new `scroll` option. The package gains `@ailuracode/alpine-scroll` as an optional peer dependency — install it (and call `scrollPlugin(...)` before `sidebarPlugin(...)`) only when this option is used.

  **New API on `CreateSidebarOptions`:**

  - `scroll?: ScrollStore` — when provided, the controller acquires a lock on user-driven `visible: true` transitions (`show()` / `toggle()` from user input) and releases it on the matching hide. The handle returned by `scroll.lock("sidebar")` is stored internally and passed back to `scroll.unlock(handle)` on release.
  - `onVisibilityChange?: (visible: boolean, source: SidebarChangeSource) => void` — generic side-effect callback for DOM side effects (`data-sidebar` attribute, `scrollbar-gutter: stable`, focus management, A11y announcements). The plugin itself never touches the DOM. Source discriminator lets consumers filter.

  **Behaviour:**

  - Lock / unlock fire ONLY on `source: 'user'` transitions. Escape, breakpoint, reset, storage, and initialization changes do NOT touch the lock — matching the v2.0 demo wiring where only explicit user actions locked the scroll.
  - A duplicate `show()` without a matching `hide()` does NOT acquire a second lock (idempotent).
  - `hide()` without a held handle is a no-op (no throw).
  - `destroy()` releases the held handle if any so the page does not stay locked when the sidebar is torn down without an explicit hide.

  **Demo wiring** (`apps/demo/src/demo/plugin-registry.ts`):

  ```ts
  Alpine.plugin(scrollPlugin({ id: "scroll", respectReducedMotion: true }));
  Alpine.plugin(
    sidebarPlugin({
      closeOnEscape: true,
      breakpoint: { query: "(max-width: 1023px)", onMismatch: "hide" },
      scroll: Alpine.store("scroll"),
    })
  );
  ```

  Order matters — the sidebar reads `Alpine.store("scroll")` at construction time, so the scroll plugin MUST run first. The two `Alpine.plugin()` calls keep the order explicit.

  **Not breaking:**

  - All existing `CreateSidebarOptions` fields keep their shape and defaults.
  - `SidebarController` / `SidebarStore` / `SidebarManager` public surface is unchanged.
  - Consumers that did not pass `scroll` see no behaviour change.

### Patch Changes

- Updated dependencies [7a9418a]
- Updated dependencies [7a9418a]
- Updated dependencies [7a9418a]
- Updated dependencies [7a9418a]
- Updated dependencies [7a9418a]
- Updated dependencies [7a9418a]
- Updated dependencies [7a9418a]
- Updated dependencies [7a9418a]
  - @ailuracode/alpine-core@0.2.0
  - @ailuracode/alpine-scroll@2.0.0
  - @ailuracode/alpine-toggle@1.0.0

## 2.1.0

### Minor Changes

- **Opt-in persistence via `SidebarStorage`.** v2.1.0 layers a `SidebarStorage` interface on top of the v2.0 headless `SidebarController`. Three out-of-the-box adapters ship:

  ```js
  import {
    sidebarPlugin,
    createLocalStorageSidebarStorage,
    createMemorySidebarStorage,
    persistSidebarVisible,
    withSidebarVisiblePersist,
  } from "@ailuracode/alpine-sidebar";

  // Persist to localStorage and sync across tabs.
  Alpine.plugin(
    sidebarPlugin({
      storage: createLocalStorageSidebarStorage({ key: "app-sidebar" }),
    })
  );

  // ...or use the persistKey shortcut:
  Alpine.plugin(sidebarPlugin({ persistKey: "app-sidebar" }));
  ```

  `storage` and `persistKey` are both additive — consumers who do not pass them see no behavioral change.

- **New `CreateSidebarOptions` fields.** `initial?: boolean` (renamed from `initialVisible`, see Breaking), `storage?: SidebarStorage`, `persistKey?: string`. The `initial` option is the SSR / cookie-injection seam; `storage` always wins over `initial` when both are present because the persisted value reflects the user's intent.

- **Cross-tab sync via the `storage` event.** When the storage adapter exposes a `subscribe` hook (the default `localStorage` adapter does), the controller reacts to cross-tab writes with `source: 'storage'`. Echo detection (`#lastWritten`) prevents same-tab feedback loops. `newValue: null` (key cleared in another tab) falls back to the configured `initial`. Last-writer-wins per tab — documented limitation.

- **New `SidebarChangeSource` value: `'storage'`.** Additive; no existing consumer code breaks. The discriminator is now a 6-value union: `'user' | 'breakpoint' | 'escape' | 'reset' | 'initialization' | 'storage'`.

- **Persistence is opt-in.** Consumers who do not pass `storage` / `persistKey` see byte-identical behavior to v2.0.

- **Behavior note (not API break).** `initialVisible` renamed to `initial` to align with the inner `ToggleController` constructor option. Consumers passing `initialVisible` MUST rename to `initial` — TypeScript will report a compile error otherwise.

- **Behavior note.** Consumers passing `storage` for the first time will observe their first `change` event after `mount()` reflect the persisted value rather than `false`. Pass no `storage` (default behavior) to preserve v2.0 semantics.

- **Test coverage expanded.** 79 specs total (38 v2.0 preserved + 21 storage adapter + 9 `$persist` helper + 9 manager integration + 2 type assertions). Covers hydration, write-on-user-only discipline, cross-tab echo detection, `persistKey` shortcut, `storage`-over-`persistKey` precedence, and the new `SidebarChangeSource` union.

- **Cookie-bridge pattern documented.** The package does NOT implement httpOnly cookie support itself — the README + Starlight page document a custom `SidebarStorage` adapter pattern (`fetch('/api/sidebar', { credentials: 'include' })`) for SSR consumers.

## 2.0.0

### Major Changes

- **`onShow` and `onHide` plugin options removed.** Subscribe to the typed `change` event on the controller instead:

  ```js
  import { sidebarPlugin, createSidebar } from "@ailuracode/alpine-sidebar";

  Alpine.plugin(sidebarPlugin());
  createSidebar().on("change", (detail) => {
    if (detail.source !== "user") return;
    document.documentElement.toggleAttribute("data-sidebar", detail.visible);
  });
  ```

  The `change` payload is `SidebarChangeDetail`: `{ visible, matchesBreakpoint, source, previous, event? }`. `previous` is `null` only on the first emit (`source: 'initialization'`); `event` is present only when `source` is `'escape'` (`KeyboardEvent`) or `'breakpoint'` (`MediaQueryListEvent`).

- **`breakpoint` option shape changed.** The v1 `breakpoint: string` is replaced by `breakpoint: { query: string; onMismatch: 'hide' | 'keep' }`. The v1 auto-hide behaviour is preserved by `onMismatch: 'hide'`; use `'keep'` to only update `matchesBreakpoint` and react via the `change` event.

- **`onOverlayClick` option removed.** No public surface — call `$store.sidebar.hide()` from your template's `@click` handler on the overlay element.

- **Headless controller architecture.** The package is now a thin `sidebarPlugin` Alpine adapter on top of a framework-agnostic `SidebarController extends BaseController<SidebarEvents>`. The controller composes `ToggleController<true, false>` from `@ailuracode/alpine-toggle` for the boolean `visible` state machine and adds two browser side-effects (`Escape` keydown listener via `attachEscapeListener`, responsive breakpoint observer via `observeBreakpoint` wrapping `safeMatchMedia`). All listeners are wired through `BaseController.registerCleanup` so `destroy()` is idempotent and tear-down safe.

- **`SidebarChangeSource` is now a 5-value union:** `'user' | 'breakpoint' | 'escape' | 'reset' | 'initialization'`. `'initialization'` is emitted once on the microtask after `mount()`. `'escape'` fires when the sidebar is closed via the `Escape` key (gated by `closeOnEscape`, default `true`). `'breakpoint'` fires on every `matchMedia` flip with `onMismatch: 'hide'` auto-hiding and `'keep'` only flipping `matchesBreakpoint`. `'reset'` fires when `controller.reset()` is called.

- **Test coverage expanded.** 38 specs added across `manager.spec.ts` (26 controller specs), `plugin.spec.ts` (6 Alpine integration specs), and `types.test.ts` (6 compile-time `expectTypeOf` assertions) — covering every `SidebarChangeSource` value, the `$store.sidebar` reactive-proxy re-target pattern, the `Alpine.cleanup` integration, SSR safety, and listener leak detection via `addEventListener` / `removeEventListener` spies.

### Not breaking

- The `$store.sidebar` surface (`.visible`, `.isVisible`, `.hasOverlay`, `.matchesBreakpoint`, `.show()`, `.hide()`, `.toggle()`) is unchanged. Templates that read `$store.sidebar.*` continue to work without edits.
- The default export is removed but the package now exposes a named `sidebarPlugin` factory (plus `createSidebar`, `SidebarController`, `createSidebarStore`, and the type contracts from `./types`).

## 1.0.0

### Major Changes

- 819ca11: Refactor `@ailuracode/alpine-sidebar` to focus exclusively on sidebar visibility. Remove all expand/collapse logic from the plugin — visual width, mode (rail, mini, drawer, etc.) is now the consumer's responsibility.

  Breaking changes:

  - Rename `open` → `visible` and `isOpen` → `isVisible` on `$store.sidebar`.
  - Remove `collapse()`, `expand()`, `toggleCollapse()` methods.
  - Remove `collapsed` state.
  - Remove `collapsed` option.
  - Remove `onOpen`/`onClose` callbacks — renamed to `onShow`/`onHide` to match the new visibility API.
  - Remove `onCollapse`/`onExpand` callbacks.
  - Manage any "expanded" / "collapsed" visual state locally with Alpine (e.g. `x-data="{ expanded: true }"`).

## 0.1.1

### Patch Changes

- 2476868: Fix `$store.sidebar` reactivity in templates by routing `storage` and `resize` listener updates through `Alpine.store("sidebar")` instead of mutating the internal store object directly.

## 0.1.0

### Minor Changes

- Redesign `@ailuracode/alpine-screen` with configurable `ScreenInterval` breakpoints, `requestAnimationFrame` width updates, and typed `getDevice()` helper. Add new `@ailuracode/alpine-sidebar` store plugin. Export store types from geo, scroll, and theme. Add `zIndex` option to query devtools panel.
