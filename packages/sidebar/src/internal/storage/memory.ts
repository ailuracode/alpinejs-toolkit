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

import type { Unsubscribe } from "@ailuracode/alpine-core";
import { createMemoryAdapter } from "@ailuracode/alpine-ui";
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
  return createMemoryAdapter<boolean>({ initial });
}
