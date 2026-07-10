/**
 * Public type contracts for `@ailuracode/alpine-carousel`.
 *
 * Every public type lives in a `types.ts` module so consumers can import
 * them without pulling the implementation. The shape IS the contract.
 */

import type { Alpine, PluginCallback } from "@ailuracode/alpine-core";
import type { Alpine as AlpineBase } from "alpinejs";
import type { EmblaCarouselType, EmblaOptionsType } from "embla-carousel";
import type { AutoplayType } from "embla-carousel-autoplay";

/** Autoplay configuration options. */
export type CarouselAutoplayOptions = {
  delay?: number;
  stopOnInteraction?: boolean;
  stopOnMouseEnter?: boolean;
  stopOnFocusIn?: boolean;
  stopWhenHidden?: boolean;
};

/** Options passed when creating a carousel instance. */
export type CarouselOptions = {
  loop?: boolean;
  autoplay?: boolean;
  autoplayOptions?: CarouselAutoplayOptions;
  axis?: "x" | "y";
  align?: EmblaOptionsType["align"];
  containScroll?: EmblaOptionsType["containScroll"];
  dragFree?: boolean;
  duration?: number;
  ariaLive?: "off" | "polite" | "assertive";
  onChange?: (index: number) => void;
};

/** Internal representation of a carousel instance. */
export type CarouselInstance = {
  currentIndex: number;
  totalSlides: number;
  progress: number;
  isFirst: boolean;
  isLast: boolean;
  isPlaying: boolean;
  canNext: boolean;
  canPrevious: boolean;
  slidesInView: number[];
  options: CarouselOptions;
  ariaLive: "off" | "polite" | "assertive";
  viewport: HTMLElement | null;
  embla: EmblaCarouselType | null;
  autoplay: AutoplayType | null;
};

/** Alpine-facing store surface. */
export type CarouselStore = {
  instances: Record<string, CarouselInstance>;
  create(id: string, options?: CarouselOptions): void;
  destroy(id: string): void;
  bindViewport(id: string, viewport: HTMLElement | null): void;
  next(id: string): void;
  previous(id: string): void;
  goTo(id: string, index: number): void;
  current(id: string): number;
  count(id: string): number;
  canNext(id: string): boolean;
  canPrevious(id: string): boolean;
  play(id: string): void;
  pause(id: string): void;
  isPlaying(id: string): boolean;
  instance(id: string): EmblaCarouselType | null;
  handleKeydown(id: string, event: KeyboardEvent): void;
  carouselProps(
    id: string,
    options?: { label?: string }
  ): Record<string, string | boolean | undefined>;
  viewportProps(
    id: string,
    options?: { slideSize?: string | false }
  ): Record<string, string | number | boolean | undefined>;
  slideProps(id: string, index: number): Record<string, string | boolean | undefined>;
  indicatorProps(id: string, index: number): Record<string, string | boolean | undefined>;
  destroyAll(): void;
};

/** Options accepted by the carousel plugin factory. */
export interface CreateCarouselOptions {
  readonly id?: string;
}

/** Typed view of `Alpine` the carousel plugin uses internally. */
export type CarouselAlpine = Alpine<{ carousel: CarouselStore }> & {
  cleanup?(callback: () => void): void;
};

/** `Alpine.plugin()` callback signature. */
export type CarouselPluginCallback = PluginCallback<AlpineBase>;
