/**
 * Alpine adapter for the overlay controller.
 *
 * `createOverlayStore` returns the plain-object shape that Alpine
 * installs at `$store.overlay`. Every method delegates to the
 * controller — the store is intentionally a thin wrapper so there
 * is exactly one source of truth for the stack.
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
  OverlayStore,
} from "../types.js";

/**
 * Returns the {@link OverlayStore} that backs `$store.overlay`.
 * Method bodies delegate to the controller — there is no shadow
 * state in this module.
 */
export function createOverlayStore(controller: OverlayController): OverlayStore {
  return {
    get stack(): readonly import("../types.js").OverlayStackEntry[] {
      return controller.state.stack;
    },
    get count(): number {
      return controller.state.count;
    },
    get root(): HTMLElement | null {
      return controller.state.root;
    },
    get baseZIndex(): number {
      return controller.state.baseZIndex;
    },
    get step(): number {
      return controller.state.step;
    },

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
}