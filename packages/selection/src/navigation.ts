/**
 * Index and key navigation helpers for selectable collections.
 */

import type { SelectionKey } from "./types.js";

function toKeyString(key: SelectionKey): string {
  return String(key);
}

/** Moves the active index, skipping non-selectable rows. */
export function moveSelectableIndex(
  current: number,
  delta: number,
  selectable: readonly boolean[]
): number {
  const length = selectable.length;
  if (length === 0) {
    return 0;
  }

  let index = current;
  for (let step = 0; step < length; step++) {
    index = (index + delta + length) % length;
    if (selectable[index]) {
      return index;
    }
  }

  return current;
}

/** Returns the first selectable index or zero when none exist. */
export function firstSelectableIndex(selectable: readonly boolean[]): number {
  const index = selectable.findIndex(Boolean);
  return index === -1 ? 0 : index;
}

/** Returns the last selectable index or zero when none exist. */
export function lastSelectableIndex(selectable: readonly boolean[]): number {
  for (let index = selectable.length - 1; index >= 0; index--) {
    if (selectable[index]) {
      return index;
    }
  }
  return 0;
}

function selectableKeys(
  keys: readonly SelectionKey[],
  disabledKeys: ReadonlySet<string>
): string[] {
  return keys.map((key) => toKeyString(key)).filter((key) => !disabledKeys.has(key));
}

/** Moves from the current key to the next selectable key in registry order. */
export function moveSelectableKey(
  currentKey: SelectionKey | null,
  delta: number,
  keys: readonly SelectionKey[],
  disabledKeys: readonly SelectionKey[] = []
): SelectionKey | null {
  const disabled = new Set(disabledKeys.map((key) => toKeyString(key)));
  const enabled = selectableKeys(keys, disabled);
  if (enabled.length === 0) {
    return null;
  }

  const current = currentKey === null ? -1 : enabled.indexOf(toKeyString(currentKey));
  const start = current === -1 ? (delta > 0 ? -1 : 0) : current;
  const nextIndex = (start + delta + enabled.length) % enabled.length;
  return enabled[nextIndex] ?? null;
}

/** Returns the first selectable key or null when none exist. */
export function firstSelectableKey(
  keys: readonly SelectionKey[],
  disabledKeys: readonly SelectionKey[] = []
): SelectionKey | null {
  const disabled = new Set(disabledKeys.map((key) => toKeyString(key)));
  const enabled = selectableKeys(keys, disabled);
  return enabled[0] ?? null;
}

/** Returns the last selectable key or null when none exist. */
export function lastSelectableKey(
  keys: readonly SelectionKey[],
  disabledKeys: readonly SelectionKey[] = []
): SelectionKey | null {
  const disabled = new Set(disabledKeys.map((key) => toKeyString(key)));
  const enabled = selectableKeys(keys, disabled);
  return enabled[enabled.length - 1] ?? null;
}
