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
import { GestureController } from "./controller";
import type {
  GestureAlpine,
  GestureChangeDetail,
  GestureKind,
  GestureMouseButton,
  GestureOptions,
  GesturePluginCallback,
  GesturePointerTypeName,
  GestureRecognizedDetail,
  GestureState,
  GestureStore,
} from "./types";

const GESTURE_STORE_KEY = "gesture";

/**
 * Mutable view of {@link GestureStore} used by the adapter to write
 * state into the Alpine reactive proxy. The public store type keeps
 * all fields `readonly`; the adapter needs to assign during sync.
 */
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
  button: GestureMouseButton;
  buttons: number;
  pointerType: GesturePointerTypeName;
}

/**
 * Builds the initial `$store.gesture` surface from a controller. Pure
 * helper — does not touch Alpine. Adapter concern only.
 */
function createGestureStore(controller: GestureController): GestureStore {
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
    button: initial.button,
    buttons: initial.buttons,
    pointerType: initial.pointerType,
    cancel() {
      controller.cancel();
    },
  };
}

/**
 * Mirrors a controller state snapshot into the Alpine reactive store.
 */
function syncGestureStore(store: GestureStore, state: GestureState): void {
  const mutable = store as MutableGestureStore;
  mutable.active = state.active;
  mutable.kind = state.kind;
  mutable.x = state.x;
  mutable.y = state.y;
  mutable.distanceX = state.distanceX;
  mutable.distanceY = state.distanceY;
  mutable.totalDistance = state.totalDistance;
  mutable.velocityX = state.velocityX;
  mutable.velocityY = state.velocityY;
  mutable.pointerCount = state.pointerCount;
  mutable.scale = state.scale;
  mutable.rotation = state.rotation;
  mutable.direction = state.direction;
  mutable.button = state.button;
  mutable.buttons = state.buttons;
  mutable.pointerType = state.pointerType;
}

/**
 * Shape of the utilities object Alpine passes to directive handlers.
 * Only the fields we actually use are listed.
 */
type DirectiveUtilities = {
  cleanup: (cb: () => void) => void;
  evaluateLater: (
    expression: string
  ) => (receiver?: () => void, extras?: Record<string, unknown>) => void;
};

/**
 * Creates a directive handler that follows the exact same pattern as
 * Alpine's built-in `x-on` directive: cache the evaluator at init time
 * via `evaluateLater(el, expression)`, then call it with
 * `(receiver, { scope, params })` when a gesture fires.
 *
 * @see node_modules/alpinejs/src/directives/x-on.js
 */
function createDirectiveHandler(
  pluginOptions: GestureOptions
): (
  el: Element,
  arg: { value: string; expression: string },
  utilities: DirectiveUtilities
) => void {
  return (el, { value, expression }, { cleanup, evaluateLater }) => {
    const kind = value as GestureKind | undefined;
    if (!kind) {
      return;
    }

    // Cache the evaluator at init time — identical to x-on's pattern:
    //   let evaluate = evaluateLater(el, expression)
    //   evaluate(() => {}, { scope: { '$event': e }, params: [e] })
    // An empty expression is valid when consumers listen via @tap / addEventListener.
    const trimmedExpression = expression.trim();
    const evaluateGesture = trimmedExpression ? evaluateLater(expression) : null;

    const ctrl = new GestureController({
      ...pluginOptions,
      gestures: [kind],
      element: el,
    });
    ctrl.mount();

    const unsub = ctrl.on(
      "gesture" as never,
      ((detail: GestureRecognizedDetail) => {
        if (detail.kind === kind) {
          if (evaluateGesture) {
            // Mirror x-on's pattern: `evaluate(() => {}, …)` — the receiver
            // is intentionally a no-op because gesture handlers communicate
            // via CustomEvents, not return values.
            // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional no-op receiver, matches Alpine's x-on directive.
            evaluateGesture(() => {}, { scope: { $event: detail }, params: [detail] });
          }
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
    const reactiveStore = Alpine.store(GESTURE_STORE_KEY) as GestureStore;

    const unsubscribe = controller.on("change", (detail: GestureChangeDetail) => {
      syncGestureStore(reactiveStore, detail.state);
    });

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
