/**
 * Store factory for `@ailuracode/alpine-carousel`.
 */

import { syncRecordFromSnapshot } from "@ailuracode/alpine-core/bridge";
import { CarouselController } from "./controller.js";
import type { CarouselInstance, CarouselStore } from "./types.js";

function syncInstances(
  target: Record<string, CarouselInstance>,
  controller: CarouselController
): void {
  syncInstanceRegistry(target, controller.snapshotInstances());
}

/** @deprecated Import `syncRecordFromSnapshot` from `@ailuracode/alpine-core`. */
export function syncInstanceRegistry<T extends Record<string, CarouselInstance>>(
  target: Record<string, CarouselInstance>,
  snapshot: T
): void {
  syncRecordFromSnapshot(target, snapshot);
}

/** Builds a {@link CarouselStore} backed by a new {@link CarouselController}. */
export function createCarouselStore(): CarouselStore {
  return createCarouselStoreFromController(new CarouselController());
}

/** Builds a {@link CarouselStore} that mirrors the given controller. */
export function createCarouselStoreFromController(controller: CarouselController): CarouselStore {
  const instances: Record<string, CarouselInstance> = {};
  const sync = () => {
    syncInstances(instances, controller);
  };

  const store: CarouselStore = {
    instances,
    create: (id, opts) => {
      controller.create(id, opts);
      sync();
    },
    destroy: (id) => {
      controller.destroy(id);
      sync();
    },
    bindViewport: (id, viewport) => {
      controller.bindViewport(id, viewport);
      sync();
    },
    next: (id) => {
      controller.next(id);
    },
    previous: (id) => {
      controller.previous(id);
    },
    goTo: (id, index) => {
      controller.goTo(id, index);
    },
    current: (id) => controller.current(id),
    count: (id) => controller.count(id),
    canNext: (id) => controller.canNext(id),
    canPrevious: (id) => controller.canPrevious(id),
    play: (id) => {
      controller.play(id);
      sync();
    },
    pause: (id) => {
      controller.pause(id);
      sync();
    },
    isPlaying: (id) => controller.isPlaying(id),
    handleKeydown: (id, event) => controller.handleKeydown(id, event),
    carouselProps: (id, opts) => controller.carouselProps(id, opts),
    viewportProps: (id, opts) => controller.viewportProps(id, opts),
    slideProps: (id, index) => controller.slideProps(id, index),
    indicatorProps: (id, index) => controller.indicatorProps(id, index),
    destroyAll: () => {
      controller.destroyAll();
      sync();
    },
  };

  controller.on("change", sync);
  controller.on("slideChange", sync);

  return store;
}
