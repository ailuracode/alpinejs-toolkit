import type AlpineType from "alpinejs";

export interface TouchMagic {
  isTouch: boolean;
  isCoarse: boolean;
  isFine: boolean;
  canHover: boolean;
  maxTouchPoints: number;
}

function readTouchState(): TouchMagic {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const hover = window.matchMedia("(hover: hover)").matches;
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const hasTouchEvents = "ontouchstart" in window;

  return {
    isTouch: coarse || maxTouchPoints > 0 || hasTouchEvents,
    isCoarse: coarse,
    isFine: window.matchMedia("(pointer: fine)").matches,
    canHover: hover,
    maxTouchPoints,
  };
}

/** Alpine.js touch plugin. Registers reactive magic `$touch`. */
export default function touchPlugin(Alpine: AlpineType.Alpine): void {
  const state = Alpine.reactive(readTouchState());

  Alpine.magic("touch", () => state);

  const update = () => Object.assign(state, readTouchState());

  window.matchMedia("(pointer: coarse)").addEventListener("change", update);
  window.matchMedia("(pointer: fine)").addEventListener("change", update);
  window.matchMedia("(hover: hover)").addEventListener("change", update);
}

declare global {
  namespace Alpine {
    interface Magics<T> {
      $touch: TouchMagic;
    }
  }
}
