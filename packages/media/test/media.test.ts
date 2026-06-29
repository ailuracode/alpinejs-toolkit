import Alpine from "alpinejs";
import { afterEach, beforeAll, describe, expect, expectTypeOf, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import { setMatchMedia } from "../../../test/setup.js";
import mediaPlugin, {
  DEFAULT_MEDIA_INTERVALS,
  type MediaInterval,
  type MediaSnapshot,
  type MediaStore,
  mediaIntervals,
  readMediaSnapshot,
  resolveMediaBreakpoint,
  SSR_MEDIA_DEFAULTS,
} from "../src/index.js";

describe("@ailuracode/alpine-media type inference", () => {
  it("exports literal default intervals", () => {
    expectTypeOf(DEFAULT_MEDIA_INTERVALS[0].name).toEqualTypeOf<"mobile">();
    expectTypeOf(DEFAULT_MEDIA_INTERVALS[1].name).toEqualTypeOf<"desktop">();
  });

  it("types mediaIntervals() with const assertion", () => {
    const intervals = mediaIntervals([
      { name: "phone", maxWidth: 480 },
      { name: "tablet", maxWidth: 768 },
      { name: "desktop", maxWidth: Number.POSITIVE_INFINITY },
    ] as const);

    expectTypeOf(intervals[0].name).toEqualTypeOf<"phone">();
    expectTypeOf(intervals[1].maxWidth).toEqualTypeOf<768>();
  });

  it("types resolveMediaBreakpoint()", () => {
    const intervals = mediaIntervals([
      { name: "mobile", maxWidth: 767 },
      { name: "desktop", maxWidth: Number.POSITIVE_INFINITY },
    ] as const);

    expectTypeOf(resolveMediaBreakpoint(500, intervals)).toEqualTypeOf<"mobile" | "desktop">();
  });

  it("types readMediaSnapshot()", () => {
    const snapshot = readMediaSnapshot();

    expectTypeOf(snapshot).toEqualTypeOf<MediaSnapshot>();
    expectTypeOf(snapshot.breakpoint).toEqualTypeOf<string>();
  });

  it("types $store.media", () => {
    setMatchMedia("(max-width: 767px)", true);

    const Alpine = startAlpine(mediaPlugin());
    const media = Alpine.store("media") as MediaStore;

    expectTypeOf(media.breakpoint).toEqualTypeOf<string>();
    expectTypeOf(media.is).parameters.toEqualTypeOf<[name: string]>();
    expectTypeOf(media.intervals).toEqualTypeOf<readonly MediaInterval[]>();
  });
});

describe("@ailuracode/alpine-media with default intervals", () => {
  let store: MediaStore;

  beforeAll(() => {
    setMatchMedia("(max-width: 767px)", true);

    const Alpine = startAlpine(mediaPlugin());
    store = Alpine.store("media") as MediaStore;
  });

  it("resolves breakpoint from width via helper", () => {
    const intervals = [
      { name: "mobile", maxWidth: 767 },
      { name: "desktop", maxWidth: Number.POSITIVE_INFINITY },
    ] as const;

    expect(resolveMediaBreakpoint(500, intervals)).toBe("mobile");
    expect(resolveMediaBreakpoint(1200, intervals)).toBe("desktop");
  });

  it("reads media snapshot from viewport", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });

    expect(readMediaSnapshot()).toEqual({
      width: 500,
      height: 800,
      breakpoint: "mobile",
    });
  });

  it("registers the media store", () => {
    expect(store).toBeDefined();
    expect(store.intervals).toHaveLength(2);
    expect(store.intervals[0].name).toBe("mobile");
    expect(store.intervals[0].maxWidth).toBe(767);
    expect(store.intervals[1].name).toBe("desktop");
    expect(store.intervals[1].maxWidth).toBe(Number.POSITIVE_INFINITY);
  });

  it("detects mobile from matchMedia", () => {
    expect(store.breakpoint).toBe("mobile");
    expect(store.is("mobile")).toBe(true);
    expect(store.is("desktop")).toBe(false);
    expect(store.isMobile).toBe(true);
    expect(store.isTablet).toBe(false);
    expect(store.isDesktop).toBe(false);
  });

  it("refreshes width and height", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1200,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 900,
    });

    store.refreshWidth();
    expect(store.width).toBe(1200);

    store.refreshHeight();
    expect(store.height).toBe(900);

    store.refresh();
    expect(store.width).toBe(1200);
    expect(store.height).toBe(900);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("updates width and height on resize after debounce", async () => {
    vi.useFakeTimers();

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 600,
    });

    window.dispatchEvent(new Event("resize"));
    await vi.advanceTimersByTimeAsync(100);

    expect(store.width).toBe(800);
    expect(store.height).toBe(600);
  });
});

