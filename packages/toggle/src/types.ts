/**
 * Public type contracts for `@ailuracode/alpine-toggle`.
 *
 * Per `.cursor/rules/formatting.mdc`, every public type
 * lives in a `types.ts` module so consumers can import them without pulling
 * the implementation. The shape IS the contract — renaming a field or
 * changing a variant is a breaking change.
 *
 * The toggle package models a small state machine with two required
 * opposite states (`on`, `off`) and one optional independent state
 * (`indeterminate`). The **binary case is the default** — most
 * consumers only need `on` / `off`. The ternary case is opt-in for
 * specific situations: tri-state checkboxes, loading placeholders,
 * or any value that is genuinely neither on nor off.
 */

import type { Alpine, PluginCallback } from "@ailuracode/alpine-core";
import type { Alpine as AlpineBase } from "alpinejs";

/**
 * Required opposite pair — the binary case. `on` and `off` are the
 * two extremes of the state machine: `toggle()` flips between them,
 * `set()` validates against them, and `next()` advances through them
 * in order. This is the default shape — most consumers only need this.
 */
export interface ToggleBinaryStates<TA, TB> {
  readonly on: TA;
  readonly off: TB;
}

/**
 * Ternary case — opt-in. The independent state lives OUTSIDE the
 * `on` / `off` opposition: `toggle()` skips it, but `next()` walks
 * through it as the third position. Use it only when the third
 * state is genuinely independent of the opposites (e.g. `'unknown'`,
 * `null`, `undefined`).
 */
export interface ToggleTernaryStates<TA, TB, TN> extends ToggleBinaryStates<TA, TB> {
  readonly indeterminate: TN;
}

/** Options accepted by {@link createToggle} / `$toggle(options)`. */
export interface ToggleOptions<TA, TB, TN = undefined> {
  readonly states: ToggleBinaryStates<TA, TB> & { readonly indeterminate?: TN };
  readonly initial?: TA | TB | TN;
  /**
   * Stable identifier exposed via `controller.id`. Defaults to an
   * auto-generated id. Useful when the same toggle is shared across
   * multiple Alpine components and you want a stable reference for
   * debugging or external coordination.
   */
  readonly id?: string;
}

/** Read-only snapshot of the configured states, with `indeterminate` always present. */
export interface ToggleStatesView<TA, TB, TN> {
  readonly on: TA;
  readonly off: TB;
  readonly indeterminate: TN;
}

/**
 * Public instance surface returned by {@link createToggle} and every
 * call to `$toggle(options)` inside an Alpine template.
 *
 * Methods are `void` where theme chose `void`; the only methods that
 * still return their new value are `toggle()`, `next()`, and `reset()`
 * because they read as a fluent expression in templates.
 *
 * Note on naming: the configured extremes (`on`, `off`,
 * `indeterminate`) live on the `states` object — `toggle.states.on`,
 * `toggle.states.off`, `toggle.states.indeterminate`. Top-level
 * getters would collide with the typed event bus methods inherited
 * from {@link EventEmitter} (`on(event, listener)` / `off(event,
 * listener)`); keeping them on `states` avoids the conflict and
 * matches the pattern used by `@ailuracode/alpine-theme`.
 */
export interface ToggleInstance<TA, TB, TN, V> {
  /** Current state. */
  readonly value: V;
  /** Read-only view of the configured states. `indeterminate` is `undefined` for binary. */
  readonly states: ToggleStatesView<TA, TB, TN>;
  /** Whether `value` strictly equals `candidate`. */
  is(candidate: V): boolean;
  /**
   * Sets the value. No-op when the candidate equals the current value
   * or is not one of the configured states. Idempotent and silent —
   * the typed `on('change', ...)` listener is the only side effect.
   */
  set(value: V): void;
  /**
   * Flips between `on` and `off`. From `indeterminate` it moves to
   * `on`. Returns the new value so templates can render it inline.
   */
  toggle(): V;
  /**
   * Advances to the next state in declaration order
   * (`on` → `off` → `indeterminate` → `on`). Returns the new value.
   */
  next(): V;
  /** Restores the configured `initial` (defaulting to `on`, or `indeterminate` when present). */
  reset(): V;
}
export type Writable<T> = {
  -readonly [K in keyof T]: T[K];
};

