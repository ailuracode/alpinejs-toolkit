/**
 * Alpine.js integration for `@ailuracode/alpine-selection`.
 */

import { bridgeControllerStore, syncRecordFromSnapshot } from "@ailuracode/alpine-core/bridge";
import type { Alpine } from "alpinejs";
import { SelectionController } from "./controller.js";
import { createSelectionStoreFromController } from "./store.js";
import type { CreateSelectionOptions, SelectionAlpine, SelectionPluginCallback } from "./types.js";
import { DEFAULT_SELECTION_STORE_KEY } from "./types.js";

/** Plugin factory — returns the `Alpine.plugin()` callback. */
export function selectionPlugin(options: CreateSelectionOptions = {}): SelectionPluginCallback {
  const storeKey = options.storeKey ?? DEFAULT_SELECTION_STORE_KEY;

  return function registerSelection(alpine: Alpine): void {
    const Alpine = alpine as unknown as SelectionAlpine;
    const controller = new SelectionController(options.id);

    bridgeControllerStore({
      alpine: Alpine,
      storeKey,
      store: createSelectionStoreFromController(controller),
      controller,
      packageName: "selection",
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
