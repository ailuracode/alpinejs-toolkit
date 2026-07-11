import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";

const { EmblaCarouselMock, AutoplayMock, autoplayApi } = vi.hoisted(() => {
  const autoplayApi = {
    play: vi.fn(),
    stop: vi.fn(),
    isPlaying: vi.fn(() => true),
  };

  return {
    EmblaCarouselMock: vi.fn(),
    AutoplayMock: vi.fn(() => autoplayApi),
    autoplayApi,
  };
});

vi.mock("embla-carousel", () => ({
  default: EmblaCarouselMock,
}));

vi.mock("embla-carousel-autoplay", () => ({
  default: AutoplayMock,
}));

import carouselPlugin, { createCarouselStore } from "../src/index.js";

type EmblaMockApi = {
  on: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  selectedScrollSnap: ReturnType<typeof vi.fn>;
  scrollSnapList: ReturnType<typeof vi.fn>;
  scrollProgress: ReturnType<typeof vi.fn>;
  canScrollNext: ReturnType<typeof vi.fn>;
  canScrollPrev: ReturnType<typeof vi.fn>;
  slidesInView: ReturnType<typeof vi.fn>;
  scrollNext: Mock<() => void>;
  scrollPrev: Mock<() => void>;
  scrollTo: Mock<(nextIndex: number) => void>;
  reInit: ReturnType<typeof vi.fn>;
};

function createEmblaMock(total = 3): EmblaMockApi {
  let index = 0;

  const api: EmblaMockApi = {
    on: vi.fn(),
    destroy: vi.fn(),
    selectedScrollSnap: vi.fn(() => index),
    scrollSnapList: vi.fn(() => Array.from({ length: total }, (_, i) => i)),
    scrollProgress: vi.fn(() => (total <= 1 ? 0 : index / (total - 1))),
    canScrollNext: vi.fn(() => index < total - 1),
    canScrollPrev: vi.fn(() => index > 0),
    slidesInView: vi.fn(() => [index]),
    scrollNext: vi.fn(),
    scrollPrev: vi.fn(),
    scrollTo: vi.fn(),
    reInit: vi.fn(),
  };

  const sync = () => {
    for (const [event, handler] of api.on.mock.calls) {
      if (event === "select" || event === "scroll" || event === "reInit") {
        handler();
      }
    }
  };

  const setIndex = (nextIndex: number) => {
    index = Math.max(0, Math.min(nextIndex, total - 1));
    sync();
  };

  api.scrollNext.mockImplementation(() => setIndex(index + 1));
  api.scrollPrev.mockImplementation(() => setIndex(index - 1));
  api.scrollTo.mockImplementation((nextIndex: number) => setIndex(nextIndex));

  return api;
}

