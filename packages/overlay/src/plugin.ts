/**
 * Alpine plugin factory for `@ailuracode/alpine-overlay`.
 *
 * Mirrors the reactive wiring strategy used by `alpine-scroll`:
 * 1. Build the singleton controller via {@link createOverlay}.
 * 2. Build the plain-object store via {@link createOverlayStore}.
 * 3. Install the store with `Alpine.store('overlay', store)`.
 * 4. Re-fetch the installed store — Alpine returns a reactive
 *    proxy, which is what templates read via `$store.overlay`.
 * 5. Subscribe the controller's `change` event to a handler that
 *    writes the new stack / count / root back onto the reactive
 *    proxy. Alpine picks up the writes and re-evaluates any
 *    bindings.
 * 6. Register the `$overlay` magic so templates can write
 *    `$overlay.zIndexOf('dialog', id)` as a shorthand.
 *
 * Cleanup is wired through `controller.destroy()` on the next
 * `Alpine.cleanup` invocation (kept manual here because master
 * core does not yet expose a plugin-lifecycle helper).
 */

import type AlpineType from "alpinejs";
import { createOverlayMagic } from "./alpine/magic.js";
import { createOverlayStore } from "./alpine/store.js";
import { createOverlay, OVERLAY_SINGLETON_KEY } from "./controller.js";
import type {
  OverlayAlpine,
  OverlayChangeDetail,
  OverlayMagicFacade,
  OverlayOptions,
  OverlayStackEntry,
  OverlayStore,
} from "./types.js";

/** Cleans up an installed overlay plugin — primarily for tests. */
export const OVERLAY_PLUGIN_INSTANCE_KEY = `${OVERLAY_SINGLETON_KEY}/plugin/instance`;

interface AlpineAugmented {
  cleanup?(callback: () => void): void;
}

interface AlpineInstall {
  store: {
    (name: string, value: OverlayStore): void;
    (name: "overlay"): OverlayStore;
  };
  magic: (name: string, factory: () => OverlayMagicFacade) => void;
}

/**
 * Returns the Alpine plugin callback. Pass `options` to set the
 * portal root / base z-index / step; missing options fall back to
 * the defaults declared in `options.ts`.
 */
export function overlayPlugin(options: OverlayOptions = {}): AlpineType.PluginCallback {
  return function registerOverlay(alpine: AlpineType.Alpine): void {
    const augmented = alpine as AlpineType.Alpine & AlpineAugmented;
    const typedAlpine = alpine as unknown as AlpineInstall;
    const controller = createOverlay(options);
    const store = createOverlayStore(controller);

    // Install the plain-object store. Alpine wraps it in a
    // reactive proxy and returns the proxy when we re-fetch.
    typedAlpine.store("overlay", store);

    const reactiveStore = typedAlpine.store("overlay");

    const unsubscribe = controller.on("change", (detail: OverlayChangeDetail) => {
      // The reactive proxy permits writes through the plain
      // fields; the plugin-side listener copies the snapshot.
      reactiveStore.stack = detail.stack as OverlayStackEntry[];
      reactiveStore.count = detail.stack.length;
      reactiveStore.root = controller.state.root;
      reactiveStore.baseZIndex = controller.state.baseZIndex;
      reactiveStore.step = controller.state.step;
    });

    typedAlpine.magic("overlay", createOverlayMagic(alpine as unknown as OverlayAlpine));

    if (typeof augmented.cleanup === "function") {
      augmented.cleanup(() => {
        unsubscribe();
        controller.destroy();
      });
    }
  };
}
