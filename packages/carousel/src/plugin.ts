/**
 * Alpine.js integration for `@ailuracode/alpine-carousel`.
 *
 * Thin adapter that wires {@link CarouselController} into
 * `$store.carousel` and the `$carousel` magic.
 */

import type { Alpine } from "alpinejs";
import { CarouselController } from "./controller.js";
import { createCarouselStoreFromController, syncInstanceRegistry } from "./store.js";
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

    const store = createCarouselStoreFromController(controller);
    Alpine.store(CAROUSEL_STORE_KEY, store);
    const reactiveStore = Alpine.store(CAROUSEL_STORE_KEY);

    const syncReactiveInstances = () => {
      syncInstanceRegistry(reactiveStore.instances, controller.snapshotInstances());
    };

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

    controller.on("change", syncReactiveInstances);
    controller.on("slideChange", syncReactiveInstances);

    Alpine.magic(CAROUSEL_STORE_KEY, () => reactiveStore);

    if (typeof Alpine.cleanup === "function") {
      Alpine.cleanup(() => controller.destroy());
    }
  };
}

/** Builds typed carousel plugin options. */
export function carouselOptions<const T extends CreateCarouselOptions>(options: T): T {
  return options;
}
