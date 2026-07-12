import { describe, expect, it } from "vitest";
import { DEFAULT_GESTURE_OPTIONS, normalizeGestureOptions } from "../src/options";

describe("normalizeGestureOptions", () => {
  it("returns defaults for empty input", () => {
    const opts = normalizeGestureOptions();
    expect(opts.id).toBe(DEFAULT_GESTURE_OPTIONS.id);
    expect(opts.tapThreshold).toBe(10);
    expect(opts.doubleTapInterval).toBe(300);
    expect(opts.longPressDelay).toBe(500);
    expect(opts.swipeThreshold).toBe(50);
    expect(opts.swipeVelocity).toBe(0.3);
    expect(opts.panThreshold).toBe(10);
    expect(opts.axisLock).toBe("none");
    expect(opts.pinchThreshold).toBe(10);
    expect(opts.preventDefault).toBe(false);
    expect(opts.capturePointer).toBe(true);
  });

  it("preserves provided values", () => {
    const opts = normalizeGestureOptions({
      id: "my-gesture",
      tapThreshold: 20,
      doubleTapInterval: 500,
      longPressDelay: 800,
      swipeThreshold: 100,
      swipeVelocity: 0.5,
      panThreshold: 20,
      axisLock: "horizontal",
      pinchThreshold: 15,
      preventDefault: true,
      capturePointer: false,
    });
    expect(opts.id).toBe("my-gesture");
    expect(opts.tapThreshold).toBe(20);
    expect(opts.doubleTapInterval).toBe(500);
    expect(opts.longPressDelay).toBe(800);
    expect(opts.swipeThreshold).toBe(100);
    expect(opts.swipeVelocity).toBe(0.5);
    expect(opts.panThreshold).toBe(20);
    expect(opts.axisLock).toBe("horizontal");
    expect(opts.pinchThreshold).toBe(15);
    expect(opts.preventDefault).toBe(true);
    expect(opts.capturePointer).toBe(false);
  });

  it("creates a Set for gestures option", () => {
    const opts = normalizeGestureOptions({ gestures: ["tap", "swipe"] });
    expect(opts.gestures.has("tap")).toBe(true);
    expect(opts.gestures.has("swipe")).toBe(true);
    expect(opts.gestures.has("pan")).toBe(false);
  });
});
