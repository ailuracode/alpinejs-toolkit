/**
 * Key registry helpers for selection spans and pruning.
 */

import { isRangeValue } from "../options.js";
import type { SelectionMode, SelectionRange, SelectionValue } from "../types.js";

/** Returns the index of a key in the ordered registry, or -1. */
export function indexOfKey(keys: readonly string[], key: string): number {
  return keys.indexOf(key);
}

/** Returns keys between two endpoints in the current registry order. */
export function keysInSpan(
  keys: readonly string[],
  fromKey: string,
  toKey: string,
  disabledKeys: ReadonlySet<string>,
  allowDisabledSelection: boolean
): readonly string[] {
  if (keys.length === 0) {
    return fromKey === toKey ? [fromKey] : [fromKey, toKey];
  }

  const fromIndex = keys.indexOf(fromKey);
  const toIndex = keys.indexOf(toKey);
  if (fromIndex === -1 || toIndex === -1) {
    const fallback = [fromKey, toKey].filter((key, index, array) => array.indexOf(key) === index);
    return filterSelectable(fallback, disabledKeys, allowDisabledSelection);
  }

  const start = Math.min(fromIndex, toIndex);
  const end = Math.max(fromIndex, toIndex);
  const span = keys.slice(start, end + 1);
  return filterSelectable(span, disabledKeys, allowDisabledSelection);
}

/** Filters a key list to selectable entries. */
export function filterSelectable(
  keys: readonly string[],
  disabledKeys: ReadonlySet<string>,
  allowDisabledSelection: boolean
): readonly string[] {
  if (allowDisabledSelection) {
    return [...keys];
  }
  return keys.filter((key) => !disabledKeys.has(key));
}

/** Keeps only keys that still exist in the registry. */
export function filterExistingKeys(
  keys: readonly string[],
  selection: readonly string[]
): readonly string[] {
  if (keys.length === 0) {
    return [...selection];
  }
  const registry = new Set(keys);
  return selection.filter((key) => registry.has(key));
}

function rangeFromSpan(span: readonly string[]): SelectionRange | null {
  if (span.length === 0) {
    return null;
  }
  if (span.length === 1) {
    return { from: span[0] };
  }
  return { from: span[0], to: span[span.length - 1] };
}

function pruneMissingFrom(keys: readonly string[], to: string | undefined): SelectionRange | null {
  if (to !== undefined && keys.includes(to)) {
    return { from: to };
  }
  return null;
}

function pruneMissingTo(
  keys: readonly string[],
  from: string,
  disabledKeys: ReadonlySet<string>,
  allowDisabledSelection: boolean
): SelectionRange | null {
  const fromIndex = keys.indexOf(from);
  if (fromIndex === -1) {
    return { from };
  }
  return rangeFromSpan(
    filterSelectable(keys.slice(fromIndex), disabledKeys, allowDisabledSelection)
  );
}

/** Prunes a range value when keys are removed or reordered. */
export function pruneRangeValue(
  keys: readonly string[],
  range: SelectionRange | null,
  disabledKeys: ReadonlySet<string>,
  allowDisabledSelection: boolean
): SelectionRange | null {
  if (range === null) {
    return null;
  }

  const from = String(range.from);
  const to = range.to === undefined ? undefined : String(range.to);

  if (keys.length === 0) {
    return { from, to };
  }

  const fromExists = keys.includes(from);
  const toExists = to === undefined ? fromExists : keys.includes(to);
  if (!(fromExists || toExists)) {
    return null;
  }

  if (!fromExists) {
    return pruneMissingFrom(keys, to);
  }
  if (to !== undefined && !toExists) {
    return pruneMissingTo(keys, from, disabledKeys, allowDisabledSelection);
  }

  return rangeFromSpan(keysInSpan(keys, from, to ?? from, disabledKeys, allowDisabledSelection));
}

/** Prunes a multiple selection array. */
export function pruneMultipleValue(
  keys: readonly string[],
  value: readonly string[],
  disabledKeys: ReadonlySet<string>,
  allowDisabledSelection: boolean
): readonly string[] {
  const existing = filterExistingKeys(keys, value);
  return filterSelectable(existing, disabledKeys, allowDisabledSelection);
}

/** Prunes a single selection value. */
export function pruneSingleValue(
  keys: readonly string[],
  value: string | null,
  disabledKeys: ReadonlySet<string>,
  allowDisabledSelection: boolean
): string | null {
  if (value === null) {
    return null;
  }
  if (keys.length > 0 && !keys.includes(value)) {
    return null;
  }
  if (!allowDisabledSelection && disabledKeys.has(value)) {
    return null;
  }
  return value;
}

/** Expands a mode-specific value into flat selected keys. */
export function expandSelectedKeys(
  mode: SelectionMode,
  value: SelectionValue,
  keys: readonly string[],
  disabledKeys: ReadonlySet<string>,
  allowDisabledSelection: boolean
): readonly string[] {
  if (mode === "single") {
    if (value === null || typeof value === "object") {
      return [];
    }
    const key = String(value);
    if (!allowDisabledSelection && disabledKeys.has(key)) {
      return [];
    }
    if (keys.length > 0 && !keys.includes(key)) {
      return [];
    }
    return [key];
  }

  if (mode === "multiple") {
    if (!Array.isArray(value)) {
      return [];
    }
    return pruneMultipleValue(
      keys,
      value.map((entry) => String(entry)),
      disabledKeys,
      allowDisabledSelection
    );
  }

  if (!isRangeValue(value)) {
    return [];
  }

  return keysInSpan(
    keys,
    String(value.from),
    value.to === undefined ? String(value.from) : String(value.to),
    disabledKeys,
    allowDisabledSelection
  );
}

/** Returns all selectable keys in registry order. */
export function selectableKeys(
  keys: readonly string[],
  disabledKeys: ReadonlySet<string>,
  allowDisabledSelection: boolean
): readonly string[] {
  return filterSelectable(keys, disabledKeys, allowDisabledSelection);
}
