/**
 * Alpine adapter for the overlay controller.
 *
 * `createOverlayStore` returns the plain-object shape that Alpine
 * installs at `$store.overlay`. The reactive state fields are
 * kept on the store itself so the plugin's `change` listener can
 * write them through Alpine's reactive proxy. Method bodies
 * delegate to the controller — there is no shadow state in this
 * module.
 *
 * The returned object is intentionally NOT frozen — Alpine wraps
 * it in a reactive proxy on installation and we want the proxy to
 * see writes that happen after `Alpine.start()` (controller emits
 * `change` events and the plugin-side listener writes the reactive
 * proxy).
 */

import type { OverlayController } from "../controller.js";
import type {
  OverlayChangeListener,
  OverlayOptions,
  OverlayStackEntry,
  OverlayStore,
} from "../types.js";

/**
 * Returns the {@link OverlayStore} that backs `$store.overlay`.
 * Method bodies delegate to the controller — there is no shadow
 * state in this module. The reactive fields (`stack`, `count`,
 * `root`, `baseZIndex`, `step`) start seeded from the controller's
 * initial state and are updated in place by the plugin's
 * `change` listener.
 */
export function createOverlayStore(controller: OverlayController): OverlayStore {
  const initial = controller.state;
  const store: OverlayStore = {
    stack: [...initial.stack] as OverlayStackEntry[],
    count: initial.count,
    root: initial.root,
    baseZIndex: initial.baseZIndex,
    step: initial.step,

    configure(options: OverlayOptions): void {
      controller.configure(options);
    },

    register(plugin: string, id: string): number {
      return controller.register(plugin, id);
    },

    unregister(plugin: string, id: string): void {
      controller.unregister(plugin, id);
    },

    zIndexOf(plugin: string, id: string): number | null {
      return controller.zIndexOf(plugin, id);
    },

    isOpen(plugin: string, id: string): boolean {
      return controller.isOpen(plugin, id);
    },

    on(event: "change", listener: OverlayChangeListener): () => void {
      return controller.on(event, listener);
    },
  };
  return store;
}
