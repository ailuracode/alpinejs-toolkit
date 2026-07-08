/**
 * Toggle controller — the framework-agnostic core of
 * `@ailuracode/alpine-toggle`. Owns every piece of toggle state and
 * exposes a typed `change` event through a composition with
 * {@link EventEmitter} from `@ailuracode/alpine-core`.
 *
 * Responsibilities:
 *
 * 1. State — owns `value` plus the `on` / `off` / `indeterminate`
 *    shorthands.
 * 2. Transitions — `set`, `toggle`, `next`, `reset`. Each emits a
 *    typed `change` event with the previous snapshot.
 * 3. Lifecycle — `destroy()` is idempotent and tears down every
 *    listener.
 *
 * Construction rules (per
 * `.agents/instructions/controllers.instructions.md`):
 *
 * - The constructor MUST NOT access `window` / `document` /
 *   `localStorage`. The controller is pure logic — no browser APIs.
 * - `destroy()` MUST be idempotent.
 *
 * The controller is generic over the configured state types so
 * subscribers receive a typed `change` payload without casts. The
 * `TN` defaults to `undefined` for the binary case.
 *
 * Why composition over inheritance: `BaseController` exposes typed
 * `on()` / `off()` event methods. The toggle state model also wants
 * `on` / `off` property getters for the configured extremes.
 * Extending `BaseController` would force a collision; composition
 * with `EventEmitter` keeps both names available.
 */

import type { Unsubscribe } from "@ailuracode/alpine-core";
import { EventEmitter, generateId } from "@ailuracode/alpine-core";
import type { ToggleEvents } from "./events";
import {
  buildStateCycle,
  hasIndeterminateState,
  isConfiguredState,
  resolveInitial,
} from "./internal/validation";
import type { ToggleChangeSource, ToggleInstance, ToggleOptions, ToggleStatesView } from "./types";

/**
 * Public, framework-agnostic controller returned by
 * {@link createToggle} and every call to `$toggle(options)` inside an
 * Alpine template.
 */
