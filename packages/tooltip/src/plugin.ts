/**
 * Alpine.js integration for `@ailuracode/alpine-tooltip`.
 *
 * Thin adapter that wires {@link TooltipController} into
 * `$store.tooltip` and the `$tooltip` magic.
 */

import { bindControllerStore, syncRecordFromSnapshot } from "@ailuracode/alpine-core/alpine";
import type { Alpine } from "alpinejs";
import { TooltipController } from "./controller.js";
import { createTooltipStoreFromController } from "./store.js";
import type { CreateTooltipOptions, TooltipAlpine, TooltipPluginCallback } from "./types.js";

/** Key under which the tooltip store is registered on `$store`. */
const TOOLTIP_STORE_KEY = "tooltip";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link CreateTooltipOptions} to configure the controller,
 * or `{}` for the package defaults.
 */
export function tooltipPlugin(options: CreateTooltipOptions = {}): TooltipPluginCallback {
  return function registerTooltip(alpine: Alpine): void {
    const Alpine = alpine as unknown as TooltipAlpine;
    const controller = new TooltipController(options.id);

    bindControllerStore({
      alpine: Alpine,
      storeKey: TOOLTIP_STORE_KEY,
      store: createTooltipStoreFromController(controller),
      controller,
      sync: (reactiveStore) => {
        syncRecordFromSnapshot(reactiveStore.instances, controller.snapshotInstances());
      },
      onReactiveStore: (reactiveStore) => {
        reactiveStore.isOpen = (id: string) => reactiveStore.instances[id]?.open ?? false;
      },
    });
  };
}

/** Builds typed tooltip plugin options. */
export function tooltipOptions<const T extends CreateTooltipOptions>(options: T): T {
  return options;
}
