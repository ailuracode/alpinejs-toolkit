export interface BaseToggle<T> {
  readonly value: T;
  set(value: T): void;
  toggle(): T;
}

export type DoggoValue<TA, TB, TN> = [TN] extends [undefined] ? TA | TB : TA | TB | TN;

export interface DoggoChangeDetail<TA, TB, TN> {
  readonly current: DoggoValue<TA, TB, TN>;
  readonly previous: DoggoValue<TA, TB, TN> | null;
}

export interface DoggoToggle<V> extends BaseToggle<V> {
  is(candidate: V): boolean;
  next(): V;
  reset(): V;
  onChange(listener: (detail: { current: V; previous: V | null }) => void): () => void;
}

export interface ToggleDoggoOptions<TA, TB, TN = undefined> {
  readonly states: {
    readonly on: TA;
    readonly off: TB;
    readonly indeterminate?: TN;
  };
  readonly initial?: DoggoValue<TA, TB, TN>;
}

export type DoggoReactiveToggle<TA, TB, TN = undefined> = DoggoToggle<DoggoValue<TA, TB, TN>>;
