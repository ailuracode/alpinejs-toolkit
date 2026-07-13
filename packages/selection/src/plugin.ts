/**
 * Alpine.js integration for `@ailuracode/alpine-selection`.
 */

import { bindControllerStore, syncRecordFromSnapshot } from "@ailuracode/alpine-core/alpine";
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

    bindControllerStore({
      alpine: Alpine,
      storeKey: SELECTION_STORE_KEY,
      store: createSelectionStoreFromController(controller),
      controller,
      sync: (reactiveStore) => {
        syncRecordFromSnapshot(reactiveStore.instances, controller.snapshotInstances());
      },
      onReactiveStore: (reactiveStore) => {
        syncRecordFromSnapshot(reactiveStore.instances, controller.snapshotInstances());
      },
    });
  };
}

/** Builds typed selection plugin options. */
export function selectionOptions<const T extends CreateSelectionOptions>(options: T): T {
  return options;
}
