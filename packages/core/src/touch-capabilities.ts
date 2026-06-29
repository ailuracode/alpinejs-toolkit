import { safeMatchMedia } from "./match-media.js";

export type TouchCapabilities = {
  readonly maxTouchPoints: number;
  readonly isTouch: boolean;
  readonly isCoarse: boolean;
  readonly isFine: boolean;
  readonly canHover: boolean;
};

/** Reads touch and pointer capability signals (SSR-safe). */
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
