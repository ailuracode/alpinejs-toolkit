/**
 * Alpine.reactive shells for toggle controllers.
 *
 * Headless controllers keep state in private fields. Alpine tracks plain
 * object properties, so the plugin builds a reactive shell that delegates
 * commands to the controller and mirrors `value` after mutations and
 * change notifications.
 */

import type { Unsubscribe } from "@ailuracode/alpine-core";
import type { ToggleStatesView } from "../types.js";

/** Minimal Alpine surface required to build reactive toggle views. */
export interface AlpineReactiveHost {
  reactive<T extends object>(value: T): T;
}

function mirrorValue<T>(view: { value: T }, controller: { readonly value: T }): void {
  view.value = controller.value;
}

/** Boolean Puppy shell — no change subscription, sync after each command. */
export function bridgeBooleanToggleToAlpine(
  Alpine: AlpineReactiveHost,
  controller: {
    readonly value: boolean;
    set(value: boolean): void;
    toggle(): boolean;
  }
): { value: boolean; set(value: boolean): void; toggle(): boolean } {
  let view!: { value: boolean; set(value: boolean): void; toggle(): boolean };

  const draft = {
    value: controller.value,
    set(value: boolean) {
      controller.set(value);
      mirrorValue(view, controller);
    },
    toggle() {
      const next = controller.toggle();
      mirrorValue(view, controller);
      return next;
    },
  };

  view = Alpine.reactive(draft);
  return view;
}

/** Doggo shell — mirrors `value` from `onChange` and after each command. */
export function bridgeDoggoToggleToAlpine<TA, TB, TN, V extends TA | TB | TN>(
  Alpine: AlpineReactiveHost,
  controller: {
    readonly value: V;
    readonly states: ToggleStatesView<TA, TB, TN>;
    is(candidate: V): boolean;
    set(value: V): void;
    toggle(): V;
    next(): V;
    reset(): V;
    onChange(listener: (detail: { current: V }) => void): Unsubscribe;
  }
): {
  value: V;
  states: ToggleStatesView<TA, TB, TN>;
  is(candidate: V): boolean;
  set(value: V): void;
  toggle(): V;
  next(): V;
  reset(): V;
} {
  let view!: {
    value: V;
    states: ToggleStatesView<TA, TB, TN>;
    is(candidate: V): boolean;
    set(value: V): void;
    toggle(): V;
    next(): V;
    reset(): V;
  };

  const draft = {
    value: controller.value,
    states: controller.states,
    is(candidate: V) {
      return controller.is(candidate);
    },
    set(value: V) {
      controller.set(value);
      mirrorValue(view, controller);
    },
    toggle() {
      const next = controller.toggle();
      mirrorValue(view, controller);
      return next;
    },
    next() {
      const next = controller.next();
      mirrorValue(view, controller);
      return next;
    },
    reset() {
      const next = controller.reset();
      mirrorValue(view, controller);
      return next;
    },
  };

  view = Alpine.reactive(draft);

  controller.onChange((detail) => {
    view.value = detail.current;
  });

  return view;
}

/** Big Dog shell — mirrors `value` from the typed `change` event and commands. */
export function bridgeToggleControllerToAlpine<TA, TB, TN, V extends TA | TB | TN>(
  Alpine: AlpineReactiveHost,
  controller: {
    readonly value: V;
    readonly states: ToggleStatesView<TA, TB, TN>;
    is(candidate: V): boolean;
    set(value: V): void;
    toggle(): V;
    next(): V;
    reset(): V;
    on(event: "change", listener: (detail: { current: TA | TB | TN }) => void): Unsubscribe;
  }
): {
  value: V;
  states: ToggleStatesView<TA, TB, TN>;
  is(candidate: V): boolean;
  set(value: V): void;
  toggle(): V;
  next(): V;
  reset(): V;
} {
  let view!: {
    value: V;
    states: ToggleStatesView<TA, TB, TN>;
    is(candidate: V): boolean;
    set(value: V): void;
    toggle(): V;
    next(): V;
    reset(): V;
  };

  const draft = {
    value: controller.value,
    states: controller.states,
    is(candidate: V) {
      return controller.is(candidate);
    },
    set(value: V) {
      controller.set(value);
      mirrorValue(view, controller);
    },
    toggle() {
      const next = controller.toggle();
      mirrorValue(view, controller);
      return next;
    },
    next() {
      const next = controller.next();
      mirrorValue(view, controller);
      return next;
    },
    reset() {
      const next = controller.reset();
      mirrorValue(view, controller);
      return next;
    },
  };

  view = Alpine.reactive(draft);

  controller.on("change", (detail) => {
    view.value = detail.current as V;
  });

  return view;
}