export class ToggleController<TA, TB, TN, V extends TA | TB | TN = TA | TB | TN>
  implements ToggleInstance<TA, TB, TN, V>
{
  readonly #emitter: EventEmitter<ToggleEvents<TA, TB, TN>>;
  readonly #id: string;
  readonly #states: ToggleStatesView<TA, TB, TN>;
  readonly #cycle: readonly (TA | TB | TN)[];
  readonly #initial: TA | TB | TN;
  readonly #hasTernary: boolean;

  #value: TA | TB | TN;
  #destroyed = false;

  constructor(options: ToggleOptions<TA, TB, TN>) {
    this.#id = options.id ?? generateId("toggle");

    const hasTernary = hasIndeterminateState(options.states);
    this.#hasTernary = hasTernary;

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

    this.#emitter = new EventEmitter<ToggleEvents<TA, TB, TN>>();

    // Emit the initialization event on a microtask so consumers
    // can subscribe synchronously after `new ToggleController(...)`
    // returns and still receive the initial state. Mirrors the
    // behaviour of `@ailuracode/alpine-theme`'s controller.
    //
    // The emit targets `#value` (current) rather than `#initial`
    // so consumers who call `setSilently(...)` BEFORE the
    // microtask fires (a common hydration pattern) keep their
    // hydrated value. The `previous` field stays `null` per the
    // initialization contract — listeners can distinguish init
    // from any later change via the `source` discriminator.
    queueMicrotask(() => {
      if (this.#destroyed) {
        return;
      }
      this.#emitter.emit("change", {
        current: this.#value,
        previous: null,
        source: "initialization",
      });
    });
  }

  // ── Public identity ────────────────────────────────────────────

  get id(): string {
    return this.#id;
  }

  get isDestroyed(): boolean {
    return this.#destroyed;
  }

  // ── Public state surface ────────────────────────────────────────

  get value(): V {
    return this.#value as V;
  }

  get states(): ToggleStatesView<TA, TB, TN> {
    return this.#states;
  }

  is(candidate: V): boolean {
    return this.#value === candidate;
  }

  // ── Event surface (typed event bus) ─────────────────────────────

  on<K extends keyof ToggleEvents<TA, TB, TN>>(
    event: K,
    listener: (detail: ToggleEvents<TA, TB, TN>[K]) => void
  ): Unsubscribe {
    return this.#emitter.on(event, listener);
  }

  once<K extends keyof ToggleEvents<TA, TB, TN>>(
    event: K,
    listener: (detail: ToggleEvents<TA, TB, TN>[K]) => void
  ): Unsubscribe {
    return this.#emitter.once(event, listener);
  }

  off<K extends keyof ToggleEvents<TA, TB, TN>>(
    event: K,
    listener: (detail: ToggleEvents<TA, TB, TN>[K]) => void
  ): void {
    this.#emitter.off(event, listener);
  }

  removeAllListeners(): void {
    this.#emitter.removeAllListeners();
  }

  // ── Public commands ─────────────────────────────────────────────

  set(value: V): void {
    if (this.#destroyed) {
      return;
    }
    if (!isConfiguredState(this.#states, value)) {
      return;
    }
    if (this.#value === value) {
      return;
    }
    this.#applySet(value, "user");
  }

  /**
   * Sets the value without emitting a `change` event and without
   * updating `#lastWritten` markers — escape hatch for hydration
   * paths where the consumer has authoritative state (e.g. read
   * from `localStorage`) and wants the controller to start from
   * that value without broadcasting a transition.
   *
   * Silent semantics:
   *
   * - No `change` event is emitted — listeners stay quiet.
   * - `#initial` is NOT updated — `reset()` still restores the
   *   originally-configured `initial`, not the hydrated value.
   *   Callers that want a different reset target should pass the
   *   hydrated value through the constructor's `initial` option
   *   instead.
   * - The queued initialization microtask (if it hasn't fired
   *   yet) preserves the hydrated value instead of resetting to
   *   `#initial` — see the constructor for details.
   *
   * Invalid values (not in `states`) are silently rejected, same
   * as `set()`. `destroy()`d controllers ignore the call.
   */
  setSilently(value: V): void {
    if (this.#destroyed) {
      return;
    }
    if (!isConfiguredState(this.#states, value)) {
      return;
    }
    this.#value = value as TA | TB | TN;
  }

  toggle(): V {
    if (this.#destroyed) {
      return this.#value as V;
    }
    const next = this.#resolveToggleTarget();
    if (next !== this.#value) {
      this.#applySet(next, "user");
    }
    return next as V;
  }

  next(): V {
    if (this.#destroyed) {
      return this.#value as V;
    }
    const idx = this.#cycle.indexOf(this.#value);
    const nextValue = this.#cycle[(idx + 1) % this.#cycle.length] as TA | TB | TN;
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

  // ── Lifecycle ───────────────────────────────────────────────────

  /**
   * Tears down every listener and marks the controller destroyed.
   * Idempotent — subsequent calls are no-ops.
   */
  destroy(): void {
    if (this.#destroyed) {
      return;
    }
    this.#destroyed = true;
    this.#emitter.removeAllListeners();
  }

  // ── Private transitions ─────────────────────────────────────────

  /**
   * Computes the next value for `toggle()`. Independent of `next()`
   * because `toggle()` skips the ternary state — from
   * `indeterminate` it moves to `on`, not to `off`.
   */
  #resolveToggleTarget(): TA | TB | TN {
    if (this.#hasTernary && this.#value === this.#states.indeterminate) {
      return this.#states.on;
    }
    return this.#value === this.#states.on ? this.#states.off : this.#states.on;
  }

  /**
   * Applies a new value and emits the `change` event. The first
   * emit (source `'initialization'`) carries `previous: null`.
   */
  #applySet(next: TA | TB | TN, source: ToggleChangeSource): void {
    const previous = source === "initialization" ? null : this.#value;
    this.#value = next;
    this.#emitter.emit("change", {
      current: next,
      previous,
      source,
    });
  }
}