describe("@ailuracode/alpine-media breakpoint transitions", () => {
  it("reacts to matchMedia changes via refresh", () => {
    setMatchMedia("(max-width: 767px)", true);

    const Alpine = startAlpine(mediaPlugin());
    const media = Alpine.store("media") as MediaStore;

    expect(media.breakpoint).toBe("mobile");

    setMatchMedia("(max-width: 767px)", false);
    media.refresh();
    expect(media.breakpoint).toBe("desktop");
  });

  it("reacts to matchMedia dispatched events", () => {
    setMatchMedia("(max-width: 767px)", true);

    const Alpine = startAlpine(mediaPlugin());
    const media = Alpine.store("media") as MediaStore;

    expect(media.breakpoint).toBe("mobile");

    setMatchMedia("(max-width: 767px)", false);
    media.refresh();
    expect(media.breakpoint).toBe("desktop");
    expect(media.isDesktop).toBe(true);
  });
});

describe("@ailuracode/alpine-media with custom intervals", () => {
  it("accepts custom interval names", () => {
    setMatchMedia("(max-width: 480px)", false);
    setMatchMedia("(max-width: 768px)", true);

    const Alpine = startAlpine(
      mediaPlugin({
        intervals: [
          { name: "phone", maxWidth: 480 },
          { name: "tablet", maxWidth: 768 },
          { name: "desktop", maxWidth: Number.POSITIVE_INFINITY },
        ],
      })
    );
    const media = Alpine.store("media") as MediaStore;

    expect(media.breakpoint).toBe("tablet");
    expect(media.is("phone")).toBe(false);
    expect(media.is("tablet")).toBe(true);
    expect(media.isTablet).toBe(true);
    expect(media.is("desktop")).toBe(false);
  });

  it("matches smallest interval first", () => {
    setMatchMedia("(max-width: 480px)", true);
    setMatchMedia("(max-width: 768px)", true);

    const Alpine = startAlpine(
      mediaPlugin({
        intervals: [
          { name: "phone", maxWidth: 480 },
          { name: "tablet", maxWidth: 768 },
          { name: "desktop", maxWidth: Number.POSITIVE_INFINITY },
        ],
      })
    );
    const media = Alpine.store("media") as MediaStore;

    expect(media.breakpoint).toBe("phone");
  });

  it("falls back to last interval when nothing matches", () => {
    setMatchMedia("(max-width: 480px)", false);
    setMatchMedia("(max-width: 768px)", false);

    const Alpine = startAlpine(
      mediaPlugin({
        intervals: [
          { name: "phone", maxWidth: 480 },
          { name: "tablet", maxWidth: 768 },
          { name: "wide", maxWidth: Number.POSITIVE_INFINITY },
        ],
      })
    );
    const media = Alpine.store("media") as MediaStore;

    expect(media.breakpoint).toBe("wide");
    expect(media.is("wide")).toBe(true);
  });

  it("works with a single interval (always matches fallback)", () => {
    setMatchMedia("(max-width: 99999px)", false);

    const Alpine = startAlpine(
      mediaPlugin({
        intervals: [{ name: "all", maxWidth: Number.POSITIVE_INFINITY }],
      })
    );
    const media = Alpine.store("media") as MediaStore;

    expect(media.breakpoint).toBe("all");
    expect(media.is("all")).toBe(true);
  });
});

