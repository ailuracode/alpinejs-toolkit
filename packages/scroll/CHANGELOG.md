# @ailuracode/alpine-scroll

## 2.0.1

### Patch Changes

- 3c8b40f: Extend the shared Alpine lifecycle bridge with `syncRecordFromSnapshot` and migrate instance-registry store adapters (`dialog`, `menu`, `tooltip`, `carousel`, `virtual`, `selection`, `overlay`) to `bridgeControllerStore` with explicit subscription teardown on cleanup.
- ade9bc7: Add package-owned Playwright E2E coverage for Alpine Toolkit packages under epic ALP-55.
- 9a44380: `@ailuracode/alpine-scroll` now exposes `storeKey` and `magicKey` on `scrollPlugin(options)` so hosts with a pre-existing `$store.scroll` collision can move the integration surface without forking the controller — `magicKey` follows `storeKey` by default, and the new `DEFAULT_SCROLL_STORE_KEY` / `DEFAULT_SCROLL_MAGIC_KEY` constants keep the rename discoverable from TypeScript. The Alpine integration also passes `packageName: "scroll"` to `bridgeControllerStore` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `scrollPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-scroll` from the `registrationGuardPending` migration list tracked by `architecture:check`.
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

## 2.0.0

### Major Changes

- 7a9418a: Align the plugin entrypoint with the factory convention shared by `@ailuracode/alpine-theme`, `@ailuracode/alpine-lang`, and `@ailuracode/alpine-sidebar`. The package now exposes `scrollPlugin(options)` as a named factory that returns the `Alpine.plugin()` callback; the headless `ScrollController` is the framework-agnostic primitive that the adapter wires into `$store.scroll` and the `$scroll` magic.

  **Breaking changes:**

  - Drop the default export and the `ScrollPlugin` class. Import the named `scrollPlugin` factory instead:
    ```diff
    - import scroll, { ScrollPlugin } from "@ailuracode/alpine-scroll";
    - Alpine.plugin(scroll({ id: "scroll" }));
    - // or
    - Alpine.plugin(ScrollPlugin.init({ id: "scroll" }));
    + import { scrollPlugin, ScrollController } from "@ailuracode/alpine-scroll";
    + Alpine.plugin(scrollPlugin({ id: "scroll" }));
    + const controller = new ScrollController({ id: "scroll" });
    + controller.mount();
    ```
  - The `$scroll` magic now returns the same reactive `ScrollStore` proxy as `$store.scroll` (mirrors `$theme` / `$sidebar` / `$lang`). The v0.x behaviour of returning the controller is gone. Use `$store.scroll.toTop()` / `$store.scroll.lock("modal")` / etc. for the public command surface. If you need the full controller API (e.g. `registerSection` / `unregisterSection` / `reset` / `lockWithHandle` / `toElement`), construct a `ScrollController` instance yourself.
  - `plugin.dispose()`, `plugin.options`, and `plugin.controller` getters are removed. The `Alpine.cleanup()` callback now owns the teardown path — firing it once unsubscribes the `change` listener and calls `controller.destroy()`. The factory closure is single-invocation; do not call it twice against the same Alpine runtime.
  - `registerScrollMagic`, `AlpinePackage`, and the `ScrollPlugin` class are no longer exported. The plugin adapter is self-contained in `src/plugin.ts`.

  **Not breaking:**

  - The `$store.scroll` surface (`.x`, `.y`, `.direction`, `.atTop`, `.atBottom`, `.progress`, `.locked`, `.lockCount`, `.activeSection`, `.visibleSections`, `.scrollIntoView(...)`, `.by(...)`, `.toTop()`, `.toBottom()`, `.lock(...)`, `.unlock(...)`, `.unlockAll()`) is unchanged.
  - `ScrollOptions` (`id`, `defaultBehavior`, `respectReducedMotion`, `reserveScrollbarGap`) is unchanged.
  - The `change` / `lock` / `section` / `scroll` / `reach` / `navigation` event names + detail shapes are unchanged.
  - The `ScrollMagicListener` type alias is preserved.

  **Internal:**

  - Removed `src/alpine/magic.ts` (helper inlined into `src/plugin.ts`). The adapter subscribes once to the controller's `change` event for reactivity bridging; the controller's `lock` and `section` events no longer carry duplicate writes into the store because the controller's `change` event already folds them in.
  - Added `ScrollAlpine` typed view + `ScrollPluginCallback` plugin-callback alias to `src/types.ts`. Mirrors `SidebarAlpine` / `LangAlpine` and pins the typed `Alpine.store("scroll")` / `Alpine.magic("scroll")` surface to `ScrollStore`.
  - Plugin subscription is created exactly once per factory invocation; `Alpine.cleanup(() => { unsubscribe(); controller.destroy(); })` is the single teardown path.

