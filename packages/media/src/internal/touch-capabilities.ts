/**
 * Touch / pointer capability snapshot used by `@ailuracode/alpine-media`.
 *
 * Lives under `internal/` because the data is only consumed inside the
 * media store. Other packages that need one-shot media-query reads go
 * through `safeMatchMedia` in `@ailuracode/alpine-core`.
 *
 * The returned object keeps the original field set (`maxTouchPoints`,
 * `isTouch`, `isCoarse`, `isFine`, `canHover`) so future media-store
 * getters can adopt the rest without a breaking change. Today only
 * `maxTouchPoints` is read by the store initializer.
 */

import { safeMatchMedia } from "@ailuracode/alpine-core";

export type TouchCapabilities = {
  readonly maxTouchPoints: number;
  readonly isTouch: boolean;
  readonly isCoarse: boolean;
  readonly isFine: boolean;
  readonly canHover: boolean;
};

export function readTouchCapabilities(): TouchCapabilities {
  const coarse = safeMatchMedia("(pointer: coarse)")?.matches ?? false;
  const fine = safeMatchMedia("(pointer: fine)")?.matches ?? false;
  const canHover = safeMatchMedia("(hover: hover)")?.matches ?? false;
  const maxTouchPoints = typeof navigator !== "undefined" ? navigator.maxTouchPoints || 0 : 0;
  const hasTouchEvents = typeof window !== "undefined" && "ontouchstart" in window;

  return {
    maxTouchPoints,
    isTouch: coarse || maxTouchPoints > 0 || hasTouchEvents,
    isCoarse: coarse,
    isFine: fine,
    canHover,
  };
}
