/// <reference types="@types/alpinejs" />

import type { GestureOptions, GesturePluginCallback, GestureState, GestureStore } from "./types";

export type {
  GestureAlpine,
  GestureChangeDetail,
  GestureDetailFor,
  GestureDetailMap,
  GestureDoubleTapDetail,
  GestureKind,
  GestureLongPressDetail,
  GestureOptions,
  GesturePanDetail,
  GesturePhase,
  GesturePinchDetail,
  GesturePluginCallback,
  GesturePointerType,
  GesturePointerTypeName,
  GestureRecognizedDetail,
  GestureState,
  GestureStore,
  GestureSwipeDetail,
  GestureTapDetail,
} from "./types";

export interface GestureStoreShape {
  readonly active: boolean;
  readonly kind: GestureState["kind"];
  readonly x: number;
  readonly y: number;
  readonly distanceX: number;
  readonly distanceY: number;
  readonly totalDistance: number;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly pointerCount: number;
  readonly scale: number;
  readonly rotation: number;
  readonly direction: GestureState["direction"];
  readonly button: import("./types").GestureMouseButton;
  readonly buttons: number;
  readonly pointerType: import("./types").GesturePointerTypeName;
  cancel(): void;
}

export function createGesture(
  element: Element,
  options?: GestureOptions
): import("./controller").GestureController;

export default function gesturePlugin(options?: GestureOptions): GesturePluginCallback;

declare global {
  namespace Alpine {
    interface Stores {
      gesture: GestureStore;
    }
    interface Magics<T> {
      $gesture: GestureStore;
    }
  }
}
