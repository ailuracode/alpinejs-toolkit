/**
 * Strongly-typed event map for the gesture controller.
 */

import type {
  GestureChangeDetail,
  GestureDoubleTapDetail,
  GestureLongPressDetail,
  GesturePanDetail,
  GesturePinchDetail,
  GestureRecognizedDetail,
  GestureSwipeDetail,
  GestureTapDetail,
} from "./types";

/**
 * Event map consumed by `BaseController<GestureEvents>`.
 */
export interface GestureEvents extends Record<string, unknown> {
  change: GestureChangeDetail;
  tap: GestureTapDetail;
  doubletap: GestureDoubleTapDetail;
  longpress: GestureLongPressDetail;
  swipe: GestureSwipeDetail;
  pan: GesturePanDetail;
  pinch: GesturePinchDetail;
  gesture: GestureRecognizedDetail;
}

/** Subscriber callback shapes per event. */
export type GestureChangeListener = (detail: GestureChangeDetail) => void;
export type GestureTapListener = (detail: GestureTapDetail) => void;
export type GestureDoubleTapListener = (detail: GestureDoubleTapDetail) => void;
export type GestureLongPressListener = (detail: GestureLongPressDetail) => void;
export type GestureSwipeListener = (detail: GestureSwipeDetail) => void;
export type GesturePanListener = (detail: GesturePanDetail) => void;
export type GesturePinchListener = (detail: GesturePinchDetail) => void;
export type GestureRecognizedListener = (detail: GestureRecognizedDetail) => void;
