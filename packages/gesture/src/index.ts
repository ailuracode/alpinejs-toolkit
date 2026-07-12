/**
 * Public entrypoint for `@ailuracode/alpine-gesture`.
 *
 * Exposes:
 * - `GestureController` — headless controller class.
 * - `gesturePlugin(options)` — Alpine adapter factory.
 * - `createGesture(element, options)` — standalone helper.
 * - All public types.
 */

export { createGestureStore } from "./alpine/store.js";
export { GESTURE_SINGLETON_KEY, GestureController } from "./controller.js";
export type { GestureErrorCode } from "./error.js";
// --- Error surface ---------------------------------------------------
export { GestureError, isGestureErrorCode } from "./error.js";
// --- Event surface ---------------------------------------------------
export type {
  GestureChangeListener,
  GestureDoubleTapListener,
  GestureEvents,
  GestureLongPressListener,
  GesturePanListener,
  GesturePinchListener,
  GestureRecognizedListener,
  GestureSwipeListener,
  GestureTapListener,
} from "./events.js";
export { createGesture, gesturePlugin, gesturePlugin as default } from "./plugin.js";
// --- Public types ----------------------------------------------------
export type {
  GestureAlpine,
  GestureAxisLock,
  GestureChangeDetail,
  GestureDirection,
  GestureDoubleTapDetail,
  GestureKind,
  GestureLongPressDetail,
  GestureManager,
  GestureOptions,
  GesturePanDetail,
  GesturePinchDetail,
  GesturePluginCallback,
  GestureRecognizedDetail,
  GestureState,
  GestureStore,
  GestureSwipeDetail,
  GestureTapDetail,
} from "./types.js";