describe("@ailuracode/alpine-carousel", () => {
  let store: ReturnType<typeof createCarouselStore>;
  let emblaApi: EmblaMockApi;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createCarouselStore();
    document.body.innerHTML = "";
    emblaApi = createEmblaMock(3);
    EmblaCarouselMock.mockImplementation(() => emblaApi);
    autoplayApi.isPlaying.mockReturnValue(true);
  });

  it("creates an instance with default reactive state", () => {
    store.create("gallery");

    expect(store.instances.gallery).toMatchObject({
      currentIndex: 0,
      totalSlides: 0,
      isFirst: true,
      isLast: false,
      isPlaying: false,
    });
  });

  it("initializes Embla when binding a viewport", () => {
    const viewport = document.createElement("div");
    document.body.appendChild(viewport);

    store.create("gallery");
    store.bindViewport("gallery", viewport);

    expect(EmblaCarouselMock).toHaveBeenCalledOnce();
    expect(store.count("gallery")).toBe(3);
    expect(store.current("gallery")).toBe(0);
    expect(store.instance("gallery")).toBe(emblaApi);
  });

  it("passes carousel options to Embla", () => {
    const viewport = document.createElement("div");
    store.create("gallery", {
      loop: true,
      axis: "y",
      align: "start",
      containScroll: false,
      dragFree: true,
      duration: 40,
    });
    store.bindViewport("gallery", viewport);

    expect(EmblaCarouselMock).toHaveBeenCalledWith(
      viewport,
      {
        loop: true,
        axis: "y",
        align: "start",
        containScroll: false,
        dragFree: true,
        duration: 40,
      },
      []
    );
  });

  it("navigates between slides", () => {
    const viewport = document.createElement("div");
    store.create("gallery");
    store.bindViewport("gallery", viewport);

    store.next("gallery");
    expect(store.current("gallery")).toBe(1);

    store.previous("gallery");
    expect(store.current("gallery")).toBe(0);

    store.goTo("gallery", 2);
    expect(store.current("gallery")).toBe(2);
  });

  it("supports loop navigation state from Embla", () => {
    emblaApi = createEmblaMock(3);
    EmblaCarouselMock.mockImplementation(() => emblaApi);
    emblaApi.canScrollNext.mockReturnValue(true);

    const viewport = document.createElement("div");
    store.create("gallery", { loop: true });
    store.bindViewport("gallery", viewport);

    store.goTo("gallery", 2);
    expect(store.current("gallery")).toBe(2);
    expect(store.canNext("gallery")).toBe(true);
    expect(store.instances.gallery.isLast).toBe(true);
  });

  it("syncs reactive state on slide change", () => {
    const onChange = vi.fn();
    const viewport = document.createElement("div");
    store.create("gallery", { onChange });
    store.bindViewport("gallery", viewport);

    store.next("gallery");

    expect(store.instances.gallery.currentIndex).toBe(1);
    expect(store.instances.gallery.isFirst).toBe(false);
    expect(store.instances.gallery.canPrevious).toBe(true);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("tracks multiple carousel instances independently", () => {
    const emblaA = createEmblaMock(2);
    const emblaB = createEmblaMock(5);
    EmblaCarouselMock.mockImplementationOnce(() => emblaA).mockImplementationOnce(() => emblaB);

    store.create("a");
    store.create("b");
    store.bindViewport("a", document.createElement("div"));
    store.bindViewport("b", document.createElement("div"));

    emblaA.scrollNext();
    expect(store.current("a")).toBe(1);
    expect(store.current("b")).toBe(0);
    expect(store.count("b")).toBe(5);
  });

  it("defaults stopOnInteraction to false when hover pause is enabled", () => {
    const viewport = document.createElement("div");
    store.create("gallery", {
      autoplay: true,
      autoplayOptions: { stopOnMouseEnter: true },
    });
    store.bindViewport("gallery", viewport);

    expect(AutoplayMock).toHaveBeenCalledWith({
      delay: 4000,
      stopOnMouseEnter: true,
      stopOnInteraction: false,
      stopOnFocusIn: true,
      playOnInit: true,
    });
  });

  it("registers autoplay plugin when enabled", () => {
    const viewport = document.createElement("div");
    store.create("gallery", {
      autoplay: true,
      autoplayOptions: {
        delay: 3000,
        stopOnMouseEnter: false,
        stopOnInteraction: true,
      },
    });
    store.bindViewport("gallery", viewport);

    expect(AutoplayMock).toHaveBeenCalledWith({
      delay: 3000,
      stopOnMouseEnter: false,
      stopOnInteraction: true,
      stopOnFocusIn: true,
      playOnInit: true,
    });
    expect(store.isPlaying("gallery")).toBe(true);
  });

  it("handles autoplay play and pause", () => {
    const viewport = document.createElement("div");
    store.create("gallery", { autoplay: true });
    store.bindViewport("gallery", viewport);

    store.pause("gallery");
    expect(autoplayApi.stop).toHaveBeenCalledOnce();
    autoplayApi.isPlaying.mockReturnValue(false);
    store.pause("gallery");
    expect(store.isPlaying("gallery")).toBe(false);

    store.play("gallery");
    expect(autoplayApi.play).toHaveBeenCalledOnce();
  });

  it("destroys Embla and removes the instance", () => {
    const viewport = document.createElement("div");
    store.create("gallery");
    store.bindViewport("gallery", viewport);
    store.destroy("gallery");

    expect(emblaApi.destroy).toHaveBeenCalledOnce();
    expect(store.instances.gallery).toBeUndefined();
  });

  it("cleans up all instances with destroyAll", () => {
    const emblaA = createEmblaMock(2);
    const emblaB = createEmblaMock(2);
    EmblaCarouselMock.mockImplementationOnce(() => emblaA).mockImplementationOnce(() => emblaB);

    store.create("a");
    store.create("b");
    store.bindViewport("a", document.createElement("div"));
    store.bindViewport("b", document.createElement("div"));
    store.destroyAll();

    expect(Object.keys(store.instances)).toHaveLength(0);
    expect(emblaA.destroy).toHaveBeenCalledOnce();
    expect(emblaB.destroy).toHaveBeenCalledOnce();
  });

  it("handles keyboard navigation", () => {
    const viewport = document.createElement("div");
    store.create("gallery");
    store.bindViewport("gallery", viewport);

    store.handleKeydown("gallery", new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(store.current("gallery")).toBe(1);

    store.handleKeydown("gallery", new KeyboardEvent("keydown", { key: "Home" }));
    expect(store.current("gallery")).toBe(0);

    store.handleKeydown("gallery", new KeyboardEvent("keydown", { key: "End" }));
    expect(store.current("gallery")).toBe(2);
  });

  it("exposes accessible carousel props", () => {
    store.create("gallery", { ariaLive: "off" });

    expect(store.carouselProps("gallery", { label: "Featured items" })).toMatchObject({
      role: "region",
      "aria-roledescription": "carousel",
      "aria-live": "off",
      "aria-label": "Featured items",
    });

    expect(store.viewportProps("gallery")).toMatchObject({
      tabindex: 0,
      style: "--slide-size: 100%",
    });

    expect(store.viewportProps("cards", { slideSize: false })).toEqual({
      tabindex: 0,
    });

    expect(store.viewportProps("cards", { slideSize: "85%" })).toMatchObject({
      style: "--slide-size: 85%",
    });

    store.bindViewport("gallery", document.createElement("div"));
    store.goTo("gallery", 1);

    expect(store.slideProps("gallery", 1)).toMatchObject({
      role: "group",
      "aria-roledescription": "slide",
      "aria-label": "2 of 3",
    });

    expect(store.indicatorProps("gallery", 1)).toMatchObject({
      type: "button",
      "aria-label": "Go to slide 2",
      "aria-current": "true",
    });
  });

  it("is safe to bind during SSR", () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error test SSR guard
    globalThis.window = undefined;

    store.create("gallery");
    expect(() => store.bindViewport("gallery", null)).not.toThrow();

    globalThis.window = originalWindow;
  });

  it("unbinds the viewport when passed null", () => {
    const viewport = document.createElement("div");
    store.create("gallery");
    store.bindViewport("gallery", viewport);
    store.bindViewport("gallery", null);

    expect(store.instance("gallery")).toBeNull();
    expect(emblaApi.destroy).toHaveBeenCalledOnce();
  });

  it("registers with Alpine store", () => {
    const Alpine = startAlpine(carouselPlugin());
    const carousel = Alpine.store("carousel") as ReturnType<typeof createCarouselStore>;

    carousel.create("demo");
    expect(carousel.instances.demo).toBeDefined();
    expect(carousel.instances.demo.currentIndex).toBe(0);
  });
});
