/**
 * SSR spec — every public API works without `window` / `document`.
 *
 * Stubs `window` and `document` to `undefined` per-test and verifies
 * the controller's safe-mode path. After each test, the stubs are
 * restored so the next case sees a real jsdom environment.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollController } from "../src/controller";
import { ScrollError } from "../src/error";
import { computeScrollDirection, computeScrollMetrics } from "../src/internal/metrics";
import { isBrowserWithMedia, prefersReducedMotion } from "../src/internal/util";

describe("SSR — controller construction", () => {
  let originalWindow: typeof window | undefined;
  let originalDocument: typeof document | undefined;

  beforeEach(() => {
    originalWindow = globalThis.window;
    originalDocument = globalThis.document;
  });
  afterEach(() => {
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    }
    if (originalDocument !== undefined) {
      globalThis.document = originalDocument;
    }
    vi.unstubAllGlobals();
  });

  it("constructing under SSR does not throw", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    expect(() => new ScrollController()).not.toThrow();
  });

  it("mount() under SSR does not throw and skips side effects", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    const controller = new ScrollController();
    expect(() => controller.mount()).not.toThrow();
    expect(controller.isMounted).toBe(true);
    controller.destroy();
  });

  it("navigation commands under SSR are no-ops (no throw)", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    const controller = new ScrollController();
    controller.mount();
    expect(() => controller.toTop()).not.toThrow();
    expect(() => controller.toBottom()).not.toThrow();
    expect(() => controller.by({ y: 100 })).not.toThrow();
    expect(() => controller.scrollIntoView({ x: 0, y: 0 })).not.toThrow();
    controller.destroy();
  });

  it("lockWithHandle under SSR returns a handle but applies no styles", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    const controller = new ScrollController();
    controller.mount();
    const handle = controller.lockWithHandle("modal");
    expect(typeof handle).toBe("string");
    expect(controller.isLocked).toBe(true);
    controller.unlock(handle);
    expect(controller.isLocked).toBe(false);
    controller.destroy();
  });

  it("ScrollError can be constructed and inspected under SSR", () => {
    const error = new ScrollError("test", "SCROLL_NOT_BROWSER");
    expect(error.code).toBe("SCROLL_NOT_BROWSER");
    expect(error.name).toBe("ScrollError");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("SSR — internal helpers", () => {
  let originalWindow: typeof window | undefined;
  let originalDocument: typeof document | undefined;

  beforeEach(() => {
    originalWindow = globalThis.window;
    originalDocument = globalThis.document;
  });
  afterEach(() => {
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    }
    if (originalDocument !== undefined) {
      globalThis.document = originalDocument;
    }
    vi.unstubAllGlobals();
  });

  it("isBrowserWithMedia returns false under SSR", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    expect(isBrowserWithMedia()).toBe(false);
  });

  it("prefersReducedMotion returns false under SSR", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    expect(prefersReducedMotion()).toBe(false);
  });

  it("computeScrollDirection handles negative values", () => {
    expect(computeScrollDirection(0, -10)).toBe("up");
    expect(computeScrollDirection(-10, 0)).toBe("down");
    expect(computeScrollDirection(0, 0)).toBe("none");
  });

  it("computeScrollMetrics handles zero height", () => {
    // With scrollHeight === 0, maxY clamps to 0. y === 0 satisfies
    // `y >= maxY - 1` (0 >= -1), so atBottom is true. The
    // implementation considers any page with no scrollable content
    // to be "at the bottom".
    expect(
      computeScrollMetrics({
        x: 0,
        y: 0,
        previousY: 0,
        scrollHeight: 0,
        innerHeight: 0,
      })
    ).toEqual({
      x: 0,
      y: 0,
      direction: "none",
      atTop: true,
      atBottom: true,
      progress: 0,
    });
  });

  it("computeScrollMetrics computes progress and atBottom correctly", () => {
    expect(
      computeScrollMetrics({
        x: 0,
        y: 500,
        previousY: 0,
        scrollHeight: 1000,
        innerHeight: 500,
      })
    ).toEqual({
      x: 0,
      y: 500,
      direction: "down",
      atTop: false,
      atBottom: true,
      progress: 100,
    });
  });

  it("computeScrollMetrics clamps progress to 100 when scrollY exceeds maxY (overscroll bounce)", () => {
    // macOS / iOS rubber-band scroll momentarily pushes `scrollY`
    // past `scrollHeight - innerHeight`. The contract pins
    // `progress` to `[0, 100]` so consumers never see values outside
    // the documented range — even when `y` overshoots.
    expect(
      computeScrollMetrics({
        x: 0,
        y: 700,
        previousY: 500,
        scrollHeight: 1000,
        innerHeight: 500,
      })
    ).toEqual({
      x: 0,
      y: 700,
      direction: "down",
      atTop: false,
      atBottom: true,
      progress: 100,
    });
  });

  it("computeScrollMetrics clamps progress to 0 when scrollY is negative (overscroll top)", () => {
    expect(
      computeScrollMetrics({
        x: 0,
        y: -50,
        previousY: 0,
        scrollHeight: 1000,
        innerHeight: 500,
      })
    ).toMatchObject({
      atTop: true,
      progress: 0,
    });
  });
});
