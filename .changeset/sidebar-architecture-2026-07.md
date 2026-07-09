---
"@ailuracode/alpine-sidebar": major
---

Migrate to the headless controller architecture shared with `@ailuracode/alpine-theme` and `@ailuracode/alpine-lang`. The package now exposes a `SidebarController extends BaseController<SidebarEvents>` plus a headless `createSidebar(options)` factory (singleton per document); `sidebarPlugin(options)` is a thin Alpine adapter that wires the controller into `$store.sidebar` and `$sidebar`.

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