import { buildStateCycle, resolveNextCycle, resolveToggleTarget } from "../../internal/transitions";
import { hasIndeterminateState, isConfiguredState } from "../../internal/validation";
import type { DoggoToggle as DoggoToggleContract, DoggoValue, ToggleDoggoOptions } from "./types";

interface ChangeDetail<V> {
  readonly current: V;
  readonly previous: V | null;
}

export class DoggoToggle<TA, TB, TN = undefined, V = DoggoValue<TA, TB, TN>>
  implements DoggoToggleContract<V>
{
  #value: V;
  readonly #states: ToggleDoggoOptions<TA, TB, TN>["states"];
  readonly #initial: V;
  readonly #cycle: readonly V[];
  readonly #listeners = new Set<(detail: ChangeDetail<V>) => void>();

  constructor(options: ToggleDoggoOptions<TA, TB, TN>) {
    const states = options.states;
    this.#states = states;
    const initial = (
      options.initial !== undefined
        ? options.initial
        : hasIndeterminateState(states)
          ? states.indeterminate
          : states.on
    ) as V;
    if (!isConfiguredState(states, initial)) {
      throw Error("Invalid initial");
    }
    this.#initial = initial;
    this.#value = initial;
    this.#cycle = buildStateCycle(states) as readonly V[];
  }

  get value(): V {
    return this.#value;
  }

  is(candidate: V): boolean {
    return this.#value === candidate;
  }

  set(value: V): void {
    if (!isConfiguredState(this.#states, value) || value === this.#value) {
      return;
    }
    const detail = { current: value, previous: this.#value };
    this.#value = value;
    for (const listener of this.#listeners) {
      listener(detail);
    }
  }

  toggle(): V {
    const next = resolveToggleTarget(
      this.#value as TA | TB | TN,
      this.#states,
      hasIndeterminateState(this.#states)
    ) as V;
    this.set(next);
    return next;
  }

  next(): V {
    const next = resolveNextCycle(this.#value, this.#cycle);
    this.set(next);
    return next;
  }

  reset(): V {
    this.set(this.#initial);
    return this.#initial;
  }

  onChange(listener: (detail: ChangeDetail<V>) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
}
