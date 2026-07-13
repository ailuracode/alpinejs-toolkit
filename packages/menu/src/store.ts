/**
 * Store factory for `@ailuracode/alpine-menu`.
 *
 * Builds a {@link MenuStore} that mirrors controller state through
 * readonly snapshots. The Alpine plugin uses the same factory so
 * standalone and integrated consumers share one adapter shape.
 */

import { syncRecordFromSnapshot } from "@ailuracode/alpine-core";
import { MenuController } from "./controller.js";
import type { MenuControllerConfig, MenuInstance, MenuStore } from "./types.js";

function syncInstances(target: Record<string, MenuInstance>, controller: MenuController): void {
  syncInstanceRegistry(target, controller.snapshotInstances());
}

/** @deprecated Import `syncRecordFromSnapshot` from `@ailuracode/alpine-core`. */
export function syncInstanceRegistry<T extends Record<string, MenuInstance>>(
  target: Record<string, MenuInstance>,
  snapshot: T
): void {
  syncRecordFromSnapshot(target, snapshot);
}

/**
 * Builds a {@link MenuStore} backed by a new {@link MenuController}.
 */
export function createMenuStore(config: MenuControllerConfig = {}): MenuStore {
  return createMenuStoreFromController(new MenuController(config));
}

/**
 * Builds a {@link MenuStore} that mirrors the given controller.
 * Subscribes to `change` events and copies snapshots into the
 * store's reactive `instances` record.
 */
export function createMenuStoreFromController(controller: MenuController): MenuStore {
  const instances: Record<string, MenuInstance> = {};
  const sync = () => {
    syncInstances(instances, controller);
  };

  const store: MenuStore = {
    instances,
    register: (id, opts) => {
      controller.register(id, opts);
    },
    unregister: (id) => {
      controller.unregister(id);
    },
    registerItem: (id, itemId, opts) => {
      controller.registerItem(id, itemId, opts);
    },
    unregisterItem: (id, itemId) => {
      controller.unregisterItem(id, itemId);
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
    activeItem: (id) => controller.activeItem(id),
    setActiveItem: (id, itemId) => {
      controller.setActiveItem(id, itemId);
    },
    bindMenu: (id, container) => {
      controller.bindMenu(id, container);
    },
    bindTrigger: (id, trigger) => {
      controller.bindTrigger(id, trigger);
    },
    handleOutsideClick: (id, event) => {
      controller.handleOutsideClick(id, event);
    },
    selectItem: (id, itemId) => {
      controller.selectItem(id, itemId);
    },
    handleKeydown: (id, event) => {
      controller.handleKeydown(id, event);
    },
    handleWindowOutsideClick: (event, ids) => {
      controller.handleWindowOutsideClick(event, ids);
    },
    handleWindowKeydown: (event, ids) => {
      controller.handleWindowKeydown(event, ids);
    },
    itemProps: (id, itemId) => controller.itemProps(id, itemId),
    menuProps: (id) => controller.menuProps(id),
    destroy: () => {
      controller.destroy();
    },
  };

  controller.on("change", sync);

  return store;
}
