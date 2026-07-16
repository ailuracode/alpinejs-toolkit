/**
 * Alpine.js integration for `@ailuracode/alpine-tooltip`.
 *
 * Thin adapter that wires {@link TooltipController} into
 * `$store.tooltip` and the `$tooltip` magic.
 */

import type { Alpine } from "alpinejs";
import { TooltipController } from "./controller.js";
import { bridgeControllerStore, syncRecordFromSnapshot } from "./core-deps.js";
import { createTooltipStoreFromController } from "./store.js";
import type { CreateTooltipOptions, TooltipAlpine, TooltipPluginCallback } from "./types.js";
import { DEFAULT_TOOLTIP_STORE_KEY } from "./types.js";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link CreateTooltipOptions} to configure the controller,
 * or `{}` for the package defaults.
 */
export function tooltipPlugin(options: CreateTooltipOptions = {}): TooltipPluginCallback {
  const storeKey = options.storeKey ?? DEFAULT_TOOLTIP_STORE_KEY;

  return function registerTooltip(alpine: Alpine): void {
    const Alpine = alpine as unknown as TooltipAlpine;
    const controller = new TooltipController(options.id);

    bridgeControllerStore({
      alpine: Alpine,
      storeKey,
      store: createTooltipStoreFromController(controller),
      controller,
      packageName: "tooltip",
      subscribe: (reactiveStore) => {
        reactiveStore.isOpen = (id: string) => reactiveStore.instances[id]?.open ?? false;
        return controller.on("change", () => {
          syncRecordFromSnapshot(reactiveStore.instances, controller.snapshotInstances());
        });
      },
    });
  };
}

/** Builds typed tooltip plugin options. */
export function tooltipOptions<const T extends CreateTooltipOptions>(options: T): T {
  return options;
}
