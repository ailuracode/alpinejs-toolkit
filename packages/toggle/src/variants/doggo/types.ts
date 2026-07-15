import type { PluginCallback, Unsubscribe } from "@ailuracode/alpine-core";
import type { Alpine as AlpineBase } from "alpinejs";
import type { BaseToggle } from "../../internal/base-types.js";
import type { ToggleBinaryStates, ToggleStatesView } from "../../types.js";

/** Options accepted by {@link createDoggoToggle} / `$toggle(options)`. */
export interface DoggoToggleOptions<TA, TB, TN = undefined> {
  readonly states: ToggleBinaryStates<TA, TB> & { readonly indeterminate?: TN };
  readonly initial?: TA | TB | TN;
}

/** Detail payload for {@link DoggoToggleInstance.onChange}. */
export interface DoggoToggleChangeDetail<V> {
  readonly current: V;
  readonly previous: V | null;
}

/**
 * Balanced toggle instance — custom states, cycling, reset, and a
 * lightweight change subscription without Big Dog lifecycle.
 */
export interface DoggoToggleInstance<TA, TB, TN, V> extends BaseToggle<V> {
  readonly states: ToggleStatesView<TA, TB, TN>;
  is(candidate: V): boolean;
  next(): V;
  reset(): V;
  onChange(listener: (detail: DoggoToggleChangeDetail<V>) => void): Unsubscribe;
}

/** Options accepted by the {@link doggoTogglePlugin} factory. */
export interface DoggoTogglePluginOptions {
  readonly id?: string;
}

/** `Alpine.plugin()` callback signature for the Doggo variant. */
export type DoggoTogglePluginCallback = PluginCallback<AlpineBase>;
