/**
 * In-memory storage adapter. Useful for:
 * - Tests that need a hermetic storage layer.
 * - SSR / server-side flows that want to seed a controller with a
 *   precomputed value.
 *
 * Holds a single `Value | null` cell. The `subscribe()` hook fires
 * whenever the value changes, so cross-instance observers can chain
 * it. Cross-tab sync is intentionally NOT supported — in-memory
 * state does not survive a reload.
 *
 * `remove()` emits `null` so consumers can distinguish "the storage
 * was cleared" from "a new value was set".
 */

import type { MemoryAdapterOptions, SubscribableStorageAdapter, Unsubscribe } from "../types.js";

/**
 * Builds a hermetic {@link SubscribableStorageAdapter} backed by an
 * in-process `Value | null` cell. The returned adapter always
 * exposes `subscribe` so consumers that need cross-instance
 * observers can chain the storage.
 *
 * @param options.initial - Seed value. `null` (default) leaves the
 *   storage empty.
 */
export function createMemoryAdapter<Value>(
  options: MemoryAdapterOptions<Value> = {}
): SubscribableStorageAdapter<Value> {
  const initial = options.initial ?? null;
  let value: Value | null = initial;
  const listeners = new Set<(next: Value | null) => void>();

  return {
    get(): Value | null {
      return value;
    },
    set(next: Value): void {
      value = next;
      for (const listener of listeners) {
        listener(next);
      }
    },
    remove(): void {
      if (value === null) {
        return;
      }
      value = null;
      for (const listener of listeners) {
        listener(null);
      }
    },
    subscribe(listener: (next: Value | null) => void): Unsubscribe {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
