/**
 * Alpine.js integration for `@ailuracode/alpine-tabs`.
 *
 * Thin adapter that wires {@link TabsController} into
 * `$store.tabs` and the `$tabs` magic.
 */

import type { Alpine } from "alpinejs";
import { TabsController } from "./controller";
import type { CreateTabsOptions, TabsAlpine, TabsPluginCallback } from "./types";

/** Key under which the tabs store is registered on `$store`. */
const TABS_STORE_KEY = "tabs";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link CreateTabsOptions} to configure the controller,
 * or `{}` for the package defaults.
 */
export function tabsPlugin(options: CreateTabsOptions = {}): TabsPluginCallback {
  return function registerTabs(alpine: Alpine): void {
    const Alpine = alpine as unknown as TabsAlpine;
    const controller = new TabsController(options.id);
    const store = { ...controller.toStore(), groups: {} };
    Alpine.store(TABS_STORE_KEY, store);
    const reactiveStore = Alpine.store(TABS_STORE_KEY);

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
    });

    Alpine.magic(TABS_STORE_KEY, () => reactiveStore);

    if (typeof Alpine.cleanup === "function") {
      Alpine.cleanup(() => controller.destroy());
    }
  };
}

/** Builds typed tabs plugin options. */
export function tabsOptions<const T extends CreateTabsOptions>(options: T): T {
  return options;
}
