/**
 * Debounce helper for async field validators.
 */

export class DebounceRegistry {
  readonly #timers = new Map<string, ReturnType<typeof setTimeout>>();

  schedule(key: string, delayMs: number, run: () => void): void {
    const existing = this.#timers.get(key);
    if (existing !== undefined) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      this.#timers.delete(key);
      run();
    }, delayMs);

    this.#timers.set(key, timer);
  }

  clear(key?: string): void {
    if (key === undefined) {
      for (const timer of this.#timers.values()) {
        clearTimeout(timer);
      }
      this.#timers.clear();
      return;
    }

    const timer = this.#timers.get(key);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.#timers.delete(key);
    }
  }
}
