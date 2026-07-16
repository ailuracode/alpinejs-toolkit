/**
 * Alpine.js integration for `@ailuracode/alpine-carousel`.
 *
 * Thin adapter that wires {@link CarouselController} into
 * `$store.carousel` and the `$carousel` magic.
 */

import type { Alpine } from "alpinejs";
import { CarouselController } from "./controller.js";
import { bridgeControllerStore, syncRecordFromSnapshot } from "./core-deps.js";
import { createCarouselStoreFromController } from "./store.js";
import type { CarouselAlpine, CarouselPluginCallback, CreateCarouselOptions } from "./types.js";
import { DEFAULT_CAROUSEL_STORE_KEY } from "./types.js";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link CreateCarouselOptions} to configure the controller,
 * or `{}` for the package defaults.
 */
export function carouselPlugin(options: CreateCarouselOptions = {}): CarouselPluginCallback {
  const storeKey = options.storeKey ?? DEFAULT_CAROUSEL_STORE_KEY;

  return function registerCarousel(alpine: Alpine): void {
    const Alpine = alpine as unknown as CarouselAlpine;
    const controller = new CarouselController(options.id);

    bridgeControllerStore({
      alpine: Alpine,
      storeKey,
      store: createCarouselStoreFromController(controller),
      controller,
      packageName: "carousel",
      subscribe: (reactiveStore) => {
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

        const sync = () => {
          syncRecordFromSnapshot(reactiveStore.instances, controller.snapshotInstances());
        };
        const unsubs = [controller.on("change", sync), controller.on("slideChange", sync)];
        return () => {
          for (const unsub of unsubs) {
            unsub();
          }
        };
      },
    });
  };
}

/** Builds typed carousel plugin options. */
export function carouselOptions<const T extends CreateCarouselOptions>(options: T): T {
  return options;
}
