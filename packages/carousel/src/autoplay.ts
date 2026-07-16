import type { AutoplayOptionsType, AutoplayType } from "embla-carousel-autoplay";
import type { CarouselOptions } from "./types.js";

export type { AutoplayOptionsType, AutoplayType };

export type AutoplayPluginFactory = (options?: AutoplayOptionsType) => AutoplayType;

let autoplayModulePromise: Promise<{ default: AutoplayPluginFactory }> | null = null;

/** Loads `embla-carousel-autoplay` as a separate chunk. */
export function loadAutoplayPlugin(): Promise<AutoplayPluginFactory> {
  if (!autoplayModulePromise) {
    autoplayModulePromise = import("embla-carousel-autoplay");
  }

  return autoplayModulePromise.then((module) => module.default);
}

/** Builds Embla autoplay plugin options from carousel options. */
export function resolveAutoplayOptions(options: CarouselOptions): AutoplayOptionsType | null {
  if (!options.autoplay) {
    return null;
  }

  const autoplayOptions = options.autoplayOptions ?? {};
  const stopOnMouseEnter = autoplayOptions.stopOnMouseEnter ?? false;
  const stopOnInteraction = autoplayOptions.stopOnInteraction ?? !stopOnMouseEnter;

  return {
    delay: autoplayOptions.delay ?? 4000,
    stopOnInteraction,
    stopOnMouseEnter,
    stopOnFocusIn: autoplayOptions.stopOnFocusIn ?? true,
    playOnInit: true,
  };
}

/** Creates an autoplay plugin from carousel options (loads autoplay chunk first). */
export async function createAutoplayPlugin(options: CarouselOptions): Promise<AutoplayType | null> {
  const resolved = resolveAutoplayOptions(options);
  if (!resolved) {
    return null;
  }

  const Autoplay = await loadAutoplayPlugin();
  return Autoplay(resolved);
}
