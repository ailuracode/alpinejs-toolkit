/**
 * Z-index slot allocator.
 *
 * Pure logic — no DOM, no Alpine, no module-level state. The
 * controller owns a `SlotState` and calls {@link nextSlot} /
 * {@link releaseSlot} as overlays come and go.
 *
 * Invariants:
 * - `state.allocated` is monotonic — never decremented on release.
 *   Burned slots prevent z-fighting when an id re-opens during a
 *   different overlay's lifetime.
 * - `state.stack` is sorted by `zIndex` ascending at all times.
 *   Top of stack = last element.
 */

import type { OverlayStackEntry } from "../types.js";

/** Mutable slot state held by the controller. */
export interface SlotState {
  readonly baseZIndex: number;
  readonly step: number;
  /** Number of slots ever allocated — monotonically increasing. */
  allocated: number;
  /** Composite key → zIndex. Idempotent register path. */
  readonly slots: Map<string, number>;
  /** Open entries, sorted by zIndex ascending. */
  readonly stack: OverlayStackEntry[];
}

/** Builds an empty {@link SlotState}. */
export function createSlotState(baseZIndex: number, step: number): SlotState {
  return {
    baseZIndex,
    step,
    allocated: 0,
    slots: new Map<string, number>(),
    stack: [],
  };
}

/** Builds the composite key used by the slot map. */
export function slotKey(plugin: string, id: string): string {
  return `${plugin}::${id}`;
}

/**
 * Allocates a slot for `(plugin, id)`.
 * - Idempotent: returns the existing entry when the key is known.
 * - Otherwise allocates the next z-index, inserts in stack order,
 *   and emits the new entry.
 */
export function nextSlot(
  state: SlotState,
  plugin: string,
  id: string
): { entry: OverlayStackEntry; isNew: boolean } {
  const key = slotKey(plugin, id);
  const existingZ = state.slots.get(key);

  if (existingZ !== undefined) {
    const entry = findEntry(state.stack, key);
    if (entry) {
      return { entry, isNew: false };
    }
    // Defensive: slot map has the key but the stack entry was
    // dropped. Rebuild from the slot map.
    const rebuilt: OverlayStackEntry = {
      plugin,
      id,
      zIndex: existingZ,
      openedAt: Date.now(),
    };
    insertSortedByZIndex(state.stack, rebuilt);
    return { entry: rebuilt, isNew: false };
  }

  const zIndex = state.baseZIndex + state.allocated * state.step;
  const entry: OverlayStackEntry = {
    plugin,
    id,
    zIndex,
    openedAt: Date.now(),
  };
  state.slots.set(key, zIndex);
  state.allocated += 1;
  insertSortedByZIndex(state.stack, entry);
  return { entry, isNew: true };
}

/**
 * Releases the slot for `(plugin, id)`.
 * - Silent no-op when the key is unknown.
 * - `state.allocated` is NOT decremented (burned slot).
 */
export function releaseSlot(
  state: SlotState,
  plugin: string,
  id: string
): OverlayStackEntry | null {
  const key = slotKey(plugin, id);
  const zIndex = state.slots.get(key);
  if (zIndex === undefined) {
    return null;
  }
  state.slots.delete(key);

  const index = state.stack.findIndex((entry) => slotKey(entry.plugin, entry.id) === key);
  if (index < 0) {
    return null;
  }
  const [removed] = state.stack.splice(index, 1);
  return removed ?? null;
}

/** Linear scan — stacks rarely exceed ~10 entries. */
function findEntry(stack: readonly OverlayStackEntry[], key: string): OverlayStackEntry | null {
  for (const entry of stack) {
    if (slotKey(entry.plugin, entry.id) === key) {
      return entry;
    }
  }
  return null;
}

/** Inserts `entry` into `stack` keeping `zIndex` ascending. */
function insertSortedByZIndex(stack: OverlayStackEntry[], entry: OverlayStackEntry): void {
  for (let i = 0; i < stack.length; i += 1) {
    const current = stack[i];
    if (!current) {
      continue;
    }
    if (entry.zIndex < current.zIndex) {
      stack.splice(i, 0, entry);
      return;
    }
  }
  stack.push(entry);
}