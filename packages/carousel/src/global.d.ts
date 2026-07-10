/// <reference types="@types/alpinejs" />

export type CarouselAutoplayOptions = {
  delay?: number;
  stopOnInteraction?: boolean;
  stopOnMouseEnter?: boolean;
  stopOnFocusIn?: boolean;
  stopWhenHidden?: boolean;
};

export type CarouselOptions = {
  loop?: boolean;
  autoplay?: boolean;
  autoplayOptions?: CarouselAutoplayOptions;
  axis?: "x" | "y";
  align?: import("embla-carousel").EmblaOptionsType["align"];
  containScroll?: import("embla-carousel").EmblaOptionsType["containScroll"];
  dragFree?: boolean;
  duration?: number;
  ariaLive?: "off" | "polite" | "assertive";
  onChange?: (index: number) => void;
};

export interface CarouselStore {
  instances: Record<string, import("./controller.js").CarouselInstance>;
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
  instance(id: string): import("embla-carousel").EmblaCarouselType | null;
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
}

export function createCarouselStore(): CarouselStore;

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
