/**
 * Alpine plugin factory for `@ailuracode/alpine-overlay`.
 *
 * Wires the singleton overlay controller into `$store.overlay` and
 * `$overlay` via `bridgeControllerStore` from `@ailuracode/alpine-core`.
 */

import { bridgeControllerStore } from "@ailuracode/alpine-core/bridge";
import type AlpineType from "alpinejs";
import { createOverlayStore } from "./alpine/store.js";
import { createOverlay, OVERLAY_SINGLETON_KEY } from "./controller.js";
import type { OverlayChangeDetail, OverlayOptions, OverlayStackEntry } from "./types.js";
import { DEFAULT_OVERLAY_STORE_KEY } from "./types.js";

/** Cleans up an installed overlay plugin — primarily for tests. */
export const OVERLAY_PLUGIN_INSTANCE_KEY = `${OVERLAY_SINGLETON_KEY}/plugin/instance`;

/**
 * Returns the Alpine plugin callback. Pass `options` to set the
 * portal root / base z-index / step; missing options fall back to
 * the defaults declared in `options.ts`.
 */
export function overlayPlugin(options: OverlayOptions = {}): AlpineType.PluginCallback {
  const storeKey = options.storeKey ?? DEFAULT_OVERLAY_STORE_KEY;

  return function registerOverlay(alpine: AlpineType.Alpine): void {
    const controller = createOverlay(options);

    bridgeControllerStore({
      alpine,
      storeKey,
      store: createOverlayStore(controller),
      controller,
      packageName: "overlay",
      subscribe: (reactiveStore) =>
        controller.on("change", (detail: OverlayChangeDetail) => {
          reactiveStore.stack = detail.stack as OverlayStackEntry[];
          reactiveStore.count = detail.stack.length;
          reactiveStore.root = controller.state.root;
          reactiveStore.baseZIndex = controller.state.baseZIndex;
          reactiveStore.step = controller.state.step;
        }),
    });
  };
}
