/**
 * Controller tests for `@ailuracode/alpine-media`.
 *
 * Covers the framework-agnostic {@link MediaController} surface.
 * The Alpine integration is tested separately in `plugin.spec.ts`.
 */

import assert from "node:assert/strict";
import { ToolkitError } from "@ailuracode/alpine-core";
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import {
  createMedia,
  DEFAULT_MEDIA_INTERVALS,
  type MediaChangeDetail,
  MediaController,
  type MediaInterval,
  type MediaManager,
  type MediaSnapshot,
  mediaIntervals,
  resolveMediaBreakpoint,
  SSR_MEDIA_DEFAULTS,
} from "../src/index";
import { readMediaSnapshot } from "../src/internal/breakpoint";
import { setMatchMedia } from "./setup";

describe("MediaController — initial state", () => {
  it("uses the default intervals when none are provided", () => {
    const media = createMedia();
    assert.equal(media.intervals.length, 2);
    assert.equal(media.intervals[0].name, "mobile");
    assert.equal(media.intervals[1].name, "desktop");
    media.destroy();
  });

  it("seeds deterministic SSR defaults before mount()", () => {
    const media = new MediaController<"mobile" | "desktop">({
      intervals: DEFAULT_MEDIA_INTERVALS,
    });
    assert.equal(media.width, SSR_MEDIA_DEFAULTS.width);
    assert.equal(media.height, SSR_MEDIA_DEFAULTS.height);
    assert.equal(media.prefersReducedMotion, SSR_MEDIA_DEFAULTS.prefersReducedMotion);
    assert.equal(media.prefersContrast, SSR_MEDIA_DEFAULTS.prefersContrast);
    assert.equal(media.prefersColorScheme, SSR_MEDIA_DEFAULTS.prefersColorScheme);
    assert.equal(media.hover, SSR_MEDIA_DEFAULTS.hover);
    assert.equal(media.pointer, SSR_MEDIA_DEFAULTS.pointer);
    assert.equal(media.orientation, SSR_MEDIA_DEFAULTS.orientation);
    assert.equal(media.maxTouchPoints, SSR_MEDIA_DEFAULTS.maxTouchPoints);
    media.destroy();
  });

  it("emits an initialization event on a microtask with previous=null", async () => {
    const media = createMedia();
    const events: MediaChangeDetail[] = [];
    media.on("change", (detail) => events.push(detail));
    expect(events).toHaveLength(0);
    await Promise.resolve();
    expect(events).toEqual([
      {
        current: media.snapshot(),
        previous: null,
        source: "initialization",
      },
    ]);
    media.destroy();
  });

  it("exposes an auto-generated id when none is provided", () => {
    const media = createMedia();
    expect(media.id).toMatch(/^media-/);
    expect(media.isDestroyed).toBe(false);
    media.destroy();
  });

  it("uses the supplied id when provided", () => {
    const media = createMedia({ id: "my-media" });
    expect(media.id).toBe("my-media");
    media.destroy();
  });
});

describe("MediaController — input validation", () => {
  it("throws ToolkitError with TOOLKIT_INVALID_ARGUMENT when intervals is empty", () => {
    assert.throws(
      () => new MediaController({ intervals: [] }),
      (err: unknown) => err instanceof ToolkitError && err.code === "TOOLKIT_INVALID_ARGUMENT"
    );
  });

  it("resolveMediaBreakpoint throws ToolkitError for empty intervals", () => {
    assert.throws(
      () => resolveMediaBreakpoint(500, []),
      (err: unknown) => err instanceof ToolkitError && err.code === "TOOLKIT_INVALID_ARGUMENT"
    );
  });
});

describe("MediaController — viewport reads", () => {
  let media: import("../src/index").MediaController;

  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1200 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
  });

  afterEach(() => {
    media?.destroy();
  });

  it("reads width and height from the runtime on mount", () => {
    media = createMedia();
    assert.equal(media.width, 1200);
    assert.equal(media.height, 800);
  });

  it("exposes the snapshot helper", () => {
    media = createMedia();
    const snap = media.snapshot();
    assert.deepEqual(snap, { width: 1200, height: 800, breakpoint: "desktop" });
  });

  it("refreshWidth() updates width and reports a change", () => {
    media = createMedia();
    assert.equal(media.width, 1200);
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 500 });
    assert.equal(media.refreshWidth(), true);
    assert.equal(media.width, 500);
    assert.equal(media.refreshWidth(), false);
  });

  it("refreshHeight() updates height and reports a change", () => {
    media = createMedia();
    assert.equal(media.height, 800);
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 600 });
    assert.equal(media.refreshHeight(), true);
    assert.equal(media.height, 600);
    assert.equal(media.refreshHeight(), false);
  });

  it("refresh() returns true when any value changed", () => {
    media = createMedia();
    assert.equal(media.refresh(), false);
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 500 });
    assert.equal(media.refresh(), true);
    assert.equal(media.refresh(), false);
  });
});

