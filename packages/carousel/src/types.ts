/**
 * Public type contracts for `@ailuracode/alpine-carousel`.
 *
 * Every public type lives in a `types.ts` module so consumers can import
 * them without pulling the implementation. The shape IS the contract.
 */

import type { Alpine, PluginCallback } from "@ailuracode/alpine-core/types";
import type { Alpine as AlpineBase } from "alpinejs";

/** Slide alignment within the viewport. */
export type CarouselAlign =
  | "start"
  | "center"
  | "end"
  | ((viewSize: number, snapSize: number, index: number) => number);

/** Scroll containment behavior at the start and end of the carousel. */
export type CarouselContainScroll = "trimSnaps" | "keepSnaps" | false;

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
  align?: CarouselAlign;
  containScroll?: CarouselContainScroll;
  dragFree?: boolean;
  duration?: number;
  ariaLive?: "off" | "polite" | "assertive";
  onChange?: (index: number) => void;
};

/** Readonly snapshot of carousel state exposed through stores and adapters. */
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
  /**
   * `$store.carousel` store key the Alpine plugin registers under.
   * Defaults to {@link DEFAULT_CAROUSEL_STORE_KEY}. Set when the
   * host already owns a `carousel` store or another toolkit plugin
   * would collide on that name — the rename avoids the collision
   * without touching the controller.
   */
  readonly storeKey?: string;
}

/** Default `$store.carousel` key registered by {@link carouselPlugin}. */
export const DEFAULT_CAROUSEL_STORE_KEY = "carousel";

/** Typed view of `Alpine` the carousel plugin uses internally. */
export type CarouselAlpine = Alpine<{ carousel: CarouselStore }> & {
  cleanup?(callback: () => void): void;
};

/** `Alpine.plugin()` callback signature. */
export type CarouselPluginCallback = PluginCallback<AlpineBase>;
