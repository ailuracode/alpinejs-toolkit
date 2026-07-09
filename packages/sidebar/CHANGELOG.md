# @ailuracode/alpine-sidebar

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
