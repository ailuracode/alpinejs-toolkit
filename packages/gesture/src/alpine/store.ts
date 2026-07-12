/**
 * Alpine store builder for `@ailuracode/alpine-gesture`.
 *
 * Pure helper that creates the store object from a controller. The
 * plugin adapter writes to the Alpine reactive proxy; this module
 * provides the initial shape.
 */

import type { GestureController } from "../controller";
import type { GestureState, GestureStore } from "../types";

export function createGestureStore(controller: GestureController): GestureStore {
  const initial = controller.state;
  return {
    active: initial.active,
    kind: initial.kind,
    x: initial.x,
    y: initial.y,
    distanceX: initial.distanceX,
    distanceY: initial.distanceY,
    totalDistance: initial.totalDistance,
    velocityX: initial.velocityX,
    velocityY: initial.velocityY,
    pointerCount: initial.pointerCount,
    scale: initial.scale,
    rotation: initial.rotation,
    direction: initial.direction,
    cancel() {
      controller.cancel();
    },
  };
}

export function syncGestureStore(store: GestureStore, state: GestureState): void {
  store = store as MutableGestureStore;
  store.active = state.active;
  store.kind = state.kind;
  store.x = state.x;
  store.y = state.y;
  store.distanceX = state.distanceX;
  store.distanceY = state.distanceY;
  store.totalDistance = state.totalDistance;
  store.velocityX = state.velocityX;
  store.velocityY = state.velocityY;
  store.pointerCount = state.pointerCount;
  store.scale = state.scale;
  store.rotation = state.rotation;
  store.direction = state.direction;
}

/** Mutable view for internal writes. */
interface MutableGestureStore extends GestureStore {
  active: boolean;
  kind: GestureState["kind"];
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
  direction: GestureState["direction"];
}
