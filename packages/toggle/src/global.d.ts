/// <reference types="@types/alpinejs" />

export interface ToggleBinaryStates<TA, TB> {
  truly: TA;
  falsely: TB;
}

export interface ToggleTernaryStates<TA, TB, TN> extends ToggleBinaryStates<TA, TB> {
  ternary: TN;
}

export interface ToggleOptions<TA, TB, TN = undefined> {
  states: ToggleBinaryStates<TA, TB> & { ternary?: TN };
  initial?: TA | TB | TN;
}

export interface ToggleInstance<TA, TB, TN, V> {
  value: V;
  readonly states: ToggleBinaryStates<TA, TB> & { ternary: TN };
  readonly truly: TA;
  readonly falsely: TB;
  readonly ternary: TN;
  is(value: V): boolean;
  set(value: V): boolean;
  toggle(): V;
  cycle(): V;
  reset(): V;
}

export type ToggleMagic = {
  <const TA, const TB>(options: {
    states: ToggleBinaryStates<TA, TB>;
    initial?: TA | TB;
  }): ToggleInstance<TA, TB, undefined, TA | TB>;
  <const TA, const TB, const TN>(options: {
    states: ToggleTernaryStates<TA, TB, TN>;
    initial?: TA | TB | TN;
  }): ToggleInstance<TA, TB, TN, TA | TB | TN>;
};

declare global {
  namespace Alpine {
    interface Magics<T> {
      $toggle: ToggleMagic;
    }
  }
}
