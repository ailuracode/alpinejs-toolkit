import { describe, expect, it } from "vitest";
import type { PointerSnapshot } from "../src/internal/pointer";
import {
  DoubleTapRecognizer,
  PanRecognizer,
  PinchRecognizer,
  type RecognizerConfig,
  SwipeRecognizer,
  TapRecognizer,
} from "../src/internal/recognizer";

const defaultConfig: RecognizerConfig = {
  tapThreshold: 10,
  doubleTapInterval: 300,
  longPressDelay: 500,
  swipeThreshold: 50,
  swipeVelocity: 0.3,
  panThreshold: 10,
  axisLock: "none",
  pinchThreshold: 10,
};

function snap(x: number, y: number, timestamp = 0): PointerSnapshot {
  return {
    id: 1,
    x,
    y,
    timestamp,
    pressure: 0.5,
    button: 0,
    buttons: 1,
    pointerType: "touch",
  };
}

describe("TapRecognizer", () => {
  it("recognizes a tap within threshold", () => {
    const r = new TapRecognizer();
    r.pointerDown(snap(100, 100));
    const result = r.pointerUp(snap(100, 100, 50), defaultConfig);
    expect(result.recognized).toBe(true);
    expect(result.kind).toBe("tap");
  });

  it("fails when moved beyond threshold", () => {
    const r = new TapRecognizer();
    r.pointerDown(snap(100, 100));
    const result = r.pointerUp(snap(200, 200, 50), defaultConfig);
    expect(result.recognized).toBe(false);
    expect(result.failed).toBe(true);
  });

  it("fails when held too long", () => {
    const r = new TapRecognizer();
    r.pointerDown(snap(100, 100, 0));
    const result = r.pointerUp(snap(100, 100, 400), defaultConfig);
    expect(result.recognized).toBe(false);
    expect(result.failed).toBe(true);
  });

  it("cancel returns failed", () => {
    const r = new TapRecognizer();
    r.pointerDown(snap(100, 100));
    const result = r.cancel();
    expect(result.recognized).toBe(false);
    expect(result.failed).toBe(true);
  });
});

describe("DoubleTapRecognizer", () => {
  it("recognizes two quick taps", () => {
    const r = new DoubleTapRecognizer();
    r.pointerDown(snap(100, 100, 0));
    r.pointerUp(snap(100, 100, 50), defaultConfig);

    r.pointerDown(snap(100, 100, 200));
    const result = r.pointerUp(snap(100, 100, 250), defaultConfig);
    expect(result.recognized).toBe(true);
    expect(result.kind).toBe("doubletap");
  });

  it("fails when taps are too far apart in time", () => {
    const r = new DoubleTapRecognizer();
    r.pointerDown(snap(100, 100, 0));
    r.pointerUp(snap(100, 100, 50), defaultConfig);

    r.pointerDown(snap(100, 100, 500));
    const result = r.pointerUp(snap(100, 100, 550), defaultConfig);
    expect(result.recognized).toBe(false);
  });
});

describe("SwipeRecognizer", () => {
  it("recognizes a swipe when distance and velocity are sufficient", () => {
    const r = new SwipeRecognizer();
    r.pointerDown(snap(0, 100, 0));
    const result = r.pointerUp(snap(100, 100, 100), defaultConfig);
    expect(result.recognized).toBe(true);
    expect(result.kind).toBe("swipe");
  });

  it("fails when distance is too small", () => {
    const r = new SwipeRecognizer();
    r.pointerDown(snap(0, 100, 0));
    const result = r.pointerUp(snap(10, 100, 100), defaultConfig);
    expect(result.recognized).toBe(false);
    expect(result.failed).toBe(true);
  });
});

describe("PanRecognizer", () => {
  it("recognizes pan after threshold", () => {
    const r = new PanRecognizer();
    r.pointerDown(snap(100, 100));

    const m1 = r.pointerMove(snap(105, 105), defaultConfig);
    expect(m1.recognized).toBe(false);
    expect(m1.tracking).toBe(true);

    const m2 = r.pointerMove(snap(120, 120), defaultConfig);
    expect(m2.recognized).toBe(true);
    expect(m2.tracking).toBe(true);
  });

  it("emits end on pointer up", () => {
    const r = new PanRecognizer();
    r.pointerDown(snap(100, 100));
    r.pointerMove(snap(120, 120), defaultConfig);

    const result = r.pointerUp(snap(140, 140), defaultConfig);
    expect(result.recognized).toBe(true);
    expect(result.tracking).toBe(false);
  });
});

describe("PinchRecognizer", () => {
  it("recognizes pinch when two pointers spread", () => {
    const r = new PinchRecognizer();
    r.pointerDown(snap(100, 100), {
      centerX: 125,
      centerY: 125,
      count: 2,
      distance: 50,
      rotation: 45,
    });

    const result = r.pointerMove(
      snap(100, 100),
      { centerX: 150, centerY: 150, count: 2, distance: 100, rotation: 45 },
      defaultConfig
    );
    expect(result.recognized).toBe(true);
    expect(result.kind).toBe("pinch");
  });

  it("fails when pointers drop below two", () => {
    const r = new PinchRecognizer();
    r.pointerDown(snap(100, 100), {
      centerX: 125,
      centerY: 125,
      count: 2,
      distance: 50,
      rotation: 45,
    });

    const result = r.pointerUp(snap(100, 100), {
      centerX: 100,
      centerY: 100,
      count: 1,
      distance: 0,
      rotation: 0,
    });
    expect(result.failed).toBe(true);
  });
});
