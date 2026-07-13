/**
 * Internal pointer tracking utilities for gesture recognition.
 *
 * Tracks active pointers, computes velocity, distance, and
 * multi-pointer geometry (scale, rotation).
 */

/** Snapshot of a single pointer's state at a point in time. */
export interface PointerSnapshot {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly timestamp: number;
  readonly pressure?: number;
  readonly button: number;
  readonly buttons: number;
  readonly pointerType: string;
}

/** Aggregated pointer state across all active pointers. */
export interface PointerAggregate {
  readonly centerX: number;
  readonly centerY: number;
  readonly count: number;
  readonly distance: number;
  readonly rotation: number;
}

/**
 * Captures a pointer snapshot from a DOM `PointerEvent`.
 */
export function snapshotPointerFromEvent(event: PointerEvent): PointerSnapshot {
  return {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    timestamp: event.timeStamp,
    pressure: event.pressure,
    button: event.button,
    buttons: event.buttons,
    pointerType: event.pointerType,
  };
}

/**
 * Computes the center point and spread of a set of pointer snapshots.
 */
export function aggregatePointers(pointers: Map<number, PointerSnapshot>): PointerAggregate {
  if (pointers.size === 0) {
    return { centerX: 0, centerY: 0, count: 0, distance: 0, rotation: 0 };
  }

  const values = Array.from(pointers.values());
  let sumX = 0;
  let sumY = 0;
  for (const p of values) {
    sumX += p.x;
    sumY += p.y;
  }
  const centerX = sumX / values.length;
  const centerY = sumY / values.length;

  if (values.length < 2) {
    return { centerX, centerY, count: values.length, distance: 0, rotation: 0 };
  }

  const p0 = values[0];
  const p1 = values[1];
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const distance = Math.hypot(dx, dy);
  const rotation = (Math.atan2(dy, dx) * 180) / Math.PI;

  return { centerX, centerY, count: values.length, distance, rotation };
}

/**
 * Computes Euclidean distance between two points.
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Computes velocity (px/ms) between two snapshots.
 */
export function computeVelocity(
  from: PointerSnapshot,
  to: PointerSnapshot
): { velocityX: number; velocityY: number; speed: number } {
  const dt = to.timestamp - from.timestamp;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dt <= 0) {
    if (dx === 0 && dy === 0) {
      return { velocityX: 0, velocityY: 0, speed: 0 };
    }
    return {
      velocityX: Number.POSITIVE_INFINITY,
      velocityY: Number.POSITIVE_INFINITY,
      speed: Number.POSITIVE_INFINITY,
    };
  }
  const velocityX = dx / dt;
  const velocityY = dy / dt;
  const speed = Math.hypot(velocityX, velocityY);
  return { velocityX, velocityY, speed };
}

/**
 * Determines the primary direction from dx/dy deltas.
 */
export function resolveDirection(
  dx: number,
  dy: number
): "up" | "down" | "left" | "right" | "none" {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const max = Math.max(absDx, absDy);
  if (max < 1) {
    return "none";
  }
  if (absDx >= absDy) {
    return dx > 0 ? "right" : "left";
  }
  return dy > 0 ? "down" : "up";
}

/**
 * Clamps dx/dy to the given axis lock.
 */
export function applyAxisLock(
  dx: number,
  dy: number,
  lock: "none" | "horizontal" | "vertical"
): { dx: number; dy: number } {
  if (lock === "horizontal") {
    return { dx, dy: 0 };
  }
  if (lock === "vertical") {
    return { dx: 0, dy };
  }
  return { dx, dy };
}
