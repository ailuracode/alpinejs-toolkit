import type { PuppyToggle as PuppyToggleContract } from "./types";

export class PuppyToggle implements PuppyToggleContract {
  #value: boolean;

  constructor(initial = false) {
    this.#value = initial === true;
  }

  get value(): boolean {
    return this.#value;
  }

  set(value: boolean): void {
    if (value === true || value === false) {
      this.#value = value;
    }
  }

  toggle(): boolean {
    this.#value = !this.#value;
    return this.#value;
  }
}
