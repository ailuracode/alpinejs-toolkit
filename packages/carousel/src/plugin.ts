/**
 * Alpine.js integration for `@ailuracode/alpine-carousel`.
 *
 * Thin adapter that wires {@link CarouselController} into
 * `$store.carousel` and the `$carousel` magic.
 */

import type { Alpine } from "alpinejs";
import { CarouselController } from "./controller";
import type {
  CarouselAlpine,
  CarouselInstance,
  CarouselPluginCallback,
  CarouselStore,
  CreateCarouselOptions,
} from "./types";

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

    // Build a mutable store object that delegates to the controller.
    // `instances` is a plain object — Alpine's reactive proxy will detect
    // mutations to its nested properties.
    const store: CarouselStore = {
      instances: controller.instances as Record<string, CarouselInstance>,
      create: (id, opts) => controller.create(id, opts),
      destroy: (id) => controller.destroy(id),
      bindViewport: (id, viewport) => controller.bindViewport(id, viewport),
      next: (id) => controller.next(id),
      previous: (id) => controller.previous(id),
      goTo: (id, index) => controller.goTo(id, index),
      current: (id) => controller.current(id),
      count: (id) => controller.count(id),
      canNext: (id) => controller.canNext(id),
      canPrevious: (id) => controller.canPrevious(id),
      play: (id) => controller.play(id),
      pause: (id) => controller.pause(id),
      isPlaying: (id) => controller.isPlaying(id),
      instance: (id) => controller.instance(id),
      handleKeydown: (id, event) => controller.handleKeydown(id, event),
      carouselProps: (id, opts) => controller.carouselProps(id, opts),
      viewportProps: (id, opts) => controller.viewportProps(id, opts),
      slideProps: (id, index) => controller.slideProps(id, index),
      indicatorProps: (id, index) => controller.indicatorProps(id, index),
      destroyAll: () => controller.destroyAll(),
    };

    Alpine.store(CAROUSEL_STORE_KEY, store);
    const reactiveStore = Alpine.store(CAROUSEL_STORE_KEY);

    // Sync controller state into the reactive store on every slide change.
    // Alpine's reactive proxy detects mutations to the nested `instances`
    // object, so replacing its properties triggers re-renders.
    controller.on("slideChange", () => {
      const controllerInstances = controller.instances;
      for (const key of Object.keys(controllerInstances)) {
        reactiveStore.instances[key] = controllerInstances[key];
      }
      for (const key of Object.keys(reactiveStore.instances)) {
        if (!(key in controllerInstances)) {
          delete reactiveStore.instances[key];
        }
      }
    });

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
