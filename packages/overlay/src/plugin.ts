/**
 * Alpine plugin factory for `@ailuracode/alpine-overlay`.
 *
 * Wires the singleton overlay controller into `$store.overlay` and
 * `$overlay` via `bindControllerStore` from `@ailuracode/alpine-core/alpine`.
 */

import { bindControllerStore } from "@ailuracode/alpine-core/alpine";
import type AlpineType from "alpinejs";
import { createOverlayStore } from "./alpine/store.js";
import { createOverlay, OVERLAY_SINGLETON_KEY } from "./controller.js";
import type {
  OverlayChangeDetail,
  OverlayMagicFacade,
  OverlayOptions,
  OverlayStackEntry,
  OverlayStore,
} from "./types.js";

/** Cleans up an installed overlay plugin — primarily for tests. */
export const OVERLAY_PLUGIN_INSTANCE_KEY = `${OVERLAY_SINGLETON_KEY}/plugin/instance`;

interface AlpineInstall {
  store: {
    (name: string, value: OverlayStore): void;
    (name: "overlay"): OverlayStore;
  };
  magic: (name: string, factory: () => OverlayMagicFacade) => void;
  cleanup?: (callback: () => void) => void;
}

/**
 * Returns the Alpine plugin callback. Pass `options` to set the
 * portal root / base z-index / step; missing options fall back to
 * the defaults declared in `options.ts`.
 */
export function overlayPlugin(options: OverlayOptions = {}): AlpineType.PluginCallback {
  return function registerOverlay(alpine: AlpineType.Alpine): void {
    const typedAlpine = alpine as unknown as AlpineInstall;
    const controller = createOverlay(options);

    bindControllerStore({
      alpine: typedAlpine,
      storeKey: "overlay",
      store: createOverlayStore(controller),
      controller,
      sync: (reactiveStore, detail: OverlayChangeDetail) => {
        reactiveStore.stack = detail.stack as OverlayStackEntry[];
        reactiveStore.count = detail.stack.length;
        reactiveStore.root = controller.state.root;
        reactiveStore.baseZIndex = controller.state.baseZIndex;
        reactiveStore.step = controller.state.step;
      },
      magic: {
        name: "overlay",
        factory: (store) => store as unknown as OverlayMagicFacade,
      },
    });
  };
}
