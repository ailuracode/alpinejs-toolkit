/**
 * Alpine.js integration for `@ailuracode/alpine-menu`.
 *
 * Thin adapter that wires {@link MenuController} into
 * `$store.menu` and the `$menu` magic.
 */

import type { Alpine } from "alpinejs";
import { MenuController } from "./controller.js";
import { createMenuStoreFromController, syncInstanceRegistry } from "./store.js";
import type { CreateMenuOptions, MenuAlpine, MenuPluginCallback } from "./types.js";

/** Key under which the menu store is registered on `$store`. */
const MENU_STORE_KEY = "menu";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link CreateMenuOptions} to configure the controller,
 * or `{}` for the package defaults.
 */
export function menuPlugin(options: CreateMenuOptions = {}): MenuPluginCallback {
  return function registerMenu(alpine: Alpine): void {
    const Alpine = alpine as unknown as MenuAlpine;

    const controller = new MenuController(
      { exclusive: options.exclusive, scroll: options.scroll },
      options.id
    );

    const store = createMenuStoreFromController(controller);
    Alpine.store(MENU_STORE_KEY, store);
    const reactiveStore = Alpine.store(MENU_STORE_KEY);

    const syncReactiveInstances = () => {
      syncInstanceRegistry(reactiveStore.instances, controller.snapshotInstances());
    };

    controller.on("change", syncReactiveInstances);

    reactiveStore.isOpen = (id: string) => reactiveStore.instances?.[id]?.open ?? false;

    Alpine.magic(MENU_STORE_KEY, () => reactiveStore);

    if (typeof Alpine.cleanup === "function") {
      Alpine.cleanup(() => controller.destroy());
    }
  };
}

/** Builds typed menu plugin options. */
export function menuOptions<const T extends CreateMenuOptions>(options: T): T {
  return options;
}
