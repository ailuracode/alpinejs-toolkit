/**
 * Alpine.js integration for `@ailuracode/alpine-gesture`.
 *
 * Thin adapter that wires {@link GestureController} into
 * `$store.gesture` and the `$gesture` magic. Also registers the
 * `x-gesture` directive for declarative element binding.
 *
 * The `x-gesture` directive accepts a gesture kind (or comma-separated
 * list) and calls the named method in the component scope:
 *
 * ```html
 * <div x-data="{ onSwipe(d) { ... } }"
 *      x-gesture:swipe="onSwipe">
 * ```
 */

import type { Alpine } from "alpinejs";
import { createGestureStore, syncGestureStore } from "./alpine/store";
import { GestureController } from "./controller";
import type {
  GestureAlpine,
  GestureChangeDetail,
  GestureKind,
  GestureOptions,
  GesturePluginCallback,
  GestureStore,
} from "./types";

const GESTURE_STORE_KEY = "gesture";

type DirectiveArg = {
  expression: string;
  modifiers: string[];
};
type DirectiveUtilities = {
  cleanup: (cb: () => void) => void;
  effect: (cb: () => void) => void;
  evaluateLater: (expression: string) => (receiver?: () => void, extras?: { scope?: Record<string, unknown>; params?: unknown[] }) => void;
};

function createDirectiveHandler(
  pluginOptions: GestureOptions
): (el: Element, arg: DirectiveArg, utilities: DirectiveUtilities) => void {
  return (el, { expression, modifiers }, { cleanup, evaluateLater }) => {
    const kind = modifiers[0] as GestureKind | undefined;
    if (!kind) {
      return;
    }

    const ctrl = new GestureController({
      ...pluginOptions,
      gestures: [kind],
      element: el,
    });
    ctrl.mount();

    const evaluateGesture = evaluateLater(expression);

    const unsub = ctrl.on(
      "gesture" as never,
      ((detail: { kind: GestureKind }) => {
        if (detail.kind === kind) {
          evaluateGesture(() => {}, { scope: { $event: detail }, params: [detail] });
        }
        el.dispatchEvent(new CustomEvent(kind, { bubbles: true, detail }));
      }) as never
    );

    cleanup(() => {
      unsub();
      ctrl.destroy();
    });
  };
}

/**
 * Plugin factory — returns the `Alpine.plugin()` callback.
 */
export function gesturePlugin(options: GestureOptions = {}): GesturePluginCallback {
  return function registerGesture(alpine: Alpine): void {
    const Alpine = alpine as unknown as GestureAlpine;
    const controller = new GestureController(options);

    const store = createGestureStore(controller);
    Alpine.store(GESTURE_STORE_KEY, store);
    const reactiveStore = Alpine.store(GESTURE_STORE_KEY);

    const unsubscribe = controller.on("change", (detail: GestureChangeDetail) => {
      syncGestureStore(reactiveStore as GestureStore, detail.state);
    });

    // Register the x-gesture directive for declarative element binding.
    Alpine.directive?.("gesture" as never, createDirectiveHandler(options) as never);

    Alpine.magic(GESTURE_STORE_KEY, () => reactiveStore);

    if (typeof Alpine.cleanup === "function") {
      Alpine.cleanup(() => {
        unsubscribe();
        controller.destroy();
      });
    }
  };
}

/**
 * Creates a standalone gesture controller (non-Alpine usage).
 * Mount it on an element to start recognition.
 */
export function createGesture(element: Element, options: GestureOptions = {}): GestureController {
  const controller = new GestureController({ ...options, element });
  controller.mount();
  return controller;
}

export type { GestureOptions, GestureState, GestureStore } from "./types";