describe("MediaController — breakpoints", () => {
  let media: import("../src/index").MediaController;

  afterEach(() => {
    media?.destroy();
  });

  it("resolves the default breakpoint from width via helper", () => {
    const intervals = mediaIntervals([
      { name: "mobile", maxWidth: 767 },
      { name: "desktop", maxWidth: Number.POSITIVE_INFINITY },
    ] as const);
    assert.equal(resolveMediaBreakpoint(500, intervals), "mobile");
    assert.equal(resolveMediaBreakpoint(1200, intervals), "desktop");
  });

  it("reads the breakpoint from matchMedia queries", () => {
    setMatchMedia("(max-width: 767px)", true);
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 500 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    media = createMedia();
    assert.equal(media.breakpoint, "mobile");
  });

  it("matches the smallest interval first", () => {
    setMatchMedia("(max-width: 480px)", true);
    setMatchMedia("(max-width: 768px)", true);
    media = createMedia({
      intervals: [
        { name: "phone", maxWidth: 480 },
        { name: "tablet", maxWidth: 768 },
        { name: "desktop", maxWidth: Number.POSITIVE_INFINITY },
      ],
    });
    assert.equal(media.breakpoint, "phone");
  });

  it("falls back to the last interval when nothing matches", () => {
    setMatchMedia("(max-width: 480px)", false);
    setMatchMedia("(max-width: 768px)", false);
    media = createMedia({
      intervals: [
        { name: "phone", maxWidth: 480 },
        { name: "tablet", maxWidth: 768 },
        { name: "wide", maxWidth: Number.POSITIVE_INFINITY },
      ],
    });
    assert.equal(media.breakpoint, "wide");
  });

  it("works with a single interval (always matches fallback)", () => {
    setMatchMedia("(max-width: 99999px)", false);
    media = createMedia({ intervals: [{ name: "all", maxWidth: Number.POSITIVE_INFINITY }] });
    assert.equal(media.breakpoint, "all");
  });

  it("recomputes the breakpoint when innerWidth shrinks across a threshold", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1200 });
    media = createMedia();
    assert.equal(media.breakpoint, "desktop");

    setMatchMedia("(max-width: 767px)", true);
    media.refresh();
    assert.equal(media.breakpoint, "mobile");
  });

  it("emits a change event with source 'user' on refresh()", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1200 });
    media = createMedia();
    const events: MediaChangeDetail[] = [];
    media.on("change", (detail) => events.push(detail));
    await Promise.resolve();
    events.length = 0;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 500 });
    media.refresh();
    assert.equal(events.length, 1);
    assert.equal(events[0].source, "user");
    assert.equal(events[0].current.width, 500);
    assert.equal(events[0].previous?.width, 1200);
  });
});

