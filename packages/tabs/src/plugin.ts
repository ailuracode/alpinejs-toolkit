/**
 * Alpine.js integration for `@ailuracode/alpine-tabs`.
 *
 * Thin adapter that wires {@link TabsController} into
 * `$store.tabs` and the `$tabs` magic.
 */

import type { Alpine } from "alpinejs";
import { TabsController } from "./controller";
import { bridgeControllerStore } from "./core-deps.js";
import {
  type CreateTabsOptions,
  DEFAULT_TABS_MAGIC_KEY,
  DEFAULT_TABS_STORE_KEY,
  type TabsAlpine,
  type TabsPluginCallback,
  type TabsStore,
} from "./types";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link CreateTabsOptions} to configure the controller,
 * or `{}` for the package defaults.
 */
export function tabsPlugin(options: CreateTabsOptions = {}): TabsPluginCallback {
  // Resolve the registration keys once. The magic follows the store
  // so renames stay in sync: a single `storeKey` is enough when both
  // must move out of a collided name.
  const storeKey = options.storeKey ?? DEFAULT_TABS_STORE_KEY;
  const magicKey = options.magicKey ?? options.storeKey ?? DEFAULT_TABS_MAGIC_KEY;

  return function registerTabs(alpine: Alpine): void {
    const Alpine = alpine as unknown as TabsAlpine;
    const controller = new TabsController(options.id);
    const store = { ...controller.toStore(), groups: {} };

    bridgeControllerStore<TabsStore, TabsController>({
      alpine: Alpine,
      storeKey,
      magicKey,
      store: store as TabsStore,
      controller,
      packageName: "tabs",
      subscribe: (reactiveStore) =>
        controller.on("change", () => {
          const controllerGroups = controller.groups;
          for (const key of Object.keys(controllerGroups)) {
            reactiveStore.groups[key] = controllerGroups[key];
          }
          for (const key of Object.keys(reactiveStore.groups)) {
            if (!(key in controllerGroups)) {
              delete reactiveStore.groups[key];
            }
          }
        }),
    });
  };
}

/** Builds typed tabs plugin options. */
export function tabsOptions<const T extends CreateTabsOptions>(options: T): T {
  return options;
}
