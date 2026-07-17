import type { Unsubscribe } from "@ailuracode/alpine-core";
import type {
  ToggleChangeSource,
  ToggleEvents,
  ToggleInstance,
  ToggleOptions,
  ToggleStatesView,
} from "./types";

type ChangeListener<TA, TB, TN> = (detail: ToggleEvents<TA, TB, TN>["change"]) => void;

let toggleIdCounter = 0;

export class ToggleController<TA, TB, TN, V extends TA | TB | TN = TA | TB | TN>
  implements ToggleInstance<TA, TB, TN, V>
{
  readonly #id: string;
  readonly #states: ToggleStatesView<TA, TB, TN>;
  readonly #cycle: readonly (TA | TB | TN)[];
  readonly #initial: TA | TB | TN;
  readonly #hasTernary: boolean;
  readonly #isConfigured: (candidate: unknown) => boolean;

  #value: TA | TB | TN;
  #destroyed = false;
  #mounted = false;
  #listeners = new Set<ChangeListener<TA, TB, TN>>();

  constructor(options: ToggleOptions<TA, TB, TN>) {
    const states = options.states;
    const hasTernary = "indeterminate" in states;
    const on = states.on;
    const off = states.off;
    const indeterminate = (
      hasTernary ? (states as { readonly indeterminate: TN }).indeterminate : undefined
    ) as TN;

    this.#id = options.id ?? `toggle-${(++toggleIdCounter).toString(36)}`;
    this.#hasTernary = hasTernary;
    this.#states = Object.freeze({ on, off, indeterminate });
    this.#cycle = hasTernary ? [on, off, indeterminate] : [on, off];
    this.#initial =
      options.initial !== undefined ? options.initial : hasTernary ? indeterminate : on;
    this.#value = this.#initial;
    this.#isConfigured = (candidate) =>
      candidate === on || candidate === off || (hasTernary && candidate === indeterminate);
  }

  get id(): string {
    return this.#id;
  }

  get isDestroyed(): boolean {
    return this.#destroyed;
  }

  get isMounted(): boolean {
    return this.#mounted;
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

  on<K extends keyof ToggleEvents<TA, TB, TN>>(
    _: K,
    listener: (detail: ToggleEvents<TA, TB, TN>[K]) => void
  ): Unsubscribe {
    const l: ChangeListener<TA, TB, TN> = listener;
    this.#listeners.add(l);
    return () => {
      this.#listeners.delete(l);
    };
  }

  once<K extends keyof ToggleEvents<TA, TB, TN>>(
    _: K,
    listener: (detail: ToggleEvents<TA, TB, TN>[K]) => void
  ): Unsubscribe {
    const l: ChangeListener<TA, TB, TN> = listener;
    const wrap: ChangeListener<TA, TB, TN> = (detail) => {
      this.#listeners.delete(wrap);
      l(detail);
    };
    this.#listeners.add(wrap);
    return () => {
      this.#listeners.delete(wrap);
    };
  }

  off<K extends keyof ToggleEvents<TA, TB, TN>>(
    _: K,
    listener: (detail: ToggleEvents<TA, TB, TN>[K]) => void
  ): void {
    this.#listeners.delete(listener);
  }

  removeAllListeners(): void {
    this.#listeners.clear();
  }

  set(value: V): void {
    if (this.#destroyed) {
      return;
    }
    if (!this.#isConfigured(value)) {
      return;
    }
    if (this.#value === value) {
      return;
    }
    this.#applySet(value, "user");
  }

  setSilently(value: V): void {
    if (this.#destroyed) {
      return;
    }
    if (!this.#isConfigured(value)) {
      return;
    }
    this.#value = value;
  }

  toggle(): V {
    if (this.#destroyed) {
      return this.#value as V;
    }
    const cur = this.#value;
    const next =
      this.#hasTernary && cur === this.#states.indeterminate
        ? this.#states.on
        : cur === this.#states.on
          ? this.#states.off
          : this.#states.on;
    if (next !== cur) {
      this.#applySet(next, "user");
    }
    return next as V;
  }

  next(): V {
    if (this.#destroyed) {
      return this.#value as V;
    }
    const idx = this.#cycle.indexOf(this.#value);
    const nextValue = this.#cycle[(idx + 1) % this.#cycle.length];
    if (nextValue !== this.#value) {
      this.#applySet(nextValue, "user");
    }
    return nextValue as V;
  }

  reset(): V {
    if (this.#destroyed) {
      return this.#value as V;
    }
    if (this.#initial !== this.#value) {
      this.#applySet(this.#initial, "reset");
    }
    return this.#initial as V;
  }

  mount(): void {
    if (this.#destroyed || this.#mounted) {
      return;
    }
    this.#mounted = true;
    queueMicrotask(() => {
      if (this.#destroyed) {
        return;
      }
      this.#emit({ current: this.#value, previous: null, source: "initialization" });
    });
  }

  destroy(): void {
    if (this.#destroyed) {
      return;
    }
    this.#destroyed = true;
    this.#listeners.clear();
  }

  #emit(detail: ToggleEvents<TA, TB, TN>["change"]): void {
    for (const listener of this.#listeners) {
      listener(detail);
    }
  }

  #applySet(next: TA | TB | TN, source: ToggleChangeSource): void {
    const previous = source === "initialization" ? null : this.#value;
    this.#value = next;
    this.#emit({ current: next, previous, source });
  }
}
