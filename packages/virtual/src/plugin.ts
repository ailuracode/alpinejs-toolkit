/**
 * Alpine.js integration for `@ailuracode/alpine-virtual`.
 */

import { bindControllerStore, syncRecordFromSnapshot } from "@ailuracode/alpine-core/alpine";
import type { Alpine } from "alpinejs";
import { VirtualController } from "./controller.js";
import { createVirtualStoreFromController } from "./store.js";
import type { CreateVirtualOptions, VirtualAlpine, VirtualPluginCallback } from "./types.js";

const VIRTUAL_STORE_KEY = "virtual";

/** Plugin factory — returns the `Alpine.plugin()` callback. */
export function virtualPlugin(options: CreateVirtualOptions = {}): VirtualPluginCallback {
  return function registerVirtual(alpine: Alpine): void {
    const Alpine = alpine as unknown as VirtualAlpine;
    const controller = new VirtualController(options.id);

    bindControllerStore({
      alpine: Alpine,
      storeKey: VIRTUAL_STORE_KEY,
      store: createVirtualStoreFromController(controller),
      controller,
      sync: (reactiveStore) => {
        syncRecordFromSnapshot(reactiveStore.instances, controller.snapshotInstances());
      },
      subscribe: (notify) => {
        const unsubs = [
          controller.on("change", notify),
          controller.on("rangeChange", notify),
          controller.on("scroll", notify),
        ];
        return () => {
          for (const unsub of unsubs) {
            unsub();
          }
        };
      },
    });
  };
}

/** Builds typed virtual plugin options. */
export function virtualOptions<const T extends CreateVirtualOptions>(options: T): T {
  return options;
}
