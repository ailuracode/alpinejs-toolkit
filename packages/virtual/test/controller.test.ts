import { describe, expect, it } from "vitest";
import { VirtualController } from "../src/controller.js";
import {
  buildMeasurements,
  calculateVisibleRange,
  clampScrollOffset,
  getOffsetForIndex,
  sliceVirtualItems,
} from "../src/internal/measurements.js";
import { normalizeVirtualOptions } from "../src/options.js";

describe("@ailuracode/alpine-virtual", () => {
  describe("measurements", () => {
    it("builds fixed-size measurements with gap and padding", () => {
      const options = normalizeVirtualOptions({
        count: 3,
        estimateSize: 40,
        gap: 8,
        paddingStart: 10,
        paddingEnd: 20,
      });
      const keys = [0, 1, 2];
      const built = buildMeasurements(options, keys, new Map());

      expect(built.measurements).toEqual([
        { index: 0, key: 0, start: 10, end: 50, size: 40 },
        { index: 1, key: 1, start: 58, end: 98, size: 40 },
        { index: 2, key: 2, start: 106, end: 146, size: 40 },
      ]);
      expect(built.totalSize).toBe(166);
    });

    it("calculates visible range with overscan", () => {
      const options = normalizeVirtualOptions({ count: 10, estimateSize: 50, overscan: 1 });
      const built = buildMeasurements(
        options,
        Array.from({ length: 10 }, (_, i) => i),
        new Map()
      );

      const range = calculateVisibleRange(built.measurements, 120, 100, options.overscan);
      expect(range).toEqual({ startIndex: 1, endIndex: 5 });
      expect(sliceVirtualItems(built.measurements, range).map((item) => item.index)).toEqual([
        1, 2, 3, 4, 5,
      ]);
    });

    it("resolves scroll offsets for alignment modes", () => {
      const options = normalizeVirtualOptions({ count: 5, estimateSize: 100 });
      const built = buildMeasurements(options, [0, 1, 2, 3, 4], new Map());

      expect(getOffsetForIndex(built.measurements, 2, "start", 200, 0)?.offset).toBe(200);
      expect(getOffsetForIndex(built.measurements, 2, "center", 200, 0)?.offset).toBe(150);
      expect(getOffsetForIndex(built.measurements, 2, "end", 200, 0)?.offset).toBe(100);
      expect(clampScrollOffset(999, built.totalSize, 200)).toBe(300);
    });
  });

  describe("VirtualController", () => {
    it("creates instances and returns virtual items for fixed sizes", () => {
      const controller = new VirtualController();
      controller.create("list", { count: 100, estimateSize: 32, overscan: 2 });

      controller.bindScrollElement("list", null);
      const instance = controller.snapshotInstances().list;
      expect(instance?.count).toBe(100);
      expect(instance?.virtualItems.length).toBeGreaterThan(0);
      expect(instance?.virtualItems[0]?.size).toBe(32);
    });

    it("supports variable item sizes via measureItem", () => {
      const controller = new VirtualController();
      controller.create("variable", { count: 4, estimateSize: 40 });

      controller.measureItem("variable", 1, 80);
      controller.measureItem("variable", 2, 20);

      const items = controller.getVirtualItems("variable");
      expect(items.some((item) => item.index === 1 && item.size === 80)).toBe(true);
    });

    it("updates count and keys for dynamic data", () => {
      const controller = new VirtualController();
      controller.create("dynamic", {
        count: 2,
        estimateSize: 30,
        getItemKey: (index) => `k-${index}`,
      });

      controller.setCount("dynamic", 3);
      controller.setKeys("dynamic", ["k-0", "k-2", "k-new"]);

      expect(controller.snapshotInstances().dynamic?.count).toBe(3);
    });

    it("preserves scroll anchor when a measured size changes", () => {
      const controller = new VirtualController();
      controller.create("anchor", { count: 5, estimateSize: 50 });

      controller.scrollToOffset("anchor", 100);
      const before = controller.snapshotInstances().anchor?.scrollOffset ?? 0;

      controller.measureItem("anchor", 1, 120);
      const after = controller.snapshotInstances().anchor?.scrollOffset ?? 0;

      expect(after).toBeGreaterThanOrEqual(before);
    });

    it("throws after destroy", () => {
      const controller = new VirtualController();
      controller.create("list", { count: 1 });
      controller.destroy();

      expect(() => controller.create("other", { count: 1 })).toThrow();
    });

    it("destroys a single instance without tearing down the controller", () => {
      const controller = new VirtualController();
      controller.create("a", { count: 1 });
      controller.create("b", { count: 1 });

      controller.destroy("a");
      expect(controller.hasInstance("a")).toBe(false);
      expect(controller.hasInstance("b")).toBe(true);
    });
  });
});
