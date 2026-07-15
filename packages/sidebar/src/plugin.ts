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

import { bridgeControllerStore } from "@ailuracode/alpine-core";
import type { Alpine } from "alpinejs";
import { createSidebar, type SidebarController } from "./controller";
import type {
  CreateSidebarOptions,
  SidebarAlpine,
  SidebarPluginCallback,
  SidebarStore,
} from "./types";
import { DEFAULT_SIDEBAR_STORE_KEY } from "./types";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link CreateSidebarOptions} to configure {@link SidebarController},
 * or `{}` for the package defaults. See `AGENTS.md` for the
 * integration contract.
 *
 * v2.1.0 forward-compatibility: every option in {@link CreateSidebarOptions}
 * is forwarded as-is to `createSidebar(options)`:
 *
 * - `initial` — SSR / cookie-injection seam for the initial visibility.
 * - `storage` — explicit `SidebarStorage` adapter. Wins over
 *   `persistKey` when both are present (explicit preference is silent).
 * - `persistKey` — convenience shortcut that builds
 *   `createLocalStorageSidebarStorage({ key })` internally.
 *
 * Consumers that need `crossTab: false` MUST pass the full
 * `storage: createLocalStorageSidebarStorage({ key, crossTab: false })`
 * option — the shortcut always defaults to `crossTab: true`.
 */
export function sidebarPlugin(options: CreateSidebarOptions = {}): SidebarPluginCallback {
  const storeKey = options.storeKey ?? DEFAULT_SIDEBAR_STORE_KEY;

  return function registerSidebar(alpine: Alpine): void {
    // Narrow the base `Alpine` runtime to the toolkit's typed view.
    // The boundary cast is the only `as unknown as` in this file —
    // every subsequent call is fully typed against `SidebarAlpine`.
    const Alpine = alpine as unknown as SidebarAlpine;
    // `createSidebar()` already mounts; the controller's constructor
    // stays pure (no `window` / `document` / `matchMedia` access).
    // `createSidebar` resolves `storage` from `options.storage` or
    // `options.persistKey` (explicit `storage` wins).
    const manager = createSidebar(options);
    const store = createSidebarStore(manager);

    bridgeControllerStore({
      alpine: Alpine,
      storeKey,
      store,
      controller: manager,
      packageName: "sidebar",
      subscribe: (reactiveStore) =>
        manager.on("change", (detail) => {
          reactiveStore.visible = detail.visible;
          reactiveStore.matchesBreakpoint = detail.matchesBreakpoint;
        }),
    });
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
