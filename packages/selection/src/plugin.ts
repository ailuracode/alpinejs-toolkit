/**
 * Alpine.js integration for `@ailuracode/alpine-selection`.
 */

import type { Alpine } from "alpinejs";
import { SelectionController } from "./controller.js";
import { createSelectionStoreFromController, syncInstanceRegistry } from "./store.js";
import type { CreateSelectionOptions, SelectionAlpine, SelectionPluginCallback } from "./types.js";

const SELECTION_STORE_KEY = "selection";

/** Plugin factory — returns the `Alpine.plugin()` callback. */
export function selectionPlugin(options: CreateSelectionOptions = {}): SelectionPluginCallback {
  return function registerSelection(alpine: Alpine): void {
    const Alpine = alpine as unknown as SelectionAlpine;
    const controller = new SelectionController(options.id);

    const store = createSelectionStoreFromController(controller);
    Alpine.store(SELECTION_STORE_KEY, store);
    const reactiveStore = Alpine.store(SELECTION_STORE_KEY);

    const syncReactiveInstances = () => {
      syncInstanceRegistry(reactiveStore.instances, controller.snapshotInstances());
    };

    controller.on("change", syncReactiveInstances);
    syncReactiveInstances();

    Alpine.magic(SELECTION_STORE_KEY, () => reactiveStore);

    if (typeof Alpine.cleanup === "function") {
      Alpine.cleanup(() => controller.destroy());
    }
  };
}

/** Builds typed selection plugin options. */
export function selectionOptions<const T extends CreateSelectionOptions>(options: T): T {
  return options;
}
