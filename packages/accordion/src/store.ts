/**
 * Store factory for `@ailuracode/alpine-accordion`.
 */

import { AccordionController } from "./controller.js";
import type { AccordionGroup, AccordionStore } from "./types.js";

/** Copies controller group snapshots into a target registry. */
export function syncGroupRegistry(
  target: Record<string, AccordionGroup>,
  snapshot: Record<string, AccordionGroup>
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

/** Builds an {@link AccordionStore} backed by a new {@link AccordionController}. */
export function createAccordionStore(): AccordionStore {
  return createAccordionStoreFromController(new AccordionController());
}

/** Builds an {@link AccordionStore} that mirrors the given controller. */
export function createAccordionStoreFromController(
  controller: AccordionController
): AccordionStore {
  const groups: Record<string, AccordionGroup> = {};
  const sync = () => {
    syncGroupRegistry(groups, controller.snapshotGroups());
  };

  const store: AccordionStore = {
    groups,
    register: (id, opts) => {
      controller.register(id, opts);
    },
    unregister: (id) => {
      controller.unregister(id);
    },
    registerItem: (id, itemId, disabled) => {
      controller.registerItem(id, itemId, disabled);
    },
    unregisterItem: (id, itemId) => {
      controller.unregisterItem(id, itemId);
    },
    open: (id, itemId) => {
      controller.open(id, itemId);
    },
    close: (id, itemId) => {
      controller.close(id, itemId);
    },
    toggle: (id, itemId) => {
      controller.toggle(id, itemId);
    },
    isOpen: (id, itemId) => controller.isOpen(id, itemId),
    openIds: (id) => controller.openIds(id),
    activeItem: (id) => controller.activeItem(id),
    setActiveItem: (id, itemId) => {
      controller.setActiveItem(id, itemId);
    },
    handleKeydown: (id, event) => {
      controller.handleKeydown(id, event);
    },
    triggerProps: (id, itemId) => controller.triggerProps(id, itemId),
    panelProps: (id, itemId) => controller.panelProps(id, itemId),
    destroy: () => {
      controller.destroy();
    },
  };

  controller.on("change", sync);

  return store;
}
