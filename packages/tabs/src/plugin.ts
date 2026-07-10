/**
 * Alpine.js integration for `@ailuracode/alpine-tabs`.
 *
 * Thin adapter that wires {@link TabsController} into
 * `$store.tabs` and the `$tabs` magic.
 */

import type { Alpine } from "alpinejs";
import { TabsController } from "./controller";
import type { CreateTabsOptions, TabsAlpine, TabsPluginCallback, TabsStore } from "./types";

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

    const store: TabsStore = {
      groups: {} as TabsStore["groups"],
      register: (id, opts) => controller.register(id, opts),
      unregister: (id) => controller.unregister(id),
      registerTab: (id, tabId, disabled) => controller.registerTab(id, tabId, disabled),
      unregisterTab: (id, tabId) => controller.unregisterTab(id, tabId),
      select: (id, tabId) => controller.select(id, tabId),
      active: (id) => controller.active(id),
      isActive: (id, tabId) => controller.isActive(id, tabId),
      next: (id) => controller.next(id),
      previous: (id) => controller.previous(id),
      handleKeydown: (id, event) => controller.handleKeydown(id, event),
      tabProps: (id, tabId) => controller.tabProps(id, tabId),
      panelProps: (id, tabId) => controller.panelProps(id, tabId),
      tablistProps: (id) => controller.tablistProps(id),
      destroy: () => controller.destroy(),
    };

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
