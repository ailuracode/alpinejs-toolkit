/**
 * Public entrypoint for `@ailuracode/alpine-menu`.
 *
 * Per public-api instructions, this file MUST only contain re-exports.
 * The framework-agnostic controller lives in `./controller.ts`, the
 * Alpine integration in `./plugin.ts`, and the supporting types in
 * `./types.ts` and `./events.ts`.
 *
 * Two ways to consume the package:
 *
 * 1. Standalone — `createMenuController()` returns a
 *    framework-agnostic controller.
 * 2. Alpine — `menuPlugin()` returns an `Alpine.plugin()` callback
 *    that wires the controller into `$store.menu` and `$menu`.
 */

// --- Re-export core types ------------------------------------------------
export type { Unsubscribe } from "@ailuracode/alpine-core";
// --- Controller (framework-agnostic) -------------------------------------
export { createMenuController, MenuController } from "./controller";
// --- Event surface -------------------------------------------------------
export type {
  MenuChangeDetail,
  MenuCloseDetail,
  MenuEvents,
  MenuOpenDetail,
  MenuSelectDetail,
} from "./events";
// --- Alpine integration --------------------------------------------------
export { menuOptions, menuPlugin, menuPlugin as default } from "./plugin";
// --- Store factory -------------------------------------------------------
export { createMenuStore, createMenuStoreFromController } from "./store";
// --- Public types ---------------------------------------------------------
export type {
  CreateMenuOptions,
  MenuAlpine,
  MenuControllerConfig,
  MenuInstance,
  MenuInstanceOptions,
  MenuItemOptions,
  MenuItemState,
  MenuOrientation,
  MenuPluginCallback,
  MenuStore,
} from "./types";
// --- Public constants ----------------------------------------------------
export { DEFAULT_MENU_STORE_KEY } from "./types";
