/**
 * Puppy toggle — minimal boolean controller for the common case.
 *
 * No events, lifecycle, IDs, or custom state values. Kept separate
 * from Doggo and Big Dog so the Puppy entrypoint stays small.
 */

import type { BaseToggle } from "../../internal/base-types.js";
import type { PuppyToggleInstance } from "./types.js";

export class PuppyToggle implements PuppyToggleInstance, BaseToggle<boolean> {
  #value: boolean;

  constructor(initial = false) {
    this.#value = initial;
  }

  get value(): boolean {
    return this.#value;
  }

  set(value: boolean): void {
    if (this.#value !== value) {
      this.#value = value;
    }
  }

  toggle(): boolean {
    this.#value = !this.#value;
    return this.#value;
  }
}

/** Standalone factory — builds a {@link PuppyToggle} without Alpine. */
export function createPuppyToggle(initial = false): PuppyToggle {
  return new PuppyToggle(initial);
}
