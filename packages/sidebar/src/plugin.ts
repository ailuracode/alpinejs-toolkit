/**
 * Alpine.js integration for `@ailuracode/alpine-sidebar`.
 *
 * Thin adapter that wires {@link SidebarController} into
 * `$store.sidebar` and the `$sidebar` magic. Every command forwards
 * to the controller (see `AGENTS.md` for the integration contract).
 */

import { bindControllerStore } from "@ailuracode/alpine-core/alpine";
import type { Alpine } from "alpinejs";
import { createSidebar, type SidebarController } from "./controller";
import type {
  CreateSidebarOptions,
  SidebarAlpine,
  SidebarChangeDetail,
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
  return function registerSidebar(alpine: Alpine): void {
    const Alpine = alpine as unknown as SidebarAlpine;
    const manager = createSidebar(options);

    bindControllerStore<SidebarStore, SidebarChangeDetail>({
      alpine: Alpine,
      storeKey: SIDEBAR_STORE_KEY,
      store: createSidebarStore(manager),
      controller: manager,
      sync: (reactiveStore, detail) => {
        reactiveStore.visible = detail.visible;
        reactiveStore.matchesBreakpoint = detail.matchesBreakpoint;
      },
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
