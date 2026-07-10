/// <reference types="@types/alpinejs" />

import type { CarouselStore } from "./types";

export { CarouselController, createCarouselController, createCarouselStore } from "./controller";
export type { CarouselEvents, CarouselSlideChangeDetail } from "./events";
export type {
  CarouselAutoplayOptions,
  CarouselInstance,
  CarouselOptions,
  CarouselStore,
  CreateCarouselOptions,
} from "./types";

export function createCarouselController(id?: string): import("./types").CarouselStore;

export default function carouselPlugin(): import("alpinejs").PluginCallback;

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
