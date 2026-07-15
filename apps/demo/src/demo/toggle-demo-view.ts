/**
 * Bridges headless toggle controllers to plain Alpine-friendly view objects.
 *
 * Controllers keep state in private fields, so the demo copies `value` onto a
 * reactive view object after every mutation.
 */

export type BooleanToggleView = {
  value: boolean;
  set(value: boolean): void;
  toggle(): boolean;
};

export type StatefulToggleView<T> = {
  value: T;
  states: {
    readonly on: T;
    readonly off: T;
    readonly indeterminate: T | undefined;
  };
  is(candidate: T): boolean;
  set(value: T): void;
  toggle(): T;
  next(): T;
  reset(): T;
};

type BooleanToggleController = {
  readonly value: boolean;
  set(value: boolean): void;
  toggle(): boolean;
};

type StatefulToggleController<T> = {
  readonly value: T;
  readonly states: StatefulToggleView<T>["states"];
  is(candidate: T): boolean;
  set(value: T): void;
  toggle(): T;
  next(): T;
  reset(): T;
};

export function bridgeBooleanToggle(controller: BooleanToggleController): BooleanToggleView {
  const view: BooleanToggleView = {
    value: controller.value,
    set(value) {
      controller.set(value);
      view.value = controller.value;
    },
    toggle() {
      view.value = controller.toggle();
      return view.value;
    },
  };

  return view;
}

export function bridgeStatefulToggle<T>(
  controller: StatefulToggleController<T>
): StatefulToggleView<T> {
  const view: StatefulToggleView<T> = {
    value: controller.value,
    states: controller.states,
    is(candidate) {
      return view.value === candidate;
    },
    set(value) {
      controller.set(value);
      view.value = controller.value;
    },
    toggle() {
      view.value = controller.toggle();
      return view.value;
    },
    next() {
      view.value = controller.next();
      return view.value;
    },
    reset() {
      view.value = controller.reset();
      return view.value;
    },
  };

  return view;
}
