import { describe, expect, it } from "vitest";
import {
  aggregatePointers,
  applyAxisLock,
  computeVelocity,
  distance,
  type PointerSnapshot,
  resolveDirection,
} from "../src/internal/pointer";

function snap(
  id: number,
  x: number,
  y: number,
  timestamp = 0,
  pressure = 0.5
): PointerSnapshot {
  return {
    id,
    x,
    y,
    timestamp,
    pressure,
    button: 0,
    buttons: 1,
    pointerType: "touch",
  };
}

describe("aggregatePointers", () => {
  it("returns zero aggregate for empty map", () => {
    const result = aggregatePointers(new Map());
    expect(result.count).toBe(0);
    expect(result.centerX).toBe(0);
    expect(result.centerY).toBe(0);
  });

  it("computes center for single pointer", () => {
    const map = new Map<number, PointerSnapshot>();
    map.set(1, snap(1, 100, 200));
    const result = aggregatePointers(map);
    expect(result.centerX).toBe(100);
    expect(result.centerY).toBe(200);
    expect(result.count).toBe(1);
    expect(result.distance).toBe(0);
  });

  it("computes center and distance for two pointers", () => {
    const map = new Map<number, PointerSnapshot>();
    map.set(1, snap(1, 100, 100));
    map.set(2, snap(2, 200, 200));
    const result = aggregatePointers(map);
    expect(result.centerX).toBe(150);
    expect(result.centerY).toBe(150);
    expect(result.count).toBe(2);
    expect(result.distance).toBeCloseTo(141.42, 1);
  });
});

describe("distance", () => {
  it("computes Euclidean distance", () => {
    expect(distance(0, 0, 3, 4)).toBe(5);
    expect(distance(100, 100, 100, 100)).toBe(0);
  });
});

describe("computeVelocity", () => {
  it("computes velocity between snapshots", () => {
    const from: PointerSnapshot = snap(1, 0, 0, 0);
    const to: PointerSnapshot = snap(1, 100, 0, 100);
    const result = computeVelocity(from, to);
    expect(result.velocityX).toBe(1);
    expect(result.velocityY).toBe(0);
    expect(result.speed).toBe(1);
  });

  it("returns Infinity for same timestamp with displacement", () => {
    const from: PointerSnapshot = snap(1, 0, 0, 100);
    const to: PointerSnapshot = snap(1, 100, 0, 100);
    const result = computeVelocity(from, to);
    expect(result.velocityX).toBe(Number.POSITIVE_INFINITY);
    expect(result.velocityY).toBe(Number.POSITIVE_INFINITY);
    expect(result.speed).toBe(Number.POSITIVE_INFINITY);
  });

  it("returns zero for same timestamp and same position", () => {
    const from: PointerSnapshot = snap(1, 50, 50, 100);
    const to: PointerSnapshot = snap(1, 50, 50, 100);
    const result = computeVelocity(from, to);
    expect(result.velocityX).toBe(0);
    expect(result.velocityY).toBe(0);
    expect(result.speed).toBe(0);
  });
});

describe("resolveDirection", () => {
  it("resolves right", () => {
    expect(resolveDirection(10, 0)).toBe("right");
  });

  it("resolves left", () => {
    expect(resolveDirection(-10, 0)).toBe("left");
  });

  it("resolves down", () => {
    expect(resolveDirection(0, 10)).toBe("down");
  });

  it("resolves up", () => {
    expect(resolveDirection(0, -10)).toBe("up");
  });

  it("resolves none for zero", () => {
    expect(resolveDirection(0, 0)).toBe("none");
  });

  it("prefers horizontal when equal", () => {
    expect(resolveDirection(10, 10)).toBe("right");
  });
});

describe("applyAxisLock", () => {
  it("returns both axes for 'none'", () => {
    const result = applyAxisLock(10, 20, "none");
    expect(result.dx).toBe(10);
    expect(result.dy).toBe(20);
  });

  it("zeroes vertical for 'horizontal'", () => {
    const result = applyAxisLock(10, 20, "horizontal");
    expect(result.dx).toBe(10);
    expect(result.dy).toBe(0);
  });

  it("zeroes horizontal for 'vertical'", () => {
    const result = applyAxisLock(10, 20, "vertical");
    expect(result.dx).toBe(0);
    expect(result.dy).toBe(20);
  });
});
