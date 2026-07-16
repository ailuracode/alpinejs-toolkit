/**
 * Public type contracts for `@ailuracode/alpine-gesture`.
 *
 * The gesture package recognizes six pointer-driven gestures:
 * tap, double-tap, long-press, swipe, pan, and pinch. Each
 * gesture is driven through explicit pointer-event inputs and
 * exposes a deterministic recognition lifecycle.
 */

import type { Alpine as AlpineBase } from "alpinejs";
import type { Alpine, PluginCallback } from "./core-deps.js";

/* -------------------------------------------------------------------------- */
/*                              Gesture types                                 */
/* -------------------------------------------------------------------------- */

/** Recognized gesture kind. */
export type GestureKind = "tap" | "doubletap" | "longpress" | "swipe" | "pan" | "pinch";

/** Direction discriminator for swipe and pan gestures. */
export type GestureDirection = "up" | "down" | "left" | "right" | "none";

/** Axis lock for pan and swipe recognition. */
export type GestureAxisLock = "none" | "horizontal" | "vertical";

/** Lifecycle phase for continuous gestures (`pan`, `pinch`). */
export type GesturePhase = "start" | "move" | "end";

/**
 * Pointer button index from `PointerEvent.button`.
 * `0` = primary (left), `1` = auxiliary (middle), `2` = secondary (right).
 */
export type GestureMouseButton = 0 | 1 | 2 | 3 | 4;

/** Known `PointerEvent.pointerType` values. Additional strings are preserved at runtime. */
export type GesturePointerType = "mouse" | "touch" | "pen";

/** Pointer modality — known values plus future DOM strings. */
export type GesturePointerTypeName = GesturePointerType | (string & {});

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
  /** Button that initiated the active gesture (`PointerEvent.button`). */
  readonly button: GestureMouseButton;
  /** Active button bitmask (`PointerEvent.buttons`). */
  readonly buttons: number;
  /** Pointer modality (`PointerEvent.pointerType`). */
  readonly pointerType: GesturePointerTypeName;
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
  /**
   * Mouse buttons that may start gesture recognition. Default: `[0]` (primary /
   * left only). Touch and pen pointers always report button `0`, so the default
   * includes mobile input without extra configuration.
   */
  readonly mouseButtons?: readonly GestureMouseButton[];
  /**
   * `$store` key the Alpine plugin registers under. Defaults to
   * {@link DEFAULT_GESTURE_STORE_KEY}. Set when the host already owns
   * a `gesture` store or another toolkit plugin would collide on that
   * name — the rename avoids the collision without touching the
   * controller. Ignored by the standalone `createGesture` factory.
   */
  readonly storeKey?: string;
  /**
   * `$gesture` magic key the Alpine plugin registers under. Defaults
   * to {@link DEFAULT_GESTURE_MAGIC_KEY}, or to `storeKey` when that
   * is renamed (the magic follows the store so consumers only rename
   * one). Ignored by the standalone factory.
   */
  readonly magicKey?: string;
  /**
   * Directive key the `Alpine.directive()` call uses. Defaults to
   * `"gesture"`, matching the `x-gesture` markup. Renaming it lets
   * hosts with an existing `gesture` Alpine directive move the
   * integration without forking the controller.
   */
  readonly directiveKey?: string;
}

/** Default `$store` key registered by {@link gesturePlugin}. */
export const DEFAULT_GESTURE_STORE_KEY = "gesture";

/** Default `$gesture` magic key registered by {@link gesturePlugin}. */
export const DEFAULT_GESTURE_MAGIC_KEY = "gesture";

/** Default `x-gesture` directive key registered by {@link gesturePlugin}. */
export const DEFAULT_GESTURE_DIRECTIVE_KEY = "gesture";

/* -------------------------------------------------------------------------- */
/*                              Event detail shapes                           */
/* -------------------------------------------------------------------------- */

/** Pointer metadata shared by all gesture event payloads. */
export interface GesturePointerFields {
  readonly x: number;
  readonly y: number;
  readonly target: EventTarget | null;
  readonly button: GestureMouseButton;
  readonly buttons: number;
  readonly pointerType: GesturePointerTypeName;
}

/** Base detail shared by all gesture events, narrowed by kind. */
export type GestureEventBase<K extends GestureKind = GestureKind> = GesturePointerFields & {
  readonly kind: K;
};

/** Detail payload for tap events. */
export type GestureTapDetail = GestureEventBase<"tap">;

/** Detail payload for double-tap events. */
export type GestureDoubleTapDetail = GestureEventBase<"doubletap">;

/** Detail payload for long-press events. */
export type GestureLongPressDetail = GestureEventBase<"longpress">;

/** Detail payload for swipe events. */
export interface GestureSwipeDetail extends GestureEventBase<"swipe"> {
  readonly direction: GestureDirection;
  readonly velocityX: number;
  readonly velocityY: number;
}

/** Detail payload for pan events. */
export interface GesturePanDetail extends GestureEventBase<"pan"> {
  readonly phase: GesturePhase;
  readonly distanceX: number;
  readonly distanceY: number;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly direction: GestureDirection;
}

/** Detail payload for pinch events. */
export interface GesturePinchDetail extends GestureEventBase<"pinch"> {
  readonly phase: GesturePhase;
  readonly scale: number;
  readonly rotation: number;
  readonly distanceX: number;
  readonly distanceY: number;
}

/** Maps each gesture kind to its detail payload. */
export interface GestureDetailMap {
  readonly tap: GestureTapDetail;
  readonly doubletap: GestureDoubleTapDetail;
  readonly longpress: GestureLongPressDetail;
  readonly swipe: GestureSwipeDetail;
  readonly pan: GesturePanDetail;
  readonly pinch: GesturePinchDetail;
}

/** Resolves the detail payload for a gesture kind. */
export type GestureDetailFor<K extends GestureKind> = GestureDetailMap[K];

/**
 * Detail payload for the generic `gesture` event (fires for any recognized
 * gesture). Discriminated by `kind` so handlers can narrow on the gesture type.
 */
export type GestureRecognizedDetail = {
  [K in GestureKind]: GestureDetailMap[K] & {
    readonly state: GestureState;
    readonly originalEvent: PointerEvent | null;
  };
}[GestureKind];

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
export type GestureStore = {
  [K in keyof GestureState]: GestureState[K];
} & {
  /** Manually cancel the current gesture. */
  cancel(): void;
};

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
