/**
 * Alpine.js integration for `@ailuracode/alpine-virtual`.
 */

import { bridgeControllerStore, syncRecordFromSnapshot } from "@ailuracode/alpine-core/bridge";
import type { Alpine } from "alpinejs";
import { VirtualController } from "./controller.js";
import { createVirtualStoreFromController } from "./store.js";
import type { CreateVirtualOptions, VirtualAlpine, VirtualPluginCallback } from "./types.js";
import { DEFAULT_VIRTUAL_STORE_KEY } from "./types.js";

/** Plugin factory — returns the `Alpine.plugin()` callback. */
export function virtualPlugin(options: CreateVirtualOptions = {}): VirtualPluginCallback {
  const storeKey = options.storeKey ?? DEFAULT_VIRTUAL_STORE_KEY;

  return function registerVirtual(alpine: Alpine): void {
    const Alpine = alpine as unknown as VirtualAlpine;
    const controller = new VirtualController(options.id);

    bridgeControllerStore({
      alpine: Alpine,
      storeKey,
      store: createVirtualStoreFromController(controller),
      controller,
      packageName: "virtual",
      subscribe: (reactiveStore) => {
        const sync = () => {
          syncRecordFromSnapshot(reactiveStore.instances, controller.snapshotInstances());
        };
        const unsubs = [
          controller.on("change", sync),
          controller.on("rangeChange", sync),
          controller.on("scroll", sync),
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
