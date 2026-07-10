/**
 * Pure helpers for validating and normalizing toggle state.
 *
 * Kept side-effect free so the controller constructor can call them
 * without touching `window` / `document`. Mirrors the structure of
 * `@ailuracode/alpine-theme`'s `internal/validation` module — same
 * separation of concerns (pure logic in `internal/`, public surface
 * in `controller.ts`.
 */

/**
 * Whether `states` declares a third (independent) state. The
 * `indeterminate` key may be present with the value `undefined` —
 * that still counts as ternary because the consumer explicitly
 * expressed intent.
 */
export function hasIndeterminateState(states: {
  readonly on: unknown;
  readonly off: unknown;
  readonly indeterminate?: unknown;
}): boolean {
  return "indeterminate" in states;
}

/**
 * Resolves the initial value when the consumer omitted it.
 *
 * - Binary → `on` (the first declared extreme).
 * - Ternary → `indeterminate` (the consumer signalled "start
 *   neutral" by adding the third state).
 */
export function resolveInitial<TOn, TOff, TIndet>(
  states: {
    readonly on: TOn;
    readonly off: TOff;
    readonly indeterminate?: TIndet;
  },
  explicit: TOn | TOff | TIndet | undefined
): TOn | TOff | TIndet {
  if (explicit !== undefined) {
    return explicit;
  }
  if (hasIndeterminateState(states)) {
    return (states as { readonly indeterminate: TIndet }).indeterminate;
  }
  return states.on;
}

/**
 * Whether `candidate` matches one of the configured state values.
 * Strict equality — preserves `undefined` as a valid third state
 * when the consumer explicitly chose it.
 */
export function isConfiguredState<TOn, TOff, TIndet>(
  states: {
    readonly on: TOn;
    readonly off: TOff;
    readonly indeterminate?: TIndet;
  },
  candidate: unknown
): candidate is TOn | TOff | TIndet {
  if (candidate === states.on || candidate === states.off) {
    return true;
  }
  if (hasIndeterminateState(states)) {
    return candidate === (states as { readonly indeterminate: TIndet }).indeterminate;
  }
  return false;
}

/**
 * Builds the ordered list of states used by `next()`.
 *
 * Binary → `[on, off]`. Ternary → `[on, off, indeterminate]`.
 * Order matches declaration order in the consumer's `states` object,
 * so the cycle is predictable from the call site.
 */
export function buildStateCycle<TOn, TOff, TIndet>(states: {
  readonly on: TOn;
  readonly off: TOff;
  readonly indeterminate?: TIndet;
}): readonly (TOn | TOff | TIndet)[] {
  if (hasIndeterminateState(states)) {
    return [states.on, states.off, (states as { readonly indeterminate: TIndet }).indeterminate];
  }
  return [states.on, states.off];
}
