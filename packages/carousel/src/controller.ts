/**
 * Carousel controller — the framework-agnostic core of
 * `@ailuracode/alpine-carousel`. Manages a registry of carousel
 * instances powered by Embla Carousel, with autoplay, resize
 * observation, and visibility handling.
 *
 * Emits a typed `slideChange` event on every slide transition so
 * consumers can react programmatically.
 */

import { BaseController, generateId } from "@ailuracode/alpine-core";
import EmblaCarousel, { type EmblaCarouselType, type EmblaOptionsType } from "embla-carousel";
import Autoplay, { type AutoplayType } from "embla-carousel-autoplay";
import type { CarouselEvents } from "./events";
import type { CarouselInstance, CarouselOptions, CarouselStore } from "./types";

function createInstance(options: CarouselOptions = {}): CarouselInstance {
  return {
    currentIndex: 0,
    totalSlides: 0,
    progress: 0,
    isFirst: true,
    isLast: false,
    isPlaying: false,
    canNext: false,
    canPrevious: false,
    slidesInView: [],
    options,
    ariaLive: options.ariaLive ?? "polite",
    viewport: null,
    embla: null,
    autoplay: null,
  };
}

function toEmblaOptions(options: CarouselOptions): EmblaOptionsType {
  return {
    loop: options.loop ?? false,
    axis: options.axis ?? "x",
    align: options.align ?? "start",
    containScroll: options.containScroll ?? "trimSnaps",
    dragFree: options.dragFree ?? false,
    duration: options.duration ?? 25,
  };
}

function createAutoplayPlugin(options: CarouselOptions): AutoplayType | null {
  if (!options.autoplay) {
    return null;
  }

  const autoplayOptions = options.autoplayOptions ?? {};
  const stopOnMouseEnter = autoplayOptions.stopOnMouseEnter ?? false;
  const stopOnInteraction = autoplayOptions.stopOnInteraction ?? !stopOnMouseEnter;

  return Autoplay({
    delay: autoplayOptions.delay ?? 4000,
    stopOnInteraction,
    stopOnMouseEnter,
    stopOnFocusIn: autoplayOptions.stopOnFocusIn ?? true,
    playOnInit: true,
  });
}

/**
 * Headless carousel controller. Manages a registry of carousel
 * instances powered by Embla Carousel.
 */
export class CarouselController extends BaseController<CarouselEvents> {
  #instances: Record<string, CarouselInstance> = {};
  #cleanups: Map<string, () => void> = new Map();

  constructor(id?: string) {
    super(id ?? generateId("carousel"));
  }

  get instances(): Readonly<Record<string, CarouselInstance>> {
    return this.#instances;
  }

  create(id: string, options: CarouselOptions = {}): void {
    if (this.isDestroyed) {
      return;
    }
    this.#getOrCreate(id, options);
  }

  /** Destroy a single carousel instance by id. */
  destroy(id: string): void;
  /** Destroy all instances and the controller itself. */
  override destroy(): void;
  destroy(id?: string): void {
    if (id !== undefined) {
      if (this.isDestroyed) {
        return;
      }
      const instance = this.#instances[id];
      if (!instance) {
        return;
      }
      this.#destroyEmbla(id);
      delete this.#instances[id];
    } else {
      this.destroyAll();
      super.destroy();
    }
  }

  bindViewport(id: string, viewport: HTMLElement | null): void {
    if (this.isDestroyed) {
      return;
    }
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    if (!viewport) {
      const instance = this.#instances[id];
      if (instance) {
        this.#destroyEmbla(id);
      }
      return;
    }

    this.#getOrCreate(id);
    this.#initEmbla(id, viewport);
  }

  next(id: string): void {
    this.#instances[id]?.embla?.scrollNext();
  }

  previous(id: string): void {
    this.#instances[id]?.embla?.scrollPrev();
  }

  goTo(id: string, index: number): void {
    this.#instances[id]?.embla?.scrollTo(index);
  }

  current(id: string): number {
    return this.#instances[id]?.currentIndex ?? 0;
  }

  count(id: string): number {
    return this.#instances[id]?.totalSlides ?? 0;
  }

