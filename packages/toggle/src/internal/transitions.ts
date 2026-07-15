export interface ToggleStates<TOn, TOff, TIndeterminate = undefined> {
  readonly on: TOn;
  readonly off: TOff;
  readonly indeterminate?: TIndeterminate;
}

export function buildStateCycle<TOn, TOff, TIndeterminate>(
  states: ToggleStates<TOn, TOff, TIndeterminate>
): readonly (TOn | TOff | TIndeterminate)[] {
  const cycle =
    "indeterminate" in states
      ? [
          states.on,
          states.off,
          (states as { readonly indeterminate: TIndeterminate }).indeterminate,
        ]
      : [states.on, states.off];
  return Object.freeze(cycle);
}

export function resolveToggleTarget<TOn, TOff, TIndeterminate>(
  value: TOn | TOff | TIndeterminate,
  states: ToggleStates<TOn, TOff, TIndeterminate>,
  hasTernary: boolean
): TOn | TOff {
  if (
    hasTernary &&
    value === (states as { readonly indeterminate: TIndeterminate }).indeterminate
  ) {
    return states.on;
  }
  return value === states.on ? states.off : states.on;
}

export function resolveNextCycle<T>(value: T, cycle: readonly T[]): T {
  const index = cycle.indexOf(value);
  return cycle[(index + 1) % cycle.length] as T;
}
