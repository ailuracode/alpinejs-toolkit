/**
 * Public type contracts for `@ailuracode/alpine-gesture`.
 *
 * The gesture package recognizes six pointer-driven gestures:
 * tap, double-tap, long-press, swipe, pan, and pinch. Each
 * gesture is driven through explicit pointer-event inputs and
 * exposes a deterministic recognition lifecycle.
 */

import type { Alpine, PluginCallback } from "@ailuracode/alpine-core";
import type { Alpine as AlpineBase } from "alpinejs";

/* -------------------------------------------------------------------------- */
/*                              Gesture types                                 */
/* -------------------------------------------------------------------------- */

/** Recognized gesture kind. */
export type GestureKind = "tap" | "doubletap" | "longpress" | "swipe" | "pan" | "pinch";

/** Direction discriminator for swipe and pan gestures. */
export type GestureDirection = "up" | "down" | "left" | "right" | "none";

/** Axis lock for pan and swipe recognition. */
export type GestureAxisLock = "none" | "horizontal" | "vertical";

/* -------------------------------------------------------------------------- */
/*                              Gesture state                                 */
/* -------------------------------------------------------------------------- */

/**
 * Live gesture state snapshot. Exposed through the controller's
 * `state` getter and mirrored into the Alpine store.
 */
export interface GestureState {
  /** Whether a gesture is currently being tracked. */
  readonly active: boolean;
  /** The recognized gesture kind, or null when idle. */
  readonly kind: GestureKind | null;
  /** Current pointer position relative to the element. */
  readonly x: number;
  readonly y: number;
  /** Accumulated distance from the start point (px). */
  readonly distanceX: number;
  readonly distanceY: number;
  /** Total distance traveled (px). */
  readonly totalDistance: number;
  /** Current velocity (px/ms). */
  readonly velocityX: number;
  readonly velocityY: number;
  /** Number of active pointers (for pinch). */
  readonly pointerCount: number;
  /** Pinch scale factor (1 = no change). */
  readonly scale: number;
  /** Pinch rotation in degrees. */
  readonly rotation: number;
  /** Swipe direction when recognized. */
  readonly direction: GestureDirection;
}

/* -------------------------------------------------------------------------- */
/*                              Gesture options                               */
/* -------------------------------------------------------------------------- */

/**
 * Configuration options for the gesture controller. Every field is
 * optional — defaults are applied via `normalizeGestureOptions`.
 */
export interface GestureOptions {
  /** Stable identifier. Default: auto-generated. */
  readonly id?: string;
  /** Element to attach gesture recognition to. Can also be set via `attach()`. */
  readonly element?: Element;
  /** Enabled gesture kinds. Default: all gestures. */
  readonly gestures?: readonly GestureKind[];
  /** Tap distance threshold (px). Default: 10. */
  readonly tapThreshold?: number;
  /** Double-tap interval (ms). Default: 300. */
  readonly doubleTapInterval?: number;
  /** Long-press delay (ms). Default: 500. */
  readonly longPressDelay?: number;
  /** Minimum swipe distance (px). Default: 50. */
  readonly swipeThreshold?: number;
  /** Minimum swipe velocity (px/ms). Default: 0.3. */
  readonly swipeVelocity?: number;
  /** Minimum pan distance before recognition (px). Default: 10. */
  readonly panThreshold?: number;
  /** Axis lock for pan and swipe. Default: `'none'`. */
  readonly axisLock?: GestureAxisLock;
  /** Pinch distance threshold (px) before recognition. Default: 10. */
  readonly pinchThreshold?: number;
  /** Whether to prevent default on recognized gestures. Default: `false`. */
  readonly preventDefault?: boolean;
  /** Whether to capture the pointer for reliable tracking. Default: `true`. */
  readonly capturePointer?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                              Event detail shapes                           */
/* -------------------------------------------------------------------------- */

/** Base detail shared by all gesture events. */
export interface GestureEventBase {
  readonly kind: GestureKind;
  readonly x: number;
  readonly y: number;
  readonly target: EventTarget | null;
}

/** Detail payload for tap events. */
export interface GestureTapDetail extends GestureEventBase {
  readonly kind: "tap";
}

/** Detail payload for double-tap events. */
export interface GestureDoubleTapDetail extends GestureEventBase {
  readonly kind: "doubletap";
}

/** Detail payload for long-press events. */
export interface GestureLongPressDetail extends GestureEventBase {
  readonly kind: "longpress";
}

/** Detail payload for swipe events. */
export interface GestureSwipeDetail extends GestureEventBase {
  readonly kind: "swipe";
  readonly direction: GestureDirection;
  readonly velocityX: number;
  readonly velocityY: number;
}

/** Detail payload for pan events. */
export interface GesturePanDetail extends GestureEventBase {
  readonly kind: "pan";
  /** Phase of the pan lifecycle. */
  readonly phase: "start" | "move" | "end";
  readonly distanceX: number;
  readonly distanceY: number;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly direction: GestureDirection;
}

/** Detail payload for pinch events. */
export interface GesturePinchDetail extends GestureEventBase {
  readonly kind: "pinch";
  /** Phase of the pinch lifecycle. */
  readonly phase: "start" | "move" | "end";
  readonly scale: number;
  readonly rotation: number;
  readonly distanceX: number;
  readonly distanceY: number;
}

/** Detail payload for the generic `gesture` event (fires for any recognized gesture). */
export interface GestureRecognizedDetail {
  readonly kind: GestureKind;
  readonly state: GestureState;
  readonly originalEvent: PointerEvent | null;
}

/** Detail payload for the `change` event (state transition). */
export interface GestureChangeDetail {
  readonly state: GestureState;
  readonly previous: GestureState | null;
}

/* -------------------------------------------------------------------------- */
/*                              Plugin contracts                              */
/* -------------------------------------------------------------------------- */

/**
 * Alpine-facing store surface. The integration fills it from
 * a {@link GestureController}; reads delegate to the controller's
 * getters and mutations go through the controller's semantic commands.
 */
export interface GestureStore {
  active: boolean;
  kind: GestureKind | null;
  x: number;
  y: number;
  distanceX: number;
  distanceY: number;
  totalDistance: number;
  velocityX: number;
  velocityY: number;
  pointerCount: number;
  scale: number;
  rotation: number;
  direction: GestureDirection;
  /** Manually cancel the current gesture. */
  cancel(): void;
}

/**
 * Public, framework-agnostic surface returned by the controller.
 */
export interface GestureManager {
  readonly id: string;
  readonly state: GestureState;
  readonly isTracking: boolean;
  mount(): void;
  destroy(): void;
  cancel(): void;
  /** Attach gesture recognition to a specific element. */
  attach(element: Element): void;
  /** Detach gesture recognition from the current element. */
  detach(): void;
}

/**
 * Typed view of `Alpine` the gesture plugin uses internally.
 */
export type GestureAlpine = Alpine<{ gesture: GestureStore }> & {
  cleanup?(callback: () => void): void;
};

/**
 * `Alpine.plugin()` callback signature.
 */
export type GesturePluginCallback = PluginCallback<AlpineBase>;
