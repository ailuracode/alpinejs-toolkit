/**
 * Public entrypoint for `@ailuracode/alpine-gesture`.
 *
 * Per `.cursor/rules/new-package.mdc`, this file MUST only contain
 * re-exports. The framework-agnostic controller lives in
 * `./controller.ts`, the Alpine integration in `./plugin.ts`, and the
 * supporting types in `./types.ts` and `./events.ts`.
 *
 * Two ways to consume the package:
 *
 * 1. Standalone — `createGesture(element, options)` returns a mounted
 *    framework-agnostic controller. Use this in vanilla TypeScript or
 *    backend-rendered templates without Alpine.
 * 2. Alpine — `gesturePlugin(options)` returns an `Alpine.plugin()`
 *    callback that wires the controller into `$store.gesture`,
 *    `$gesture`, and the `x-gesture` directive.
 */

export type { Unsubscribe } from "@ailuracode/alpine-core";
// --- Controller (framework-agnostic) ---------------------------------
export { GESTURE_SINGLETON_KEY, GestureController } from "./controller.js";
export type { GestureErrorCode } from "./error.js";
// --- Error surface ---------------------------------------------------
export { GestureError } from "./error.js";
// --- Event surface ---------------------------------------------------
export type {
  GestureChangeListener,
  GestureChannelDetailFor,
  GestureDoubleTapListener,
  GestureEventNameFor,
  GestureEvents,
  GestureListener,
  GestureLongPressListener,
  GesturePanListener,
  GesturePinchListener,
  GestureRecognizedListener,
  GestureSwipeListener,
  GestureTapListener,
} from "./events.js";
// --- Options helpers -------------------------------------------------
export { gestureOptions } from "./options.js";
// --- Alpine integration ----------------------------------------------
export { createGesture, gesturePlugin, gesturePlugin as default } from "./plugin.js";
// --- Public types (state, contracts, options) ------------------------
export type {
  GestureAlpine,
  GestureAxisLock,
  GestureChangeDetail,
  GestureDetailFor,
  GestureDetailMap,
  GestureDirection,
  GestureDoubleTapDetail,
  GestureKind,
  GestureLongPressDetail,
  GestureManager,
  GestureMouseButton,
  GestureOptions,
  GesturePanDetail,
  GesturePhase,
  GesturePinchDetail,
  GesturePluginCallback,
  GesturePointerFields,
  GesturePointerType,
  GesturePointerTypeName,
  GestureRecognizedDetail,
  GestureState,
  GestureStore,
  GestureSwipeDetail,
  GestureTapDetail,
} from "./types.js";
