/**
 * Minimum surface shared by every toggle variant.
 *
 * Compatibility direction: Puppy → Doggo → Big Dog. Code written
 * against this contract should keep working when upgrading tiers.
 */
export interface BaseToggle<T> {
  readonly value: T;
  set(value: T): void;
  toggle(): T;
}