/** Value union for the Alpine facade. Binary drops `TN` (undefined); ternary keeps it. */
export type ToggleReactiveViewValue<TA, TB, TN> = [TN] extends [undefined] ? TA | TB : TA | TB | TN;

/**
 * Alpine-facing surface of `$toggle(options)`. Extends
 * {@link ToggleInstance} with lifecycle flags (`id`, `isMounted`,
 * `isDestroyed`) and the hydration escape hatch `setSilently`.
 *
 * `value` is a plain property — Alpine's reactive `Proxy` `set` trap
 * fires on every write so templates re-render. See
 * `internal/reactive-adapter.ts` for the wiring.
 */
export interface ToggleReactiveView<TA, TB, TN = undefined>
  extends ToggleInstance<TA, TB, TN, ToggleReactiveViewValue<TA, TB, TN>> {
  readonly id: string;
  readonly isMounted: boolean;
  readonly isDestroyed: boolean;
  /** Sets the value without emitting a `change` event — hydration escape hatch. */
  setSilently(value: ToggleReactiveViewValue<TA, TB, TN>): void;
}
/**
 * Discriminator for the `change` event payload.
 *
 * - `'user'` — direct invocation of `set`, `toggle`, or `next`.
 * - `'reset'` — `reset()` call.
 * - `'initialization'` — first emit right after the controller mounts,
 *   scheduled on a microtask so consumers can subscribe synchronously.
 */
export type ToggleChangeSource = "user" | "reset" | "initialization";

/**
 * Detail payload of the `change` event.
 *
 * `previous` is `null` on the `initialization` event and the typed
 * value on every subsequent transition. The generic matches the
 * controller instance that emitted the event so subscribers get full
 * type narrowing without casts.
 */
export interface ToggleChangeDetail<TA, TB, TN> {
  readonly current: TA | TB | TN;
  readonly previous: TA | TB | TN | null;
  readonly source: ToggleChangeSource;
}

/**
 * Options accepted by the {@link togglePlugin} factory. The package
 * has no persistence, DOM, or system observers — there is nothing to
 * configure at the plugin level today besides an optional `id` for
 * debugging. Reserved as the public seam for future cross-cutting
 * options.
 */
export interface CreateToggleOptions {
  /**
   * Stable identifier exposed via `controller.id`. Defaults to an
   * auto-generated id (`toggle-<n>`). Useful in tests or when
   * multiple toggle plugins co-exist in one runtime.
   */
  readonly id?: string;
}

/**
 * Typed view of `Alpine` the toggle plugin uses internally.
 *
 * Built from the toolkit's {@link Alpine} generic with an empty
 * `Stores` map (toggle does not register any stores) and the optional
 * `cleanup` hook layered on top. A real `Alpine` runtime is assignable
 * without a cast because the toolkit's `Alpine<Stores>` only ADDS
 * overloads.
 */
export type ToggleAlpine = Alpine<Record<string, never>> & {
  /**
   * Forwarded through Alpine's cleanup mechanism when available.
   * Older Alpine versions don't expose `cleanup`; the integration
   * guards every call with a `typeof === "function"` check.
   */
  cleanup?(callback: () => void): void;
};

/**
 * `Alpine.plugin()` callback signature.
 *
 * Typed against the base `Alpine` via the toolkit's `PluginCallback`
 * generic, which keeps this alias structurally assignable to
 * `Base.PluginCallback`. `togglePlugin(...)` drops straight into
 * `Alpine.plugin(...)` without a cast.
 */
export type TogglePluginCallback = PluginCallback<AlpineBase>;
