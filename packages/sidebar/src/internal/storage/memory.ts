/**
 * In-memory storage adapter. Useful for:
 * - Tests that need a hermetic storage layer.
 * - SSR / server-side flows that want to seed the manager with a
 *   precomputed value.
 *
 * Holds a single `boolean | null` value. The `subscribe()` hook
 * fires whenever the value changes, so cross-instance observers can
 * chain it. Cross-tab sync is intentionally NOT supported — in-memory
 * state does not survive a reload.
 *
 * `remove()` emits `null` so consumers can distinguish "the storage
 * was cleared" from "a new value was set".
 */

import type { Unsubscribe } from "../../core-deps.js";
import type { SidebarStorage } from "../../types";

/**
 * Builds a hermetic {@link SidebarStorage} backed by an in-process
 * `boolean | null` cell. The returned adapter exposes a
 * non-optional `subscribe` so consumers that need cross-instance
 * observers can chain the storage.
 *
 * @param initial - Seed value (`true` / `false`). `null` (default)
 *   leaves the storage empty.
 */
export function createMemorySidebarStorage(initial: boolean | null = null): SidebarStorage & {
  subscribe: (listener: (next: boolean | null) => void) => Unsubscribe;
} {
  let value: boolean | null = initial;
  const listeners = new Set<(next: boolean | null) => void>();

  return {
    get(): boolean | null {
      return value;
    },
    set(next: boolean): void {
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
    subscribe(listener): Unsubscribe {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
