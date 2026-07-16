/**
 * In-memory storage adapter. Useful for:
 * - Tests that need a hermetic storage layer.
 * - SSR / server-side flows that want to seed the manager with a
 *   precomputed preference.
 *
 * Holds a single `ThemePreference | null` value. The `subscribe()` hook
 * fires whenever the value changes, so cross-instance observers can
 * chain it. Cross-tab sync is intentionally NOT supported — in-memory
 * state does not survive a reload.
 *
 * `remove()` emits `null` so consumers can distinguish "the storage
 * was cleared" from "a new preference was set".
 *
 * Lives at the package root (rather than under `internal/`) because
 * it is part of the documented plugin options surface.
 */

import type { Unsubscribe } from "@ailuracode/alpine-core/controller";
import type { ThemePreference, ThemeStorage } from "./types";

export function createMemoryThemeStorage(
  initial: ThemePreference | null = null
): ThemeStorage & { subscribe: (listener: (next: ThemePreference | null) => void) => Unsubscribe } {
  let value: ThemePreference | null = initial;
  const listeners = new Set<(next: ThemePreference | null) => void>();

  return {
    get(): ThemePreference | null {
      return value;
    },
    set(next: ThemePreference): void {
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
