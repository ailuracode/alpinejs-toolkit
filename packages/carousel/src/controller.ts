import EmblaCarousel, { type EmblaCarouselType, type EmblaOptionsType } from "embla-carousel";
import Autoplay, { type AutoplayType } from "embla-carousel-autoplay";

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
  align?: EmblaOptionsType["align"];
  containScroll?: EmblaOptionsType["containScroll"];
  dragFree?: boolean;
  duration?: number;
  ariaLive?: "off" | "polite" | "assertive";
  onChange?: (index: number) => void;
};

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

function syncFromEmbla(store: CarouselStore, id: string): void {
  const instance = store.instances[id];
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
  instance.isLast = instance.totalSlides > 0 && instance.currentIndex === instance.totalSlides - 1;
  instance.isPlaying = instance.autoplay?.isPlaying() ?? false;

  if (previousIndex !== instance.currentIndex) {
    instance.options.onChange?.(instance.currentIndex);
  }
}

function destroyEmbla(
  instance: CarouselInstance,
  id: string,
  cleanups: Map<string, () => void>
): void {
  cleanups.get(id)?.();
  cleanups.delete(id);
  instance.embla?.destroy();
  instance.embla = null;
  instance.autoplay = null;
  instance.viewport = null;
}

function addCleanup(id: string, cleanups: Map<string, () => void>, cleanup: () => void): void {
  const previous = cleanups.get(id);
  cleanups.set(id, () => {
    previous?.();
    cleanup();
  });
}

function setupVisibilityAutoplay(
  id: string,
  instance: CarouselInstance,
  cleanups: Map<string, () => void>
): void {
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
  addCleanup(id, cleanups, () =>
    document.removeEventListener("visibilitychange", onVisibilityChange)
  );
}

function setupResizeObserver(
  viewport: HTMLElement,
  store: CarouselStore,
  id: string,
  cleanups: Map<string, () => void>
): void {
  if (typeof ResizeObserver === "undefined") {
    return;
  }

  const observer = new ResizeObserver(() => {
    store.instances[id]?.embla?.reInit();
    syncFromEmbla(store, id);
  });
  observer.observe(viewport);
  addCleanup(id, cleanups, () => observer.disconnect());
}

function getOrCreate(
  store: CarouselStore,
  id: string,
  options?: CarouselOptions
): CarouselInstance {
  if (!store.instances[id]) {
    store.instances[id] = createInstance(options);
  } else if (options) {
    store.instances[id].options = { ...store.instances[id].options, ...options };
    store.instances[id].ariaLive = options.ariaLive ?? store.instances[id].ariaLive;
  }
  return store.instances[id];
}

function initEmbla(
  store: CarouselStore,
  id: string,
  viewport: HTMLElement,
  cleanups: Map<string, () => void>
): void {
  const instance = store.instances[id];
  if (!instance) {
    return;
  }

  destroyEmbla(instance, id, cleanups);
  instance.viewport = viewport;

  const plugins = [];
  const autoplay = createAutoplayPlugin(instance.options);
  if (autoplay) {
    plugins.push(autoplay);
    instance.autoplay = autoplay;
  }

  const embla = EmblaCarousel(viewport, toEmblaOptions(instance.options), plugins);
  instance.embla = embla;

  const sync = () => syncFromEmbla(store, id);
  embla.on("select", sync);
  embla.on("scroll", sync);
  embla.on("reInit", sync);
  embla.on("autoplay:play", sync);
  embla.on("autoplay:stop", sync);
  sync();
  setupResizeObserver(viewport, store, id, cleanups);
  setupVisibilityAutoplay(id, instance, cleanups);

  if (typeof requestAnimationFrame !== "undefined") {
    requestAnimationFrame(() => {
      instance.embla?.reInit();
      syncFromEmbla(store, id);
    });
  }
}

/** Creates the headless carousel controller powered by Embla Carousel. */
export function createCarouselStore(): CarouselStore {
  const cleanups = new Map<string, () => void>();

  const store: CarouselStore = {
    instances: {},

    create(id, options = {}) {
      getOrCreate(this, id, options);
    },

    destroy(id) {
      const instance = this.instances[id];
      if (!instance) {
        return;
      }
      destroyEmbla(instance, id, cleanups);
      delete this.instances[id];
    },

    bindViewport(id, viewport) {
      if (typeof window === "undefined" || typeof document === "undefined") {
        return;
      }

      if (!viewport) {
        const instance = this.instances[id];
        if (instance) {
          destroyEmbla(instance, id, cleanups);
        }
        return;
      }

      getOrCreate(this, id);
      initEmbla(this, id, viewport, cleanups);
    },

    next(id) {
      this.instances[id]?.embla?.scrollNext();
    },

    previous(id) {
      this.instances[id]?.embla?.scrollPrev();
    },

    goTo(id, index) {
      this.instances[id]?.embla?.scrollTo(index);
    },

    current(id) {
      return this.instances[id]?.currentIndex ?? 0;
    },

    count(id) {
      return this.instances[id]?.totalSlides ?? 0;
    },

    canNext(id) {
      return this.instances[id]?.canNext ?? false;
    },

    canPrevious(id) {
      return this.instances[id]?.canPrevious ?? false;
    },

    play(id) {
      this.instances[id]?.autoplay?.play();
      const instance = this.instances[id];
      if (instance) {
        instance.isPlaying = instance.autoplay?.isPlaying() ?? false;
      }
    },

    pause(id) {
      this.instances[id]?.autoplay?.stop();
      const instance = this.instances[id];
      if (instance) {
        instance.isPlaying = instance.autoplay?.isPlaying() ?? false;
      }
    },

    isPlaying(id) {
      return this.instances[id]?.isPlaying ?? false;
    },

    instance(id) {
      return this.instances[id]?.embla ?? null;
    },

    handleKeydown(id, event) {
      const instance = this.instances[id];
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
    },

    carouselProps(id, options = {}) {
      const instance = this.instances[id];
      return {
        role: "region",
        "aria-roledescription": "carousel",
        "aria-live": instance?.ariaLive ?? "polite",
        "aria-label": options.label,
      };
    },

    viewportProps(_id, options = {}) {
      const props: Record<string, string | number | boolean | undefined> = {
        tabindex: 0,
      };

      if (options.slideSize !== false) {
        props.style = `--slide-size: ${options.slideSize ?? "100%"}`;
      }

      return props;
    },

    slideProps(id, index) {
      const current = this.current(id);
      const total = this.count(id);
      return {
        role: "group",
        "aria-roledescription": "slide",
        "aria-label": `${index + 1} of ${total}`,
        "aria-hidden": current !== index ? true : undefined,
      };
    },

    indicatorProps(id, index) {
      const selected = this.current(id) === index;
      return {
        type: "button",
        "aria-label": `Go to slide ${index + 1}`,
        "aria-current": selected ? "true" : undefined,
      };
    },

    destroyAll() {
      for (const id of Object.keys(this.instances)) {
        this.destroy(id);
      }
    },
  };

  return store;
}

export type CarouselController = CarouselStore;

/** Alias matching the controller-based architecture naming. */
export function createCarouselController(): CarouselController {
  return createCarouselStore();
}