describe("@ailuracode/alpine-media browser features", () => {
  it("reads prefers-reduced-motion", () => {
    setMatchMedia("(prefers-reduced-motion: reduce)", true);

    const Alpine = startAlpine(mediaPlugin());
    const media = Alpine.store("media") as MediaStore;

    expect(media.prefersReducedMotion).toBe(true);

    setMatchMedia("(prefers-reduced-motion: reduce)", false);
    media.refresh();
    expect(media.prefersReducedMotion).toBe(false);
  });

  it("reads prefers-contrast values", () => {
    setMatchMedia("(prefers-contrast: more)", true);

    const Alpine = startAlpine(mediaPlugin());
    const media = Alpine.store("media") as MediaStore;

    expect(media.prefersContrast).toBe("more");

    setMatchMedia("(prefers-contrast: more)", false);
    setMatchMedia("(prefers-contrast: less)", true);
    media.refresh();
    expect(media.prefersContrast).toBe("less");

    setMatchMedia("(prefers-contrast: less)", false);
    setMatchMedia("(prefers-contrast: custom)", true);
    media.refresh();
    expect(media.prefersContrast).toBe("custom");

    setMatchMedia("(prefers-contrast: custom)", false);
    media.refresh();
    expect(media.prefersContrast).toBe("no-preference");
  });

  it("reads prefers-color-scheme", () => {
    setMatchMedia("(prefers-color-scheme: dark)", true);

    const Alpine = startAlpine(mediaPlugin());
    const media = Alpine.store("media") as MediaStore;

    expect(media.prefersColorScheme).toBe("dark");

    setMatchMedia("(prefers-color-scheme: dark)", false);
    media.refresh();
    expect(media.prefersColorScheme).toBe("light");
  });

  it("reads hover capability", () => {
    setMatchMedia("(hover: hover)", true);

    const Alpine = startAlpine(mediaPlugin());
    const media = Alpine.store("media") as MediaStore;

    expect(media.hover).toBe("hover");

    setMatchMedia("(hover: hover)", false);
    media.refresh();
    expect(media.hover).toBe("none");
  });

  it("reads pointer capability", () => {
    setMatchMedia("(pointer: coarse)", true);

    const Alpine = startAlpine(mediaPlugin());
    const media = Alpine.store("media") as MediaStore;

    expect(media.pointer).toBe("coarse");

    setMatchMedia("(pointer: coarse)", false);
    setMatchMedia("(pointer: fine)", true);
    media.refresh();
    expect(media.pointer).toBe("fine");

    setMatchMedia("(pointer: fine)", false);
    setMatchMedia("(pointer: none)", true);
    media.refresh();
    expect(media.pointer).toBe("none");
  });

  it("reads orientation", () => {
    setMatchMedia("(orientation: portrait)", true);

    const Alpine = startAlpine(mediaPlugin());
    const media = Alpine.store("media") as MediaStore;

    expect(media.orientation).toBe("portrait");

    setMatchMedia("(orientation: portrait)", false);
    media.refresh();
    expect(media.orientation).toBe("landscape");
  });

  it("reads touch and pointer capabilities", () => {
    setMatchMedia("(pointer: coarse)", true);
    setMatchMedia("(pointer: fine)", false);
    setMatchMedia("(hover: hover)", false);

    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 2,
    });

    const Alpine = startAlpine(mediaPlugin());
    const media = Alpine.store("media") as MediaStore;

    expect(media.isTouch).toBe(true);
    expect(media.isCoarse).toBe(true);
    expect(media.isFine).toBe(false);
    expect(media.canHover).toBe(false);
    expect(media.maxTouchPoints).toBe(2);

    setMatchMedia("(pointer: coarse)", false);
    setMatchMedia("(pointer: fine)", true);
    setMatchMedia("(hover: hover)", true);
    media.refresh();

    expect(media.isCoarse).toBe(false);
    expect(media.isFine).toBe(true);
    expect(media.canHover).toBe(true);
  });

  it("detects touch from ontouchstart when pointer queries do not match", () => {
    setMatchMedia("(pointer: coarse)", false);
    setMatchMedia("(pointer: fine)", false);
    setMatchMedia("(hover: hover)", false);

    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 0,
    });
    Object.defineProperty(window, "ontouchstart", {
      configurable: true,
      value: null,
    });

    const Alpine = startAlpine(mediaPlugin());
    const media = Alpine.store("media") as MediaStore;

    expect(media.isTouch).toBe(true);
  });
});

describe("@ailuracode/alpine-media SSR fallback", () => {
  it("uses safe defaults when window is undefined", async () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error simulate SSR
    globalThis.window = undefined;

    const { readMediaSnapshot: readSnapshot } = await import("../src/index.js");
    expect(readSnapshot()).toEqual({
      width: SSR_MEDIA_DEFAULTS.width,
      height: SSR_MEDIA_DEFAULTS.height,
      breakpoint: "mobile",
    });

    globalThis.window = originalWindow;
  });
});

describe("@ailuracode/alpine-media DOM reactivity", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("updates x-text bindings when width changes on resize", async () => {
    vi.useFakeTimers();
    setMatchMedia("(max-width: 767px)", true);
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 500,
    });

    startAlpine(mediaPlugin());
    document.body.innerHTML = `
      <div x-data>
        <span id="media-width" x-text="$store.media.width"></span>
        <span id="media-breakpoint" x-text="$store.media.breakpoint"></span>
        <span id="media-motion" x-text="$store.media.prefersReducedMotion"></span>
      </div>
    `;
    Alpine.initTree(document.body);

    expect(document.getElementById("media-width")?.textContent).toBe("500");
    expect(document.getElementById("media-breakpoint")?.textContent).toBe("mobile");

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1200,
    });
    window.dispatchEvent(new Event("resize"));
    await vi.advanceTimersByTimeAsync(100);

    expect(document.getElementById("media-width")?.textContent).toBe("1200");
  });
});
