/**
 * Store factory for `@ailuracode/alpine-dialog`.
 */

import { syncRecordFromSnapshot } from "@ailuracode/alpine-core/bridge";
import { DialogController } from "./controller.js";
import type { DialogInstance, DialogStore, DialogStoreConfig } from "./types.js";

function syncInstances(target: Record<string, DialogInstance>, controller: DialogController): void {
  syncInstanceRegistry(target, controller.snapshotInstances());
}

/** @deprecated Import `syncRecordFromSnapshot` from `@ailuracode/alpine-core`. */
export function syncInstanceRegistry<T extends Record<string, DialogInstance>>(
  target: Record<string, DialogInstance>,
  snapshot: T
): void {
  syncRecordFromSnapshot(target, snapshot);
}

/** Builds a {@link DialogStore} backed by a new {@link DialogController}. */
export function createDialogStore(config: DialogStoreConfig = {}): DialogStore {
  return createDialogStoreFromController(new DialogController(config));
}

/** Builds a {@link DialogStore} that mirrors the given controller. */
export function createDialogStoreFromController(controller: DialogController): DialogStore {
  const instances: Record<string, DialogInstance> = {};
  const sync = () => {
    syncInstances(instances, controller);
  };

  const store: DialogStore = {
    instances,
    register: (id, opts) => {
      controller.register(id, opts);
    },
    unregister: (id) => {
      controller.unregister(id);
    },
    open: (id, opts) => {
      controller.open(id, opts);
    },
    close: (id) => {
      controller.close(id);
    },
    toggle: (id, opts) => {
      controller.toggle(id, opts);
    },
    isOpen: (id) => controller.isOpen(id),
    bindContainer: (id, container) => {
      controller.bindContainer(id, container);
    },
    handleKeydown: (id, event) => {
      controller.handleKeydown(id, event);
    },
    handleOutsideClick: (id, event) => {
      controller.handleOutsideClick(id, event);
    },
    dialogProps: (id) => controller.dialogProps(id),
    destroy: () => {
      controller.destroy();
    },
  };

  controller.on("open", sync);
  controller.on("close", sync);
  controller.on("change", sync);

  return store;
}
