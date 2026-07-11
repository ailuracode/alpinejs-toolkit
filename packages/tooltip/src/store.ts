/**
 * Store factory for `@ailuracode/alpine-tooltip`.
 */

import { TooltipController } from "./controller.js";
import type { TooltipInstance, TooltipStore } from "./types.js";

function syncInstances(
  target: Record<string, TooltipInstance>,
  controller: TooltipController
): void {
  syncInstanceRegistry(target, controller.snapshotInstances());
}

export function syncInstanceRegistry<T extends Record<string, TooltipInstance>>(
  target: Record<string, TooltipInstance>,
  snapshot: T
): void {
  for (const key of Object.keys(snapshot)) {
    target[key] = snapshot[key];
  }
  for (const key of Object.keys(target)) {
    if (!(key in snapshot)) {
      delete target[key];
    }
  }
}

/** Builds a {@link TooltipStore} backed by a new {@link TooltipController}. */
export function createTooltipStore(): TooltipStore {
  return createTooltipStoreFromController(new TooltipController());
}

/** Builds a {@link TooltipStore} that mirrors the given controller. */
export function createTooltipStoreFromController(controller: TooltipController): TooltipStore {
  const instances: Record<string, TooltipInstance> = {};
  const sync = () => {
    syncInstances(instances, controller);
  };

  const store: TooltipStore = {
    instances,
    register: (id, options) => {
      controller.register(id, options);
      sync();
    },
    unregister: (id) => {
      controller.unregister(id);
      sync();
    },
    open: (id) => {
      controller.open(id);
    },
    close: (id) => {
      controller.close(id);
    },
    toggle: (id) => {
      controller.toggle(id);
    },
    isOpen: (id) => controller.isOpen(id),
    showOnHover: (id) => controller.showOnHover(id),
    hideOnHover: (id) => controller.hideOnHover(id),
    showOnFocus: (id) => controller.showOnFocus(id),
    hideOnFocus: (id) => controller.hideOnFocus(id),
    handleKeydown: (id, event) => controller.handleKeydown(id, event),
    destroy: () => {
      controller.destroy();
    },
  };

  controller.on("change", sync);

  return store;
}
