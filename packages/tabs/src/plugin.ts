import type AlpineType from "alpinejs";
import { createTabsController, type TabsController, type TabsStore } from "./controller.js";

export {
  createTabsController,
  createTabsStore,
  type TabsController,
  type TabsGroupOptions,
  type TabsOrientation,
  type TabsStore,
} from "./controller.js";

/** Alpine.js tabs plugin. Registers `$store.tabs`. */
export default function tabsPlugin(): AlpineType.PluginCallback {
  return function registerTabs(Alpine) {
    const controller: TabsController = createTabsController();
    const store: TabsStore = controller;
    Alpine.store("tabs", store);
    Alpine.magic("tabs", () => Alpine.store("tabs"));
  };
}

declare global {
  namespace Alpine {
    interface Stores {
      tabs: TabsStore;
    }
    interface Magics<T> {
      $tabs: TabsStore;
    }
  }
}