  canNext(id: string): boolean {
    return this.#instances[id]?.canNext ?? false;
  }

  canPrevious(id: string): boolean {
    return this.#instances[id]?.canPrevious ?? false;
  }

  play(id: string): void {
    this.#instances[id]?.autoplay?.play();
    const instance = this.#instances[id];
    if (instance) {
      instance.isPlaying = instance.autoplay?.isPlaying() ?? false;
    }
  }

  pause(id: string): void {
    this.#instances[id]?.autoplay?.stop();
    const instance = this.#instances[id];
    if (instance) {
      instance.isPlaying = instance.autoplay?.isPlaying() ?? false;
    }
  }

  isPlaying(id: string): boolean {
    return this.#instances[id]?.isPlaying ?? false;
  }

  instance(id: string): EmblaCarouselType | null {
    return this.#instances[id]?.embla ?? null;
  }

  handleKeydown(id: string, event: KeyboardEvent): void {
    const instance = this.#instances[id];
    if (!instance?.embla) {
      return;
    }

    switch (event.key) {
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        this.previous(id);
        break;
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        this.next(id);
        break;
      case "Home":
        event.preventDefault();
        this.goTo(id, 0);
        break;
      case "End": {
        event.preventDefault();
        const last = this.count(id) - 1;
        if (last >= 0) {
          this.goTo(id, last);
        }
        break;
      }
      default:
        break;
    }
  }

  carouselProps(
    id: string,
    options: { label?: string } = {}
  ): Record<string, string | boolean | undefined> {
    const instance = this.#instances[id];
    return {
      role: "region",
      "aria-roledescription": "carousel",
      "aria-live": instance?.ariaLive ?? "polite",
      "aria-label": options.label,
    };
  }

  viewportProps(
    _id: string,
    options: { slideSize?: string | false } = {}
  ): Record<string, string | number | boolean | undefined> {
    const props: Record<string, string | number | boolean | undefined> = {
      tabindex: 0,
    };

    if (options.slideSize !== false) {
      props.style = `--slide-size: ${options.slideSize ?? "100%"}`;
    }

    return props;
  }

  slideProps(id: string, index: number): Record<string, string | boolean | undefined> {
    const current = this.current(id);
    const total = this.count(id);
    return {
      role: "group",
      "aria-roledescription": "slide",
      "aria-label": `${index + 1} of ${total}`,
      "aria-hidden": current !== index ? true : undefined,
    };
  }

  indicatorProps(id: string, index: number): Record<string, string | boolean | undefined> {
    const selected = this.current(id) === index;
    return {
      type: "button",
      "aria-label": `Go to slide ${index + 1}`,
      "aria-current": selected ? "true" : undefined,
    };
  }

  destroyAll(): void {
    for (const id of Object.keys(this.#instances)) {
      this.destroy(id);
    }
  }

  /**
   * Returns a store-shaped object for Alpine's `$store.carousel`.
   * The store delegates to this controller.
   */
  toStore(): CarouselStore {
    return {
      instances: this.#instances as Record<string, CarouselInstance>,
      create: (id, opts) => this.create(id, opts),
      destroy: (id) => this.destroy(id),
      bindViewport: (id, viewport) => this.bindViewport(id, viewport),
      next: (id) => this.next(id),
      previous: (id) => this.previous(id),
      goTo: (id, index) => this.goTo(id, index),
      current: (id) => this.current(id),
      count: (id) => this.count(id),
      canNext: (id) => this.canNext(id),
      canPrevious: (id) => this.canPrevious(id),
      play: (id) => this.play(id),
      pause: (id) => this.pause(id),
      isPlaying: (id) => this.isPlaying(id),
      instance: (id) => this.instance(id),
      handleKeydown: (id, event) => this.handleKeydown(id, event),
      carouselProps: (id, opts) => this.carouselProps(id, opts),
      viewportProps: (id, opts) => this.viewportProps(id, opts),
      slideProps: (id, index) => this.slideProps(id, index),
      indicatorProps: (id, index) => this.indicatorProps(id, index),
      destroyAll: () => this.destroyAll(),
    };
  }

  #getOrCreate(id: string, options?: CarouselOptions): CarouselInstance {
    if (!this.#instances[id]) {
      this.#instances[id] = createInstance(options);
    } else if (options) {
      this.#instances[id].options = { ...this.#instances[id].options, ...options };
      this.#instances[id].ariaLive = options.ariaLive ?? this.#instances[id].ariaLive;
    }
    return this.#instances[id];
  }

