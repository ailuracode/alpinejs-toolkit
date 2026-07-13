/**
 * Alpine.js integration for `@ailuracode/alpine-carousel`.
 *
 * Thin adapter that wires {@link CarouselController} into
 * `$store.carousel` and the `$carousel` magic.
 */

import { bindControllerStore, syncRecordFromSnapshot } from "@ailuracode/alpine-core/alpine";
import type { Alpine } from "alpinejs";
import { CarouselController } from "./controller.js";
import { createCarouselStoreFromController } from "./store.js";
import type { CarouselAlpine, CarouselPluginCallback, CreateCarouselOptions } from "./types.js";

/** Key under which the carousel store is registered on `$store`. */
const CAROUSEL_STORE_KEY = "carousel";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link CreateCarouselOptions} to configure the controller,
 * or `{}` for the package defaults.
 */
export function carouselPlugin(options: CreateCarouselOptions = {}): CarouselPluginCallback {
  return function registerCarousel(alpine: Alpine): void {
    const Alpine = alpine as unknown as CarouselAlpine;
    const controller = new CarouselController(options.id);

    bindControllerStore({
      alpine: Alpine,
      storeKey: CAROUSEL_STORE_KEY,
      store: createCarouselStoreFromController(controller),
      controller,
      sync: (reactiveStore) => {
        syncRecordFromSnapshot(reactiveStore.instances, controller.snapshotInstances());
      },
      subscribe: (notify) => {
        const unsubs = [controller.on("change", notify), controller.on("slideChange", notify)];
        return () => {
          for (const unsub of unsubs) {
            unsub();
          }
        };
      },
      onReactiveStore: (reactiveStore) => {
        reactiveStore.current = (id) => reactiveStore.instances[id]?.currentIndex ?? 0;
        reactiveStore.count = (id) => reactiveStore.instances[id]?.totalSlides ?? 0;
        reactiveStore.canNext = (id) => reactiveStore.instances[id]?.canNext ?? false;
        reactiveStore.canPrevious = (id) => reactiveStore.instances[id]?.canPrevious ?? false;
        reactiveStore.isPlaying = (id) => reactiveStore.instances[id]?.isPlaying ?? false;
        reactiveStore.slideProps = (id, index) => {
          const current = reactiveStore.current(id);
          const total = reactiveStore.count(id);
          return {
            role: "group",
            "aria-roledescription": "slide",
            "aria-label": `${index + 1} of ${total}`,
            "aria-hidden": current !== index ? true : undefined,
          };
        };
        reactiveStore.indicatorProps = (id, index) => {
          const selected = reactiveStore.current(id) === index;
          return {
            type: "button",
            "aria-label": `Go to slide ${index + 1}`,
            "aria-current": selected ? "true" : undefined,
          };
        };
      },
    });
  };
}

/** Builds typed carousel plugin options. */
export function carouselOptions<const T extends CreateCarouselOptions>(options: T): T {
  return options;
}
