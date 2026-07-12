/**
 * Internal recognition state machine for a single gesture kind.
 *
 * Each recognizer tracks its own lifecycle from pointer-down to
 * completion, reporting when it recognizes, fails, or is cancelled
 * by a competing gesture.
 */

import type { GestureAxisLock, GestureDirection, GestureKind } from "../types";
import {
  aggregatePointers,
  applyAxisLock,
  computeVelocity,
  distance,
  type PointerAggregate,
  type PointerSnapshot,
  resolveDirection,
} from "./pointer";

/** Result returned by the recognizer's `update` method. */
export interface RecognizerResult {
  /** The gesture this recognizer handles. */
  readonly kind: GestureKind;
  /** Whether the gesture was recognized in this update. */
  readonly recognized: boolean;
  /** Whether the gesture has definitively failed. */
  readonly failed: boolean;
  /** Whether the recognizer is still tracking. */
  readonly tracking: boolean;
}

/** Configuration for a recognizer. */
export interface RecognizerConfig {
  readonly tapThreshold: number;
  readonly doubleTapInterval: number;
  readonly longPressDelay: number;
  readonly swipeThreshold: number;
  readonly swipeVelocity: number;
  readonly panThreshold: number;
  readonly axisLock: GestureAxisLock;
  readonly pinchThreshold: number;
}

type TapRecognizerState = "idle" | "waiting";

type LongPressRecognizerState = "idle" | "waiting";

type SwipeRecognizerState = "idle" | "tracking";

type PanRecognizerState = "idle" | "threshold" | "tracking";

type PinchRecognizerState = "idle" | "threshold" | "tracking";

/** Recognizer for tap gestures. */
export class TapRecognizer {
  readonly kind = "tap" as const;
  #state: TapRecognizerState = "idle";
  #start: PointerSnapshot | null = null;

  reset(): void {
    this.#state = "idle";
    this.#start = null;
  }

  pointerDown(snapshot: PointerSnapshot): void {
    this.#start = snapshot;
    this.#state = "waiting";
  }

  pointerUp(snapshot: PointerSnapshot, config: RecognizerConfig): RecognizerResult {
    if (this.#state !== "waiting" || !this.#start) {
      return { kind: this.kind, recognized: false, failed: true, tracking: false };
    }
    const dist = distance(this.#start.x, this.#start.y, snapshot.x, snapshot.y);
    const elapsed = snapshot.timestamp - this.#start.timestamp;
    // Reject if held too long (> 300ms is generally a long press)
    if (elapsed > 300 || dist > config.tapThreshold) {
      return { kind: this.kind, recognized: false, failed: true, tracking: false };
    }
    return { kind: this.kind, recognized: true, failed: false, tracking: false };
  }

  cancel(): RecognizerResult {
    const was = this.#state === "waiting";
    this.reset();
    return { kind: this.kind, recognized: false, failed: was, tracking: false };
  }

  get isTracking(): boolean {
    return this.#state === "waiting";
  }

  get startX(): number {
    return this.#start?.x ?? 0;
  }

  get startY(): number {
    return this.#start?.y ?? 0;
  }
}

/** Recognizer for double-tap gestures. */
export class DoubleTapRecognizer {
  readonly kind = "doubletap" as const;
  #lastTapTime = 0;
  #start: PointerSnapshot | null = null;
  #tracking = false;

  reset(): void {
    this.#lastTapTime = 0;
    this.#start = null;
    this.#tracking = false;
  }

  pointerDown(snapshot: PointerSnapshot): void {
    this.#start = snapshot;
    this.#tracking = true;
  }

