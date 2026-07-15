/**
 * Reactive Alpine-facing adapter for {@link ToggleController}.
 *
 * The controller stores state in JS private fields that Alpine's
 * reactive `Proxy` cannot intercept — this module bridges the
 * framework-agnostic controller to `Alpine.reactive` by building a
 * mutable facade whose commands delegate to the controller and route
 * every transition through a single `view.value = …` write so Alpine
 * re-renders on each transition.
 */

import type { ToggleController } from "../controller";
import type {
  ToggleChangeDetail,
  ToggleReactiveView,
  ToggleReactiveViewValue,
  Writable,
} from "../types";

export function buildReactiveToggleView<TA, TB, TN>(
  controller: ToggleController<TA, TB, TN, ToggleReactiveView<TA, TB, TN>["value"]>
): ToggleReactiveView<TA, TB, TN> {
  return {
    id: controller.id,
    // Lifecycle getters — always reflect the controller's current state.
    get isMounted(): boolean {
      return controller.isMounted;
    },
    get isDestroyed(): boolean {
      return controller.isDestroyed;
    },
    value: controller.value,
    states: controller.states,
    is(candidate) {
      return controller.is(candidate);
    },
    set(value) {
      controller.set(value);
    },
    toggle() {
      return controller.toggle();
    },
    next() {
      return controller.next();
    },
    reset() {
      return controller.reset();
    },
    // `setSilently` doesn't emit a `change` event (hydration contract),
    // so we write `this.value` directly — the bridge won't fire.
    setSilently(this: Writable<ToggleReactiveView<TA, TB, TN>>, value) {
      controller.setSilently(value);
      this.value = controller.value;
    },
  };
}

/**
 * Routes a controller `change` event onto the Alpine-facing facade.
 * Closes over the reactive proxy so external mutations still trigger
 * Alpine's `set` trap.
 *
 * The single `as` cast on the right-hand side collapses the
 * controller's wide `TA | TB | TN` union into the facade's narrowed
 * {@link ToggleReactiveViewValue} — sound at runtime because the
 * controller never stores a value outside the configured states.
 */
export function syncReactiveToggleView<TA, TB, TN>(
  view: Writable<ToggleReactiveView<TA, TB, TN>>,
  detail: ToggleChangeDetail<TA, TB, TN>
): void {
  view.value = detail.current as ToggleReactiveViewValue<TA, TB, TN>;
}
