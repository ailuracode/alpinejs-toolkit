/**
 * Store factory for `@ailuracode/alpine-virtual`.
 */

import { syncRecordFromSnapshot } from "@ailuracode/alpine-core/bridge";
import { VirtualController } from "./controller.js";
import type { VirtualInstance, VirtualStore } from "./types.js";

/** @deprecated Import `syncRecordFromSnapshot` from `@ailuracode/alpine-core`. */
export function syncInstanceRegistry(
  target: Record<string, VirtualInstance>,
  snapshot: Record<string, VirtualInstance>
): void {
  syncRecordFromSnapshot(target, snapshot);
}

function syncInstances(
  target: Record<string, VirtualInstance>,
  controller: VirtualController
): void {
  syncInstanceRegistry(target, controller.snapshotInstances());
}

/** Builds a {@link VirtualStore} backed by a new {@link VirtualController}. */
export function createVirtualStore(): VirtualStore {
  return createVirtualStoreFromController(new VirtualController());
}

/** Builds a {@link VirtualStore} that mirrors the given controller. */
export function createVirtualStoreFromController(controller: VirtualController): VirtualStore {
  const instances: Record<string, VirtualInstance> = {};
  const sync = () => {
    syncInstances(instances, controller);
  };

  const store: VirtualStore = {
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
    bindScrollElement: (id, element) => {
      controller.bindScrollElement(id, element);
      sync();
    },
    setCount: (id, count) => {
      controller.setCount(id, count);
      sync();
    },
    setKeys: (id, keys) => {
      controller.setKeys(id, keys);
      sync();
    },
    measureItem: (id, index, size) => {
      controller.measureItem(id, index, size);
      sync();
    },
    scrollToIndex: (id, index, options) => {
      controller.scrollToIndex(id, index, options);
      sync();
    },
    scrollToOffset: (id, offset, options) => {
      controller.scrollToOffset(id, offset, options);
      sync();
    },
    getVirtualItems: (id) => controller.getVirtualItems(id),
    getTotalSize: (id) => controller.getTotalSize(id),
    listProps: (id, options) => controller.listProps(id, options),
    itemProps: (id, index) => controller.itemProps(id, index),
    contentProps: (id) => controller.contentProps(id),
  };

  controller.on("change", sync);
  controller.on("rangeChange", sync);
  controller.on("scroll", sync);

  return store;
}
