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
import { createOverlay, OVERLAY_SINGLETON_KEY } from "./controller.js";
import { createOverlayStore } from "./alpine/store.js";
import type {
  OverlayChangeDetail,
  OverlayMagicFacade,
  OverlayOptions,
  OverlayStore,
} from "./types.js";

/** Cleans up an installed overlay plugin — primarily for tests. */
export const OVERLAY_PLUGIN_INSTANCE_KEY = `${OVERLAY_SINGLETON_KEY}/plugin/instance`;

/**
 * Mutable mirror of {@link OverlayStore} used by the plugin to
 * push controller transitions into the reactive proxy Alpine
 * installs at `$store.overlay`. The runtime treats these as
 * writable; the readonly annotations are a public-API contract
 * only.
 */
type MutableOverlayStore = { -readonly [K in keyof OverlayStore]: OverlayStore[K] };

interface AlpineAugmented {
  cleanup?(callback: () => void): void;
}

/**
 * Returns the Alpine plugin callback. Pass `options` to set the
 * portal root / base z-index / step; missing options fall back to
 * the defaults declared in `options.ts`.
 */
export function overlayPlugin(options: OverlayOptions = {}): AlpineType.PluginCallback {
  return function registerOverlay(alpine: AlpineType.Alpine): void {
    const augmented = alpine as AlpineType.Alpine & AlpineAugmented;
    const controller = createOverlay(options);
    const store = createOverlayStore(controller);

    // Install the plain-object store. Alpine wraps it in a
    // reactive proxy and returns the proxy when we re-fetch.
    (alpine as unknown as { store: (n: string, v: OverlayStore) => void }).store(
      "overlay",
      store
    );

    const reactiveStore = (alpine as unknown as {
      store: (n: "overlay") => OverlayStore;
    }).store("overlay") as unknown as MutableOverlayStore;

    const unsubscribe = controller.on("change", (detail: OverlayChangeDetail) => {
      reactiveStore.stack = detail.stack;
      reactiveStore.count = detail.stack.length;
      reactiveStore.root = controller.state.root;
      reactiveStore.baseZIndex = controller.state.baseZIndex;
      reactiveStore.step = controller.state.step;
    });

    (alpine as unknown as {
      magic: (n: string, factory: () => OverlayMagicFacade) => void;
    }).magic("overlay", () => reactiveStore as unknown as OverlayMagicFacade);

    if (typeof augmented.cleanup === "function") {
      augmented.cleanup(() => {
        unsubscribe();
        controller.destroy();
      });
    }
  };
}