/**
 * Store factory for `@ailuracode/alpine-selection`.
 */

import { SelectionController } from "./controller.js";
import type { SelectionInstance, SelectionStore } from "./types.js";

export function syncInstanceRegistry(
  target: Record<string, SelectionInstance>,
  snapshot: Record<string, SelectionInstance>
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

function syncInstances(
  target: Record<string, SelectionInstance>,
  controller: SelectionController
): void {
  syncInstanceRegistry(target, controller.snapshotInstances());
}

/** Builds a {@link SelectionStore} backed by a new {@link SelectionController}. */
export function createSelectionStore(): SelectionStore {
  return createSelectionStoreFromController(new SelectionController());
}

/** Builds a {@link SelectionStore} that mirrors the given controller. */
export function createSelectionStoreFromController(
  controller: SelectionController
): SelectionStore {
  const instances: Record<string, SelectionInstance> = {};
  const sync = () => {
    syncInstances(instances, controller);
  };

  const store: SelectionStore = {
    instances,
    create: (id, opts) => {
      controller.create(id, opts);
      sync();
    },
    destroy: (id) => {
      controller.destroy(id);
      sync();
    },
    destroyAll: () => {
      controller.destroyAll();
      sync();
    },
    setKeys: (id, keys) => {
      controller.setKeys(id, keys);
      sync();
    },
    setDisabledKeys: (id, keys) => {
      controller.setDisabledKeys(id, keys);
      sync();
    },
    setMode: (id, mode) => {
      controller.setMode(id, mode);
      sync();
    },
    setValue: (id, value) => {
      controller.setValue(id, value);
      sync();
    },
    select: (id, key, options) => {
      controller.select(id, key, options);
      sync();
    },
    replace: (id, key) => {
      controller.replace(id, key);
      sync();
    },
    toggle: (id, key) => {
      controller.toggle(id, key);
      sync();
    },
    extend: (id, key) => {
      controller.extend(id, key);
      sync();
    },
    clear: (id) => {
      controller.clear(id);
      sync();
    },
    selectAll: (id) => {
      controller.selectAll(id);
      sync();
    },
    setActive: (id, key) => {
      controller.setActive(id, key);
      sync();
    },
    setAnchor: (id, key) => {
      controller.setAnchor(id, key);
      sync();
    },
    isSelected: (id, key) => controller.isSelected(id, key),
    isSelectable: (id, key) => controller.isSelectable(id, key),
    isActive: (id, key) => controller.isActive(id, key),
    isAnchor: (id, key) => controller.isAnchor(id, key),
    getSnapshot: (id) => controller.getSnapshot(id),
    listProps: (id, options) => controller.listProps(id, options),
    itemProps: (id, key) => controller.itemProps(id, key),
  };

  controller.on("change", sync);

  return store;
}
