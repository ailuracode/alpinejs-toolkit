/**
 * Strongly-typed event map for the gesture controller.
 */

import type {
  GestureChangeDetail,
  GestureDetailFor,
  GestureDetailMap,
  GestureKind,
  GestureRecognizedDetail,
} from "./types";

/**
 * Event map consumed by `BaseController<GestureEvents>`.
 */
export interface GestureEvents extends GestureDetailMap, Record<string, unknown> {
  change: GestureChangeDetail;
  gesture: GestureRecognizedDetail;
}

/** Subscriber callback for a gesture kind or lifecycle event. */
export type GestureListener<K extends keyof GestureEvents> = (detail: GestureEvents[K]) => void;

/** Subscriber callback shapes per event (backward-compatible aliases). */
export type GestureChangeListener = GestureListener<"change">;
export type GestureTapListener = GestureListener<"tap">;
export type GestureDoubleTapListener = GestureListener<"doubletap">;
export type GestureLongPressListener = GestureListener<"longpress">;
export type GestureSwipeListener = GestureListener<"swipe">;
export type GesturePanListener = GestureListener<"pan">;
export type GesturePinchListener = GestureListener<"pinch">;
export type GestureRecognizedListener = GestureListener<"gesture">;

/** Resolves the controller event name for a gesture kind. */
export type GestureEventNameFor<K extends GestureKind> = K;

/** Resolves the detail payload emitted on the named gesture channel. */
export type GestureChannelDetailFor<K extends GestureKind> = GestureDetailFor<K>;
