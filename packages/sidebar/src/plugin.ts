/**
 * Alpine.js integration for `@ailuracode/alpine-sidebar`.
 *
 * Thin adapter that wires {@link SidebarController} into
 * `$store.sidebar` and the `$sidebar` magic. Every command forwards
 * to the controller (see `AGENTS.md` for the integration contract).
 *
 * Reactive proxy re-target pattern (mirrors `packages/theme/src/plugin.ts`):
 *
 * 1. `Alpine.store('sidebar', store)` registers the bare store.
 * 2. `Alpine.store('sidebar')` re-fetches the reactive proxy Alpine
 *    wraps the store in. Mutations land on this proxy, not the
 *    bare object — otherwise `x-text` bindings never re-render.
 * 3. `controller.on('change', detail => mutate proxy)` is the
 *    single subscription that bridges the headless controller to
 *    Alpine's reactivity. Caching the proxy keeps the `$sidebar`
 *    magic returning the SAME reference on every access instead
 *    of forcing Alpine to re-resolve.
 * 4. `Alpine.cleanup(() => manager.destroy())` releases the
 *    controller when the host tears down (guarded by a
 *    `typeof === 'function'` check for older Alpine versions).
 */

import type { Alpine } from "alpinejs";
import { createSidebar, type SidebarController } from "./controller";
import type {
  CreateSidebarOptions,
  SidebarAlpine,
  SidebarPluginCallback,
  SidebarStore,
} from "./types";

/** Key under which the sidebar store is registered on `$store`. */
const SIDEBAR_STORE_KEY = "sidebar";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link CreateSidebarOptions} to configure {@link SidebarController},
 * or `{}` for the package defaults. See `AGENTS.md` for the
 * integration contract.
 */
export function sidebarPlugin(options: CreateSidebarOptions = {}): SidebarPluginCallback {
  return function registerSidebar(alpine: Alpine): void {
    // Narrow the base `Alpine` runtime to the toolkit's typed view.
    // The boundary cast is the only `as unknown as` in this file —
    // every subsequent call is fully typed against `SidebarAlpine`.
    const Alpine = alpine as unknown as SidebarAlpine;
    // `createSidebar()` already mounts; the controller's constructor
    // stays pure (no `window` / `document` / `matchMedia` access).
    const manager = createSidebar(options);
    const store = createSidebarStore(manager);
    Alpine.store(SIDEBAR_STORE_KEY, store);
    // Alpine wraps the value in a reactive proxy on registration.
    // Re-target the subscription so mutations land on the proxy, not
    // on the unwrapped original — otherwise `x-text` bindings on the
    // `$sidebar` magic / `$store.sidebar` never re-render. We cache
    // the proxy so the `$sidebar` magic returns the SAME reference
    // instead of forcing Alpine to re-resolve the store on every
    // access.
    const reactiveStore = Alpine.store(SIDEBAR_STORE_KEY);
    manager.on("change", (detail) => {
      reactiveStore.visible = detail.visible;
      reactiveStore.matchesBreakpoint = detail.matchesBreakpoint;
    });
    Alpine.magic(SIDEBAR_STORE_KEY, () => reactiveStore);

    // Forward destroy() through Alpine's cleanup mechanism when
    // available. Older Alpine versions don't expose `cleanup`;
    // the integration guards every call with a
    // `typeof === "function"` check.
    if (typeof Alpine.cleanup === "function") {
      Alpine.cleanup(() => manager.destroy());
    }
  };
}

/**
 * Builds the {@link SidebarStore} Alpine exposes through
 * `$store.sidebar`. The store's reads delegate to the manager;
 * mutations go through the manager's semantic commands.
 *
 * Inline construction (no `as SidebarStore` cast, no seed/bind
 * helpers) because the four observable fields plus the three
 * commands are enough to exhaustively describe the object.
 * Splitting helpers would add indirection without buying anything.
 *
 * Standalone consumers (non-Alpine) can subscribe themselves and
 * forward updates the same way the adapter does.
 */
export function createSidebarStore(manager: SidebarController): SidebarStore {
  return {
    visible: manager.visible,
    matchesBreakpoint: manager.matchesBreakpoint,
    get isVisible() {
      return manager.isVisible;
    },
    get hasOverlay() {
      return manager.hasOverlay;
    },
    show() {
      manager.show();
    },
    hide() {
      manager.hide();
    },
    toggle() {
      manager.toggle();
    },
  };
}
