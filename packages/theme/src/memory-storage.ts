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

import type { Unsubscribe } from "@ailuracode/alpine-core";
import { createMemoryAdapter } from "@ailuracode/alpine-ui";
import type { ThemePreference, ThemeStorage } from "./types";

export function createMemoryThemeStorage(
  initial: ThemePreference | null = null
): ThemeStorage & { subscribe: (listener: (next: ThemePreference | null) => void) => Unsubscribe } {
  return createMemoryAdapter<ThemePreference>({ initial });
}
