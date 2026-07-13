/**
 * Option normalization helpers for `@ailuracode/alpine-gesture`.
 */

import type { GestureAxisLock, GestureKind, GestureOptions } from "./types";

/**
 * Fully-populated controller configuration with defaults applied.
 */
export interface NormalizedGestureOptions {
  readonly id: string;
  readonly gestures: ReadonlySet<GestureKind>;
  readonly tapThreshold: number;
  readonly doubleTapInterval: number;
  readonly longPressDelay: number;
  readonly swipeThreshold: number;
  readonly swipeVelocity: number;
  readonly panThreshold: number;
  readonly axisLock: GestureAxisLock;
  readonly pinchThreshold: number;
  readonly preventDefault: boolean;
  readonly capturePointer: boolean;
  readonly mouseButtons: ReadonlySet<number>;
}

const ALL_GESTURES: readonly GestureKind[] = [
  "tap",
  "doubletap",
  "longpress",
  "swipe",
  "pan",
  "pinch",
];

export const DEFAULT_GESTURE_OPTIONS: NormalizedGestureOptions = {
  id: "",
  gestures: new Set(ALL_GESTURES),
  tapThreshold: 10,
  doubleTapInterval: 300,
  longPressDelay: 500,
  swipeThreshold: 50,
  swipeVelocity: 0.3,
  panThreshold: 10,
  axisLock: "none",
  pinchThreshold: 10,
  preventDefault: false,
  capturePointer: true,
  mouseButtons: new Set([0]),
};

export function normalizeGestureOptions(options: GestureOptions = {}): NormalizedGestureOptions {
  return {
    id: options.id ?? DEFAULT_GESTURE_OPTIONS.id,
    gestures: options.gestures ? new Set(options.gestures) : DEFAULT_GESTURE_OPTIONS.gestures,
    tapThreshold: options.tapThreshold ?? DEFAULT_GESTURE_OPTIONS.tapThreshold,
    doubleTapInterval: options.doubleTapInterval ?? DEFAULT_GESTURE_OPTIONS.doubleTapInterval,
    longPressDelay: options.longPressDelay ?? DEFAULT_GESTURE_OPTIONS.longPressDelay,
    swipeThreshold: options.swipeThreshold ?? DEFAULT_GESTURE_OPTIONS.swipeThreshold,
    swipeVelocity: options.swipeVelocity ?? DEFAULT_GESTURE_OPTIONS.swipeVelocity,
    panThreshold: options.panThreshold ?? DEFAULT_GESTURE_OPTIONS.panThreshold,
    axisLock: options.axisLock ?? DEFAULT_GESTURE_OPTIONS.axisLock,
    pinchThreshold: options.pinchThreshold ?? DEFAULT_GESTURE_OPTIONS.pinchThreshold,
    preventDefault: options.preventDefault ?? DEFAULT_GESTURE_OPTIONS.preventDefault,
    capturePointer: options.capturePointer ?? DEFAULT_GESTURE_OPTIONS.capturePointer,
    mouseButtons: options.mouseButtons
      ? new Set(options.mouseButtons)
      : DEFAULT_GESTURE_OPTIONS.mouseButtons,
  };
}
