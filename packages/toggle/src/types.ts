import type { AlpineLifecycleHost } from "@ailuracode/alpine-core";
import type { Alpine } from "alpinejs";

export interface ToggleBinaryStates<TA, TB> {
  readonly on: TA;
  readonly off: TB;
}

export interface ToggleTernaryStates<TA, TB, TN> extends ToggleBinaryStates<TA, TB> {
  readonly indeterminate: TN;
}

export interface ToggleOptions<TA, TB, TN = undefined> {
  readonly states: ToggleBinaryStates<TA, TB> & { readonly indeterminate?: TN };
  readonly initial?: TA | TB | TN;
  readonly id?: string;
}

export interface ToggleStatesView<TA, TB, TN> {
  readonly on: TA;
  readonly off: TB;
  readonly indeterminate: TN;
}

export interface ToggleInstance<TA, TB, TN, V> {
  readonly value: V;
  readonly states: ToggleStatesView<TA, TB, TN>;
  is(candidate: V): boolean;
  set(value: V): void;
  toggle(): V;
  next(): V;
  reset(): V;
}

export type ToggleReactiveViewValue<TA, TB, TN> = [TN] extends [undefined] ? TA | TB : TA | TB | TN;

export interface ToggleEvents<TA, TB, TN = undefined> extends Record<string, unknown> {
  change: ToggleChangeDetail<TA, TB, TN>;
}

export interface ToggleReactiveView<TA, TB, TN = undefined>
  extends Omit<ToggleInstance<TA, TB, TN, ToggleReactiveViewValue<TA, TB, TN>>, "value"> {
  value: ToggleReactiveViewValue<TA, TB, TN>;
  readonly id: string;
  readonly isMounted: boolean;
  readonly isDestroyed: boolean;
  setSilently(value: ToggleReactiveViewValue<TA, TB, TN>): void;
}

export type ToggleChangeSource = "user" | "reset" | "initialization";

export interface ToggleChangeDetail<TA, TB, TN> {
  readonly current: TA | TB | TN;
  readonly previous: TA | TB | TN | null;
  readonly source: ToggleChangeSource;
}

export interface CreateToggleOptions {
  readonly id?: string;
  readonly magicKey?: string;
}

export type ToggleAlpine = AlpineLifecycleHost;

export type TogglePluginCallback = (alpine: Alpine) => void;
