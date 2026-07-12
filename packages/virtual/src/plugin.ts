/**
 * Alpine.js integration for `@ailuracode/alpine-virtual`.
 */

import type { Alpine } from "alpinejs";
import { VirtualController } from "./controller.js";
import { createVirtualStoreFromController, syncInstanceRegistry } from "./store.js";
import type { CreateVirtualOptions, VirtualAlpine, VirtualPluginCallback } from "./types.js";

const VIRTUAL_STORE_KEY = "virtual";

/** Plugin factory — returns the `Alpine.plugin()` callback. */
export function virtualPlugin(options: CreateVirtualOptions = {}): VirtualPluginCallback {
  return function registerVirtual(alpine: Alpine): void {
    const Alpine = alpine as unknown as VirtualAlpine;
    const controller = new VirtualController(options.id);

    const store = createVirtualStoreFromController(controller);
    Alpine.store(VIRTUAL_STORE_KEY, store);
    const reactiveStore = Alpine.store(VIRTUAL_STORE_KEY);

    const syncReactiveInstances = () => {
      syncInstanceRegistry(reactiveStore.instances, controller.snapshotInstances());
    };

    controller.on("change", syncReactiveInstances);
    controller.on("rangeChange", syncReactiveInstances);
    controller.on("scroll", syncReactiveInstances);

    Alpine.magic(VIRTUAL_STORE_KEY, () => reactiveStore);

    if (typeof Alpine.cleanup === "function") {
      Alpine.cleanup(() => controller.destroy());
    }
  };
}

/** Builds typed virtual plugin options. */
export function virtualOptions<const T extends CreateVirtualOptions>(options: T): T {
  return options;
}
