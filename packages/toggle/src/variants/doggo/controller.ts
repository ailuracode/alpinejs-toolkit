/**
 * Doggo toggle — balanced controller with custom states and
 * lightweight subscriptions, without Big Dog lifecycle or event bus.
 */

import type { Unsubscribe } from "@ailuracode/alpine-core";
import { resolveBinaryToggleTarget, resolveNextInCycle } from "../../internal/transitions.js";
import {
  buildStateCycle,
  hasIndeterminateState,
  isConfiguredState,
  resolveInitial,
} from "../../internal/validation.js";
import type { ToggleStatesView } from "../../types.js";
import type { DoggoToggleChangeDetail, DoggoToggleInstance, DoggoToggleOptions } from "./types.js";

export class DoggoToggle<TA, TB, TN, V extends TA | TB | TN = TA | TB | TN>
  implements DoggoToggleInstance<TA, TB, TN, V>
{
  readonly #states: ToggleStatesView<TA, TB, TN>;
  readonly #cycle: readonly (TA | TB | TN)[];
  readonly #initial: TA | TB | TN;
  readonly #listeners = new Set<(detail: DoggoToggleChangeDetail<V>) => void>();

  #value: TA | TB | TN;

  constructor(options: DoggoToggleOptions<TA, TB, TN>) {
    const hasTernary = hasIndeterminateState(options.states);
    const indeterminate = (
      hasTernary ? (options.states as { readonly indeterminate: TN }).indeterminate : undefined
    ) as TN;

    this.#states = Object.freeze({
      on: options.states.on,
      off: options.states.off,
      indeterminate,
    });

    this.#cycle = Object.freeze(buildStateCycle(options.states).slice()) as readonly (
      | TA
      | TB
      | TN
    )[];

    this.#initial = resolveInitial(options.states, options.initial) as TA | TB | TN;
    this.#value = this.#initial;
  }

  get value(): V {
    return this.#value as V;
  }

  get states(): ToggleStatesView<TA, TB, TN> {
    return this.#states;
  }

  is(candidate: V): boolean {
    return this.#value === candidate;
  }

  set(value: V): void {
    if (!isConfiguredState(this.#states, value) || this.#value === value) {
      return;
    }
    this.#applyChange(value as TA | TB | TN);
  }

  toggle(): V {
    const next = resolveBinaryToggleTarget(this.#value, this.#states);
    if (next !== this.#value) {
      this.#applyChange(next);
    }
    return next as V;
  }

  next(): V {
    const next = resolveNextInCycle(this.#cycle, this.#value);
    if (next !== this.#value) {
      this.#applyChange(next);
    }
    return next as V;
  }

  reset(): V {
    if (this.#initial !== this.#value) {
      this.#applyChange(this.#initial);
    }
    return this.#initial as V;
  }

  onChange(listener: (detail: DoggoToggleChangeDetail<V>) => void): Unsubscribe {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  #applyChange(next: TA | TB | TN): void {
    const previous = this.#value;
    this.#value = next;
    const detail: DoggoToggleChangeDetail<V> = {
      current: next as V,
      previous: previous as V,
    };
    for (const listener of this.#listeners) {
      listener(detail);
    }
  }
}

export function createDoggoToggle<TA, TB>(
  options: DoggoToggleOptions<TA, TB, undefined>
): DoggoToggle<TA, TB, undefined, TA | TB>;
export function createDoggoToggle<TA, TB, TN>(
  options: DoggoToggleOptions<TA, TB, TN>
): DoggoToggle<TA, TB, TN, TA | TB | TN>;
export function createDoggoToggle<TA, TB, TN>(
  options: DoggoToggleOptions<TA, TB, TN>
): DoggoToggle<TA, TB, TN, TA | TB | TN> {
  return new DoggoToggle<TA, TB, TN, TA | TB | TN>(options);
}
