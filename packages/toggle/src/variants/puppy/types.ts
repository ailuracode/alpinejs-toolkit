export interface BaseToggle<T> {
  readonly value: T;
  set(value: T): void;
  toggle(): T;
}

export interface PuppyToggle extends BaseToggle<boolean> {}

export type PuppyReactiveToggle = PuppyToggle;

export interface CreatePuppyOptions {
  readonly initial?: boolean;
}