- 7a9418a: # `@ailuracode/alpine-scroll` v1.0.0 — Headless controller + plugin adapter

  The v0.x scroll plugin shipped a singleton + factory + four directives. v1.0.0
  collapses every public surface onto one headless `ScrollController` and a
  `ScrollPlugin` adapter class. The store / magic / observer / lock-manager
  bundle is gone; `$scroll` returns the controller only.

  ## BREAKING CHANGES

  1. **`$scroll` magic returns `ScrollController` only.** No `.store` /
     `.observer` / `.lockManager` bundle. Every command flows through the
     controller (`controller.by(...)`, `controller.lockWithHandle(...)`, etc.).
  2. **Removed factory exports:** `getScroll`, `createScrollObserver`,
     `createScrollController`, `createScrollLock`. Consumers now use
     `new ScrollController(options)` directly.
  3. **Removed all `x-scroll-*` directives.** Use `$store.scroll` /
     `$scroll` (magic) / `controller` directly.
  4. **Lock event renamed** from `'lock-change'` to `'lock'`. The detail
     shape is now `ScrollLockChangeDetail` (canonical) — the old
     `ScrollLockDetail` alias is preserved for one release for soft
     migration.
  5. **Removed `onLockChange` plugin callback.** Subscribe to
     `controller.on('lock', detail => ...)` instead.

  ## What's new

  - `ScrollController.lockWithHandle(reason: string): string` returns a
    handle for ordered, ref-counted locking.
  - `ScrollController.unlock(handle: string): void` releases a single
    handle.
  - `ScrollController.scrollIntoView({ x, y })` overload (absolute
    coordinates, in addition to the existing `(Element, options?)`
    overload).
  - Section observer: `registerSection(id, options?)` /
    `unregisterSection(id)` / `activeSection` / `visibleSections`.
  - `--ailura-scrollbar-gap` compensation on lock (configurable via
    `reserveScrollbarGap: false`).
  - Reduced-motion gate honors `prefers-reduced-motion` by default.
  - Bundle exception documented in `docs/adr/0002-scroll-bundle-exception.md`.

  ## Migration

  ```diff
  -import scroll from "@ailuracode/alpine-scroll";
  -Alpine.plugin(scroll);
  -Alpine.start();
  +import { ScrollPlugin } from "@ailuracode/alpine-scroll";
  +Alpine.plugin(ScrollPlugin.init({ id: "scroll" }));
  +Alpine.start();
  ```

  ```diff
  -$store.scroll.lock({ axis: "y" });
  +$scroll.lockWithHandle("modal");
  ```

  ```diff
  -controller.on("lock-change", (detail) => {});
  +controller.on("lock", (detail) => {});
  ```

### Minor Changes