  pointerUp(snapshot: PointerSnapshot, config: RecognizerConfig): RecognizerResult {
    if (!(this.#tracking && this.#start)) {
      return { kind: this.kind, recognized: false, failed: true, tracking: false };
    }
    this.#tracking = false;
    const dist = distance(this.#start.x, this.#start.y, snapshot.x, snapshot.y);
    if (dist > config.tapThreshold) {
      this.#lastTapTime = 0;
      return { kind: this.kind, recognized: false, failed: true, tracking: false };
    }
    const now = snapshot.timestamp;
    const elapsed = now - this.#lastTapTime;
    if (this.#lastTapTime > 0 && elapsed <= config.doubleTapInterval) {
      this.#lastTapTime = 0;
      return { kind: this.kind, recognized: true, failed: false, tracking: false };
    }
    this.#lastTapTime = now;
    return { kind: this.kind, recognized: false, failed: false, tracking: false };
  }

  cancel(): RecognizerResult {
    const was = this.#tracking;
    this.#tracking = false;
    return { kind: this.kind, recognized: false, failed: was, tracking: false };
  }

  get isTracking(): boolean {
    return this.#tracking;
  }
}

/** Recognizer for long-press gestures. */
export class LongPressRecognizer {
  readonly kind = "longpress" as const;
  #state: LongPressRecognizerState = "idle";
  #start: PointerSnapshot | null = null;
  #timer: ReturnType<typeof setTimeout> | null = null;
  #onRecognized: (() => void) | null = null;

  setCallback(cb: () => void): void {
    this.#onRecognized = cb;
  }

  reset(): void {
    this.#state = "idle";
    this.#start = null;
    if (this.#timer !== null) {
      clearTimeout(this.#timer);
      this.#timer = null;
    }
  }

  pointerDown(snapshot: PointerSnapshot, config: RecognizerConfig): void {
    this.#start = snapshot;
    this.#state = "waiting";
    this.#timer = setTimeout(() => {
      if (this.#state === "waiting") {
        this.#state = "idle";
        this.#onRecognized?.();
      }
    }, config.longPressDelay);
  }

  pointerMove(snapshot: PointerSnapshot, config: RecognizerConfig): RecognizerResult {
    if (this.#state !== "waiting" || !this.#start) {
      return {
        kind: this.kind,
        recognized: false,
        failed: this.#state === "idle",
        tracking: false,
      };
    }
    const dist = distance(this.#start.x, this.#start.y, snapshot.x, snapshot.y);
    if (dist > config.tapThreshold) {
      this.reset();
      return { kind: this.kind, recognized: false, failed: true, tracking: false };
    }
    return { kind: this.kind, recognized: false, failed: false, tracking: true };
  }

  pointerUp(): RecognizerResult {
    const was = this.#state === "waiting";
    this.reset();
    return { kind: this.kind, recognized: false, failed: was, tracking: false };
  }

  cancel(): RecognizerResult {
    const was = this.#state === "waiting";
    this.reset();
    return { kind: this.kind, recognized: false, failed: was, tracking: false };
  }

  get isTracking(): boolean {
    return this.#state === "waiting";
  }
}

/** Recognizer for swipe gestures. */
export class SwipeRecognizer {
  readonly kind = "swipe" as const;
  #state: SwipeRecognizerState = "idle";
  #start: PointerSnapshot | null = null;

  reset(): void {
    this.#state = "idle";
    this.#start = null;
  }

  pointerDown(snapshot: PointerSnapshot): void {
    this.#start = snapshot;
    this.#state = "tracking";
  }

  pointerMove(snapshot: PointerSnapshot, config: RecognizerConfig): RecognizerResult {
    if (this.#state !== "tracking" || !this.#start) {
      return {
        kind: this.kind,
        recognized: false,
        failed: this.#state === "idle",
        tracking: false,
      };
    }
    const dx = snapshot.x - this.#start.x;
    const dy = snapshot.y - this.#start.y;
    const locked = applyAxisLock(dx, dy, config.axisLock);
    const dist = Math.hypot(locked.dx, locked.dy);
    // Swipe is only recognized on pointer-up, but we fail early
    // if the user moves beyond the threshold area without releasing
    // (that's a pan, not a swipe).
    if (dist > config.swipeThreshold * 2) {
      return { kind: this.kind, recognized: false, failed: true, tracking: false };
    }
    return { kind: this.kind, recognized: false, failed: false, tracking: true };
  }

  pointerUp(snapshot: PointerSnapshot, config: RecognizerConfig): RecognizerResult {
    if (this.#state !== "tracking" || !this.#start) {
      return { kind: this.kind, recognized: false, failed: true, tracking: false };
    }
    const dx = snapshot.x - this.#start.x;
    const dy = snapshot.y - this.#start.y;
    const locked = applyAxisLock(dx, dy, config.axisLock);
    const dist = Math.hypot(locked.dx, locked.dy);
    const vel = computeVelocity(this.#start, snapshot);

    if (dist >= config.swipeThreshold && vel.speed >= config.swipeVelocity) {
      this.reset();
      return { kind: this.kind, recognized: true, failed: false, tracking: false };
    }
    this.reset();
    return { kind: this.kind, recognized: false, failed: true, tracking: false };
  }

  cancel(): RecognizerResult {
    const was = this.#state === "tracking";
    this.reset();
    return { kind: this.kind, recognized: false, failed: was, tracking: false };
  }

  get isTracking(): boolean {
    return this.#state === "tracking";
  }

  get startSnapshot(): PointerSnapshot | null {
    return this.#start;
  }
}

/** Recognizer for pan gestures. */
export class PanRecognizer {
  readonly kind = "pan" as const;
  #state: PanRecognizerState = "idle";
  #start: PointerSnapshot | null = null;

  reset(): void {
    this.#state = "idle";
    this.#start = null;
  }

  pointerDown(snapshot: PointerSnapshot): void {
    this.#start = snapshot;
    this.#state = "threshold";
  }

  pointerMove(snapshot: PointerSnapshot, config: RecognizerConfig): RecognizerResult {
    if (this.#state === "idle" || !this.#start) {
      return {
        kind: this.kind,
        recognized: false,
        failed: this.#state === "idle",
        tracking: false,
      };
    }
    const dx = snapshot.x - this.#start.x;
    const dy = snapshot.y - this.#start.y;
    const locked = applyAxisLock(dx, dy, config.axisLock);
    const dist = Math.hypot(locked.dx, locked.dy);

    if (this.#state === "threshold") {
      if (dist >= config.panThreshold) {
        this.#state = "tracking";
        return { kind: this.kind, recognized: true, failed: false, tracking: true };
      }
      return { kind: this.kind, recognized: false, failed: false, tracking: true };
    }

    // Already tracking — each move is a recognition (pan-move)
    return { kind: this.kind, recognized: true, failed: false, tracking: true };
  }

  pointerUp(_snapshot: PointerSnapshot, _config: RecognizerConfig): RecognizerResult {
    const wasTracking = this.#state === "tracking";
    this.reset();
    if (wasTracking) {
      return { kind: this.kind, recognized: true, failed: false, tracking: false };
    }
    return { kind: this.kind, recognized: false, failed: true, tracking: false };
  }

  cancel(): RecognizerResult {
    const was = this.#state !== "idle";
    this.reset();
    return { kind: this.kind, recognized: false, failed: was, tracking: false };
  }

  get isTracking(): boolean {
    return this.#state === "tracking";
  }

  get isPending(): boolean {
    return this.#state === "threshold";
  }

  get startSnapshot(): PointerSnapshot | null {
    return this.#start;
  }
}

/** Recognizer for pinch gestures. */
export class PinchRecognizer {
  readonly kind = "pinch" as const;
  #state: PinchRecognizerState = "idle";
  #initialDistance = 0;

  reset(): void {
    this.#state = "idle";
    this.#initialDistance = 0;
  }

  pointerDown(_snapshot: PointerSnapshot, aggregate: PointerAggregate): void {
    if (aggregate.count >= 2) {
      this.#initialDistance = aggregate.distance;
      this.#state = "threshold";
    }
  }

  pointerMove(
    _snapshot: PointerSnapshot,
    aggregate: PointerAggregate,
    config: RecognizerConfig
  ): RecognizerResult {
    if (aggregate.count < 2) {
      if (this.#state !== "idle") {
        this.reset();
        return { kind: this.kind, recognized: false, failed: true, tracking: false };
      }
      return { kind: this.kind, recognized: false, failed: false, tracking: false };
    }

    if (this.#state === "idle") {
      this.#initialDistance = aggregate.distance;
      this.#state = "threshold";
    }

    if (this.#state === "threshold") {
      const distDelta = Math.abs(aggregate.distance - this.#initialDistance);
      if (distDelta >= config.pinchThreshold) {
        this.#state = "tracking";
        return { kind: this.kind, recognized: true, failed: false, tracking: true };
      }
      return { kind: this.kind, recognized: false, failed: false, tracking: true };
    }

    return { kind: this.kind, recognized: true, failed: false, tracking: true };
  }

  pointerUp(_snapshot: PointerSnapshot, aggregate: PointerAggregate): RecognizerResult {
    const wasTracking = this.#state === "tracking";
    this.reset();
    if (aggregate.count >= 2) {
      return { kind: this.kind, recognized: false, failed: false, tracking: false };
    }
    if (wasTracking) {
      return { kind: this.kind, recognized: true, failed: false, tracking: false };
    }
    return { kind: this.kind, recognized: false, failed: true, tracking: false };
  }

  cancel(): RecognizerResult {
    const was = this.#state !== "idle";
    this.reset();
    return { kind: this.kind, recognized: false, failed: was, tracking: false };
  }

  get isTracking(): boolean {
    return this.#state === "tracking";
  }
}

/** Aggregate state across all active recognizers. */
export function buildPointerAggregate(pointers: Map<number, PointerSnapshot>): PointerAggregate {
  return aggregatePointers(pointers);
}

/** Compute gesture direction from start to current pointer position. */
export function gestureDirection(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number
): GestureDirection {
  return resolveDirection(currentX - startX, currentY - startY);
}