  #syncFromEmbla(id: string): void {
    const instance = this.#instances[id];
    const embla = instance?.embla;
    if (!(instance && embla)) {
      return;
    }

    const previousIndex = instance.currentIndex;
    instance.currentIndex = embla.selectedScrollSnap();
    instance.totalSlides = embla.scrollSnapList().length;
    instance.progress = embla.scrollProgress();
    instance.canNext = embla.canScrollNext();
    instance.canPrevious = embla.canScrollPrev();
    instance.slidesInView = embla.slidesInView();
    instance.isFirst = instance.currentIndex === 0;
    instance.isLast =
      instance.totalSlides > 0 && instance.currentIndex === instance.totalSlides - 1;
    instance.isPlaying = instance.autoplay?.isPlaying() ?? false;

    if (previousIndex !== instance.currentIndex) {
      this.emit("slideChange", {
        carouselId: id,
        index: instance.currentIndex,
        totalSlides: instance.totalSlides,
      });
      instance.options.onChange?.(instance.currentIndex);
    }
  }

  #destroyEmbla(id: string): void {
    this.#cleanups.get(id)?.();
    this.#cleanups.delete(id);
    const instance = this.#instances[id];
    instance?.embla?.destroy();
    if (instance) {
      instance.embla = null;
      instance.autoplay = null;
      instance.viewport = null;
    }
  }

  #addCleanup(id: string, cleanup: () => void): void {
    const previous = this.#cleanups.get(id);
    this.#cleanups.set(id, () => {
      previous?.();
      cleanup();
    });
  }

  #setupVisibilityAutoplay(id: string, instance: CarouselInstance): void {
    const stopWhenHidden = instance.options.autoplayOptions?.stopWhenHidden ?? true;
    if (!(instance.options.autoplay && stopWhenHidden)) {
      return;
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        instance.autoplay?.stop();
      } else {
        instance.autoplay?.play();
      }
      instance.isPlaying = instance.autoplay?.isPlaying() ?? false;
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    this.#addCleanup(id, () =>
      document.removeEventListener("visibilitychange", onVisibilityChange)
    );
  }

  #setupResizeObserver(id: string, viewport: HTMLElement): void {
    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      this.#instances[id]?.embla?.reInit();
      this.#syncFromEmbla(id);
    });
    observer.observe(viewport);
    this.#addCleanup(id, () => observer.disconnect());
  }

  #initEmbla(id: string, viewport: HTMLElement): void {
    const instance = this.#instances[id];
    if (!instance) {
      return;
    }

    this.#destroyEmbla(id);
    instance.viewport = viewport;

    const plugins = [];
    const autoplay = createAutoplayPlugin(instance.options);
    if (autoplay) {
      plugins.push(autoplay);
      instance.autoplay = autoplay;
    }

    const embla = EmblaCarousel(viewport, toEmblaOptions(instance.options), plugins);
    instance.embla = embla;

    const sync = () => this.#syncFromEmbla(id);
    embla.on("select", sync);
    embla.on("scroll", sync);
    embla.on("reInit", sync);
    embla.on("autoplay:play", sync);
    embla.on("autoplay:stop", sync);
    sync();
    this.#setupResizeObserver(id, viewport);
    this.#setupVisibilityAutoplay(id, instance);

    if (typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame(() => {
        instance.embla?.reInit();
        this.#syncFromEmbla(id);
      });
    }
  }
}

/**
 * Creates a CarouselController and returns the controller instance.
 * Convenience for non-Alpine consumers.
 */
export function createCarouselController(id?: string): CarouselController {
  return new CarouselController(id);
}

/**
 * Creates a CarouselStore (store-shaped object) directly.
 * Backward-compatible alias.
 */
export function createCarouselStore(): CarouselStore {
  return new CarouselController().toStore();
}
