/**
 * Async race protection for validation and submission.
 */

export class AsyncGuard {
  #generation = 0;

  /** Increments the generation and returns the new token. */
  bump(): number {
    this.#generation += 1;
    return this.#generation;
  }

  /** Returns true when the token is still current. */
  isCurrent(generation: number): boolean {
    return generation === this.#generation;
  }

  /** Resets the guard to its initial state. */
  reset(): void {
    this.#generation = 0;
  }
}
