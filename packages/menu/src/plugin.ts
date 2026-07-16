/**
 * Alpine.js integration for `@ailuracode/alpine-menu`.
 *
 * Thin adapter that wires {@link MenuController} into
 * `$store.menu` and the `$menu` magic.
 */

import { bridgeControllerStore, syncRecordFromSnapshot } from "@ailuracode/alpine-core/bridge";
import type { Alpine } from "alpinejs";
import { MenuController } from "./controller.js";
import { createMenuStoreFromController } from "./store.js";
import type { CreateMenuOptions, MenuAlpine, MenuPluginCallback } from "./types.js";
import { DEFAULT_MENU_STORE_KEY } from "./types.js";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link CreateMenuOptions} to configure the controller,
 * or `{}` for the package defaults.
 */
export function menuPlugin(options: CreateMenuOptions = {}): MenuPluginCallback {
  const storeKey = options.storeKey ?? DEFAULT_MENU_STORE_KEY;

  return function registerMenu(alpine: Alpine): void {
    const Alpine = alpine as unknown as MenuAlpine;

    const controller = new MenuController(
      { exclusive: options.exclusive, scroll: options.scroll },
      options.id
    );

    bridgeControllerStore({
      alpine: Alpine,
      storeKey,
      store: createMenuStoreFromController(controller),
      controller,
      packageName: "menu",
      subscribe: (reactiveStore) => {
        reactiveStore.isOpen = (id: string) => reactiveStore.instances?.[id]?.open ?? false;
        return controller.on("change", () => {
          syncRecordFromSnapshot(reactiveStore.instances, controller.snapshotInstances());
        });
      },
    });
  };
}

/** Builds typed menu plugin options. */
export function menuOptions<const T extends CreateMenuOptions>(options: T): T {
  return options;
}