describe("MediaController — media features", () => {
  let media: import("../src/index").MediaController;

  afterEach(() => {
    media?.destroy();
  });

  it("reads prefers-reduced-motion", () => {
    setMatchMedia("(prefers-reduced-motion: reduce)", true);
    media = createMedia();
    assert.equal(media.prefersReducedMotion, true);

    setMatchMedia("(prefers-reduced-motion: reduce)", false);
    media.refresh();
    assert.equal(media.prefersReducedMotion, false);
  });

  it("reads prefers-contrast values", () => {
    setMatchMedia("(prefers-contrast: more)", true);
    media = createMedia();
    assert.equal(media.prefersContrast, "more");

    setMatchMedia("(prefers-contrast: more)", false);
    setMatchMedia("(prefers-contrast: less)", true);
    media.refresh();
    assert.equal(media.prefersContrast, "less");

    setMatchMedia("(prefers-contrast: less)", false);
    setMatchMedia("(prefers-contrast: custom)", true);
    media.refresh();
    assert.equal(media.prefersContrast, "custom");

    setMatchMedia("(prefers-contrast: custom)", false);
    media.refresh();
    assert.equal(media.prefersContrast, "no-preference");
  });

  it("reads prefers-color-scheme", () => {
    setMatchMedia("(prefers-color-scheme: dark)", true);
    media = createMedia();
    assert.equal(media.prefersColorScheme, "dark");

    setMatchMedia("(prefers-color-scheme: dark)", false);
    media.refresh();
    assert.equal(media.prefersColorScheme, "light");
  });

  it("reads hover capability", () => {
    setMatchMedia("(hover: hover)", true);
    media = createMedia();
    assert.equal(media.hover, "hover");

    setMatchMedia("(hover: hover)", false);
    media.refresh();
    assert.equal(media.hover, "none");
  });

  it("reads pointer capability", () => {
    setMatchMedia("(pointer: coarse)", true);
    media = createMedia();
    assert.equal(media.pointer, "coarse");

    setMatchMedia("(pointer: coarse)", false);
    setMatchMedia("(pointer: fine)", true);
    media.refresh();
    assert.equal(media.pointer, "fine");

    setMatchMedia("(pointer: fine)", false);
    setMatchMedia("(pointer: none)", true);
    media.refresh();
    assert.equal(media.pointer, "none");
  });

  it("reads orientation", () => {
    setMatchMedia("(orientation: portrait)", true);
    media = createMedia();
    assert.equal(media.orientation, "portrait");

    setMatchMedia("(orientation: portrait)", false);
    media.refresh();
    assert.equal(media.orientation, "landscape");
  });

  it("reads touch / pointer capabilities", () => {
    setMatchMedia("(pointer: coarse)", true);
    setMatchMedia("(pointer: fine)", false);
    setMatchMedia("(hover: hover)", false);
    Object.defineProperty(navigator, "maxTouchPoints", { configurable: true, value: 2 });

    media = createMedia();
    assert.equal(media.isTouch, true);
    assert.equal(media.isCoarse, true);
    assert.equal(media.isFine, false);
    assert.equal(media.canHover, false);
    assert.equal(media.maxTouchPoints, 2);

    setMatchMedia("(pointer: coarse)", false);
    setMatchMedia("(pointer: fine)", true);
    setMatchMedia("(hover: hover)", true);
    media.refresh();

    assert.equal(media.isCoarse, false);
    assert.equal(media.isFine, true);
    assert.equal(media.canHover, true);
  });

  it("detects touch from ontouchstart when no pointer query matches", () => {
    setMatchMedia("(pointer: coarse)", false);
    setMatchMedia("(pointer: fine)", false);
    setMatchMedia("(hover: hover)", false);
    Object.defineProperty(navigator, "maxTouchPoints", { configurable: true, value: 0 });
    Object.defineProperty(window, "ontouchstart", { configurable: true, value: null });

    media = createMedia();
    assert.equal(media.isTouch, true);
  });

  it("updates pointer/hover/touch when matchMedia fires a change event (no resize, no refresh)", async () => {
    // Simulates toggling the Chrome DevTools device toolbar from desktop
    // to mobile: the viewport does NOT resize, but `(pointer: coarse)` and
    // `(hover: hover)` flip their `matches` value. The controller must
    // observe the change and surface it through `pointer` / `hover` / `isTouch`.
    setMatchMedia("(pointer: coarse)", false);
    setMatchMedia("(pointer: fine)", true);
    setMatchMedia("(hover: hover)", true);
    Object.defineProperty(navigator, "maxTouchPoints", { configurable: true, value: 0 });
    // happy-dom exposes `ontouchstart` on `window`; strip it so the
    // heuristic only consults the cached media queries. `'ontouchstart'
    // in win` checks key existence, not the value, so define with
    // `undefined` and then delete the key.
    Object.defineProperty(window, "ontouchstart", { configurable: true, value: undefined });
    Reflect.deleteProperty(window, "ontouchstart");

    media = createMedia();
    assert.equal(media.pointer, "fine");
    assert.equal(media.hover, "hover");
    assert.equal(media.isTouch, false);
    assert.equal(media.isCoarse, false);
    assert.equal(media.canHover, true);

    const events: MediaChangeDetail[] = [];
    media.on("change", (detail) => events.push(detail));
    await Promise.resolve();
    events.length = 0; // drop the initialization emit

    // Toggle device toolbar → mobile.
    setMatchMedia("(pointer: coarse)", true);
    setMatchMedia("(pointer: fine)", false);
    setMatchMedia("(hover: hover)", false);

    assert.equal(media.pointer, "coarse");
    assert.equal(media.hover, "none");
    assert.equal(media.isTouch, true);
    assert.equal(media.isCoarse, true);
    assert.equal(media.isFine, false);
    assert.equal(media.canHover, false);
    assert.ok(events.length > 0, "expected at least one change event");

    // Toggle back → desktop.
    setMatchMedia("(pointer: coarse)", false);
    setMatchMedia("(pointer: fine)", true);
    setMatchMedia("(hover: hover)", true);

    assert.equal(media.pointer, "fine");
    assert.equal(media.hover, "hover");
    assert.equal(media.isTouch, false);
    assert.equal(media.isCoarse, false);
    assert.equal(media.canHover, true);
  });
});

