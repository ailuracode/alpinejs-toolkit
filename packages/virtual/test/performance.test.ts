import { describe, expect, it } from "vitest";
import { VirtualController } from "../src/controller.js";
import {
  buildMeasurements,
  calculateVisibleRange,
  sliceVirtualItems,
} from "../src/internal/measurements.js";
import { normalizeVirtualOptions } from "../src/options.js";

describe("@ailuracode/alpine-virtual performance", () => {
  it("calculates ranges for 100k items under 50ms", () => {
    const options = normalizeVirtualOptions({ count: 100_000, estimateSize: 32, overscan: 5 });
    const keys = Array.from({ length: options.count }, (_, index) => index);
    const built = buildMeasurements(options, keys, new Map());

    const start = performance.now();
    for (let scroll = 0; scroll < 1_000_000; scroll += 10_000) {
      const range = calculateVisibleRange(built.measurements, scroll, 600, options.overscan);
      sliceVirtualItems(built.measurements, range);
    }
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(50);
  });

  it("handles repeated scroll commands without leaking instances", () => {
    const controller = new VirtualController();
    controller.create("perf", { count: 10_000, estimateSize: 28 });

    for (let index = 0; index < 200; index++) {
      controller.scrollToIndex("perf", index % 500);
    }

    expect(controller.hasInstance("perf")).toBe(true);
    controller.destroy("perf");
    expect(controller.hasInstance("perf")).toBe(false);
  });
});
