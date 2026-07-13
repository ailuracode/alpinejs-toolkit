/**
 * Alpine.js integration for `@ailuracode/alpine-selection`.
 */

import { bridgeControllerStore, syncRecordFromSnapshot } from "@ailuracode/alpine-core";
import type { Alpine } from "alpinejs";
import { SelectionController } from "./controller.js";
import { createSelectionStoreFromController } from "./store.js";
import type { CreateSelectionOptions, SelectionAlpine, SelectionPluginCallback } from "./types.js";

const SELECTION_STORE_KEY = "selection";

/** Plugin factory — returns the `Alpine.plugin()` callback. */
export function selectionPlugin(options: CreateSelectionOptions = {}): SelectionPluginCallback {
  return function registerSelection(alpine: Alpine): void {
    const Alpine = alpine as unknown as SelectionAlpine;
    const controller = new SelectionController(options.id);

    bridgeControllerStore({
      alpine: Alpine,
      storeKey: SELECTION_STORE_KEY,
      store: createSelectionStoreFromController(controller),
      controller,
      subscribe: (reactiveStore) => {
        const sync = () => {
          syncRecordFromSnapshot(reactiveStore.instances, controller.snapshotInstances());
        };
        sync();
        return controller.on("change", sync);
      },
    });
  };
}

/** Builds typed selection plugin options. */
export function selectionOptions<const T extends CreateSelectionOptions>(options: T): T {
  return options;
}