describe("MediaController — resize debounce", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("updates width and height on resize after debounce", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1200 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 900 });
    const media = createMedia({ debounceMs: 50 });

    vi.useFakeTimers();
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 800 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 600 });
    window.dispatchEvent(new Event("resize"));
    await vi.advanceTimersByTimeAsync(50);

    assert.equal(media.width, 800);
    assert.equal(media.height, 600);
    media.destroy();
  });
});

describe("MediaController — subscribers", () => {
  it("returns an unsubscribe function that stops further notifications", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1200 });
    const media = createMedia();
    let calls = 0;
    const unsubscribe = media.on("change", () => {
      calls += 1;
    });
    await Promise.resolve();
    assert.equal(calls, 1);
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 500 });
    media.refresh();
    assert.equal(calls, 2);
    unsubscribe();
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1200 });
    media.refresh();
    assert.equal(calls, 2);
    media.destroy();
  });
});

describe("MediaController — lifecycle", () => {
  it("destroy() is idempotent", () => {
    const media = createMedia();
    media.destroy();
    media.destroy();
    assert.equal(media.isDestroyed, true);
  });

  it("destroy() stops firing change events", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1200 });
    const media = createMedia();
    let calls = 0;
    media.on("change", () => {
      calls += 1;
    });
    media.destroy();

    Object.defineProperty(window, "innerWidth", { configurable: true, value: 500 });
    media.refresh();
    assert.equal(calls, 0);
  });

  it("removes matchMedia listeners on destroy()", () => {
    setMatchMedia("(prefers-color-scheme: dark)", false);
    const media = createMedia();
    let resolved: number | null = null;
    media.on("change", (detail) => {
      resolved = detail.current.width;
    });
    media.destroy();

    setMatchMedia("(prefers-color-scheme: dark)", true);
    assert.equal(resolved, null);
  });
});

describe("MediaController — SSR fallback", () => {
  it("uses safe defaults when window is undefined", () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error simulate SSR
    globalThis.window = undefined;

    try {
      const snapshot = readMediaSnapshot(
        DEFAULT_MEDIA_INTERVALS as unknown as readonly MediaInterval[]
      );
      assert.equal(snapshot.width, SSR_MEDIA_DEFAULTS.width);
      assert.equal(snapshot.height, SSR_MEDIA_DEFAULTS.height);
      assert.equal(snapshot.breakpoint, "mobile");
    } finally {
      globalThis.window = originalWindow;
    }
  });
});

describe("MediaController — type inference", () => {
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

  it("types snapshot() return value", () => {
    const media = createMedia({
      intervals: mediaIntervals([
        { name: "mobile", maxWidth: 767 },
        { name: "desktop", maxWidth: Number.POSITIVE_INFINITY },
      ] as const),
    });
    expectTypeOf(media.snapshot().breakpoint).toEqualTypeOf<"mobile" | "desktop">();
    media.destroy();
  });

  it("matches the public MediaManager contract", () => {
    const media: MediaManager<"mobile" | "desktop"> = createMedia({
      intervals: mediaIntervals([
        { name: "mobile", maxWidth: 767 },
        { name: "desktop", maxWidth: Number.POSITIVE_INFINITY },
      ] as const),
    });
    assert.equal(typeof media.refresh, "function");
    assert.equal(typeof media.refreshWidth, "function");
    assert.equal(typeof media.refreshHeight, "function");
    assert.equal(typeof media.on, "function");
    assert.equal(typeof media.destroy, "function");
    media.destroy();
  });

  it("snapshots carry the typed breakpoint union", () => {
    const media = createMedia();
    const snap: MediaSnapshot = media.snapshot();
    expectTypeOf(snap.breakpoint).toEqualTypeOf<string>();
    media.destroy();
  });
});