- 7a9418a: Promote the scroll controller to the same singleton pattern used by `@ailuracode/alpine-theme`, `@ailuracode/alpine-lang`, and `@ailuracode/alpine-sidebar`. The package now exports a `createScroll(options)` factory that returns the document's single `ScrollController`; `scrollPlugin()` uses it internally so multiple plugin registrations share state.

  **New API:**

  - `createScroll(options?: ScrollOptions): ScrollController` — singleton getter. Repeated calls return the same controller for the current document. The first call's `options` win on subsequent calls (the singleton is built once). `controller.destroy()` releases the slot so the next call builds a fresh controller.
  - `SCROLL_SINGLETON_KEY: "@ailuracode/alpine-scroll/default"` — stable registry key, exported for advanced consumers / tests that want to target the slot directly.

  **Behaviour:**

  - `scrollPlugin(options)` calls `createScroll(options)` internally. The plugin and the headless factory now resolve to the same controller, so `$store.scroll.lock("modal")` (via the plugin's store) and `createScroll().isLocked` (via the factory) observe the same lock state.
  - Singleton is enforced per `document` — tests that need a fresh controller per case call `clearAllSingletons()` (or `clearSingleton(SCROLL_SINGLETON_KEY)`) between cases.
  - `controller.destroy()` clears the singleton slot so the next `createScroll()` call builds a brand-new controller. Same shape as `createSidebar()` / `createTheme()` / `createLang()`.

  **Not breaking:**

  - `ScrollController` class is still exported so tests and advanced consumers can construct directly with `new ScrollController(options)`.
  - `scrollPlugin()` API is unchanged — same `(options) => PluginCallback` factory.
  - `$store.scroll` / `$scroll` magic surface unchanged.

  **Migration from v1.0.0:**

  ```diff
   // Standalone (no Alpine)
  -import { ScrollController } from "@ailuracode/alpine-scroll";
  -const controller = new ScrollController({ id: "scroll" });
  +import { createScroll } from "@ailuracode/alpine-scroll";
  +const controller = createScroll({ id: "scroll" });
   controller.mount();   // optional — createScroll() mounts automatically

   // Alpine
   import { scrollPlugin } from "@ailuracode/alpine-scroll";
   Alpine.plugin(scrollPlugin({ id: "scroll" }));  // unchanged

   // Access the singleton from anywhere in the app
  -import { ScrollController } from "@ailuracode/alpine-scroll";
  -Alpine.plugin(scrollPlugin({ id: "scroll" }));
  -const controller = new ScrollController();  // ← second instance, separate state!
  +import { createScroll } from "@ailuracode/alpine-scroll";
  +Alpine.plugin(scrollPlugin({ id: "scroll" }));
  +const controller = createScroll();          // ← same instance as the plugin owns
  ```

- 7a9418a: Add the `target` option to `ScrollOptions` so the lock manager applies the scrollbar-gap compensation directly to a configurable element instead of relying on consumers to wire the `--ailura-scrollbar-gap` CSS variable.

  **New API on `ScrollOptions`:**

  ```ts
  readonly target?: Element | string | null;
  ```

  - `Element` reference — the LockManager snapshots the element's `padding-right` on first lock, sets it to the measured scrollbar width on lock, and restores the original value on unlock / destroy.
  - CSS selector string — resolved once via `document.querySelector`. Same snapshot / apply / restore semantics.
  - `null` (default) — no automatic compensation. The `--ailura-scrollbar-gap` CSS variable is still set on `<html>` for consumers that wire it manually.

  **Behaviour:**

  - The compensation only fires when `reserveScrollbarGap: true` (the default).
  - Stack-safe — multiple locks share the same target; only the outermost lock manages the padding.
  - On `destroy()` the target is restored to its pre-lock `padding-right` regardless of remaining lock count.
  - Selector strings that resolve to no element degrade to a no-op (the CSS variable still applies).

  **Demo wiring** (`apps/demo/src/demo/plugin-registry.ts`):

  ```ts
  scrollPlugin({
    id: "scroll",
    respectReducedMotion: true,
    reserveScrollbarGap: true,
    target: document.body,
  });
  ```

  This fixes the layout jump when the sidebar / dialog / menu lock fires — without the target, the body's scrollbar disappears and the visible content shifts to fill the freed ~15px.

  **Not breaking:**

  - Existing `ScrollOptions` fields keep their shape and defaults.
  - `target: null` (the new default) matches the previous behaviour where only the CSS variable was set.
  - `LockManager` internal `BodyLockStylesSnapshot` grew a `paddingRight` field — purely internal.

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
  - @ailuracode/alpine-core@0.2.0

## 1.0.0

### Major Changes

- **BREAKING**: Full v1.0.0 redesign — headless `ScrollController` + `ScrollPlugin` Alpine adapter.
- **BREAKING**: `$scroll` magic returns the `ScrollController` only (no callable surface, no `.store` / `.observer` / `.lockManager` bundle).
- **BREAKING**: Removed factory exports: `getScroll`, `createScrollObserver`, `createScrollController`, `createScrollLock`.
- **BREAKING**: Removed all `x-scroll-*` directives.
- **BREAKING**: Lock changes emit `controller.on('lock', detail)` (event name renamed from `'lock-change'`).
- **BREAKING**: Removed the `onLockChange` plugin callback option.
- New `ScrollController.lockWithHandle(reason: string): string` returns a handle for ordered, ref-counted locking.
- New `ScrollController.scrollIntoView({ x, y })` overload (absolute coordinates).
- New section observer (`registerSection` / `unregisterSection` / `activeSection` / `visibleSections`).
- New navigation surface: `by(delta, reason?)`, `toTop(reason?)`, `toBottom(reason?)`, `toElement(element, options?)`.
- New `--ailura-scrollbar-gap` compensation on lock (configurable via `reserveScrollbarGap: false`).
- Reduced-motion gate honors `prefers-reduced-motion` by default.

See `docs/adr/0002-scroll-bundle-exception.md` for the bundle-size exception.

## 0.3.1

### Patch Changes

- Redesign `@ailuracode/alpine-screen` with configurable `ScreenInterval` breakpoints, `requestAnimationFrame` width updates, and typed `getDevice()` helper. Add new `@ailuracode/alpine-sidebar` store plugin. Export store types from geo, scroll, and theme. Add `zIndex` option to query devtools panel.

## 0.3.0

### Minor Changes

- 28938e3: Query devtools panel overhaul: responsive mobile layout, resizable bottom panel, follow-latest and remember-open preferences, adapter badges, readable query keys, fetch duration, JSON tree editor, and toolbar back button beside reset. Query core adds fetch timing to devtools snapshots, `resetQueries`, and typed options. New `@ailuracode/alpine-toggle` magic plugin. Store plugins and example app updated; Vitest config migrated to TypeScript.

## 0.2.0

### Minor Changes

- 65d2340: Migrate plugin source to TypeScript and publish compiled ESM from `dist/` with generated type declarations. Deep imports of `src/` paths are no longer supported; use the package root export.
