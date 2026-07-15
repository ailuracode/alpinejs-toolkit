/**
 * Pure transition helpers shared across toggle variants.
 *
 * Kept side-effect free and independently tree-shakeable so Puppy and
 * Doggo can import only what they need without pulling Big Dog runtime
 * code.
 */

import { hasIndeterminateState } from "./validation.js";

/**
 * Computes the next value for `toggle()`. From `indeterminate` the
 * target is `on`; otherwise flips between `on` and `off`.
 */
export function resolveBinaryToggleTarget<TOn, TOff, TIndet>(
  value: TOn | TOff | TIndet,
  states: { readonly on: TOn; readonly off: TOff; readonly indeterminate?: TIndet }
): TOn | TOff | TIndet {
  if (hasIndeterminateState(states) && value === states.indeterminate) {
    return states.on;
  }
  return value === states.on ? states.off : states.on;
}

/**
 * Advances to the next value in a pre-built cycle.
 */
export function resolveNextInCycle<T>(cycle: readonly T[], value: T): T {
  const idx = cycle.indexOf(value);
  return cycle[(idx + 1) % cycle.length] as T;
}
