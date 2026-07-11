/**
 * Public entrypoint for `@ailuracode/alpine-carousel`.
 *
 * Per public-api instructions, this file MUST only contain re-exports.
 * The framework-agnostic controller lives in `./controller.ts`, the
 * Alpine integration in `./plugin.ts`, and the supporting types in
 * `./types.ts` and `./events.ts`.
 *
 * Two ways to consume the package:
 *
 * 1. Standalone — `createCarouselController()` returns a
 *    framework-agnostic controller.
 * 2. Alpine — `carouselPlugin()` returns an `Alpine.plugin()` callback
 *    that wires the controller into `$store.carousel` and `$carousel`.
 */

// --- Re-export core types ------------------------------------------------
export type { Unsubscribe } from "@ailuracode/alpine-core";
// --- Controller (framework-agnostic) -------------------------------------
export { CarouselController, createCarouselController } from "./controller";
// --- Event surface -------------------------------------------------------
export type { CarouselChangeDetail, CarouselEvents, CarouselSlideChangeDetail } from "./events";
// --- Alpine integration --------------------------------------------------
export { carouselOptions, carouselPlugin, carouselPlugin as default } from "./plugin";
// --- Store factory -------------------------------------------------------
export { createCarouselStore, createCarouselStoreFromController } from "./store";
// --- Public types ---------------------------------------------------------
export type {
  CarouselAlpine,
  CarouselAutoplayOptions,
  CarouselInstance,
  CarouselOptions,
  CarouselPluginCallback,
  CarouselStore,
  CreateCarouselOptions,
} from "./types";
