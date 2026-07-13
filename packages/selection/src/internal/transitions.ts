/**
 * Pure selection transition helpers.
 */

import type { SelectionMode, SelectionRange, SelectionValue } from "../types.js";
import { keysInSpan, selectableKeys } from "./keys.js";

function uniquePush(target: string[], key: string): void {
  if (!target.includes(key)) {
    target.push(key);
  }
}

/** Replaces the selection with a single key. */
export function replaceSelection(mode: SelectionMode, key: string): SelectionValue {
  if (mode === "single") {
    return key;
  }
  if (mode === "multiple") {
    return [key];
  }
  return { from: key };
}

/** Toggles membership for multiple mode; replaces for single and range. */
export function toggleSelection(
  mode: SelectionMode,
  current: SelectionValue,
  key: string
): SelectionValue {
  if (mode === "single") {
    if (current === key) {
      return null;
    }
    return key;
  }

  if (mode === "multiple") {
    const selected = Array.isArray(current) ? current.map((entry) => String(entry)) : [];
    const index = selected.indexOf(key);
    if (index >= 0) {
      return selected.filter((entry) => entry !== key);
    }
    return [...selected, key];
  }

  const range = current as SelectionRange | null;
  if (range && String(range.from) === key && range.to === undefined) {
    return null;
  }
  return { from: key };
}

/** Extends selection from an anchor key to a target key. */
export function extendSelection(
  mode: SelectionMode,
  current: SelectionValue,
  anchorKey: string,
  targetKey: string,
  keys: readonly string[],
  disabledKeys: ReadonlySet<string>,
  allowDisabledSelection: boolean
): SelectionValue {
  if (mode === "single") {
    return targetKey;
  }

  const span = keysInSpan(keys, anchorKey, targetKey, disabledKeys, allowDisabledSelection);
  if (mode === "range") {
    if (span.length === 0) {
      return null;
    }
    if (span.length === 1) {
      return { from: span[0] };
    }
    return { from: span[0], to: span[span.length - 1] };
  }

  const selected = Array.isArray(current) ? current.map((entry) => String(entry)) : [];
  const next = [...selected];
  for (const entry of span) {
    uniquePush(next, entry);
  }
  return next;
}

/** Selects every selectable key in registry order. */
export function selectAllSelection(
  mode: SelectionMode,
  keys: readonly string[],
  disabledKeys: ReadonlySet<string>,
  allowDisabledSelection: boolean
): SelectionValue {
  const all = selectableKeys(keys, disabledKeys, allowDisabledSelection);
  if (mode === "single") {
    return all[0] ?? null;
  }
  if (mode === "multiple") {
    return [...all];
  }
  if (all.length === 0) {
    return null;
  }
  if (all.length === 1) {
    return { from: all[0] };
  }
  return { from: all[0], to: all[all.length - 1] };
}

/** Clears selection for the active mode. */
export function clearSelection(mode: SelectionMode): SelectionValue {
  if (mode === "multiple") {
    return [];
  }
  return null;
}
