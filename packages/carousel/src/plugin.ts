import type AlpineType from "alpinejs";
import {
  type CarouselController,
  type CarouselStore,
  createCarouselController,
} from "./controller.js";

export {
  type CarouselAutoplayOptions,
  type CarouselController,
  type CarouselInstance,
  type CarouselOptions,
  type CarouselStore,
  createCarouselController,
  createCarouselStore,
} from "./controller.js";

/** Alpine.js carousel plugin. Registers `$store.carousel`. */
export default function carouselPlugin(): AlpineType.PluginCallback {
  return function registerCarousel(Alpine) {
    const controller: CarouselController = createCarouselController();
    const store: CarouselStore = controller;
    Alpine.store("carousel", store);
    Alpine.magic("carousel", () => Alpine.store("carousel"));
  };
}

declare global {
  namespace Alpine {
    interface Stores {
      carousel: CarouselStore;
    }
    interface Magics<T> {
      $carousel: CarouselStore;
    }
  }
}
