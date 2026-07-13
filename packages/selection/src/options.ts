/**
 * Option normalization for `@ailuracode/alpine-selection`.
 */

import { SelectionError } from "./error.js";
import type { SelectionMode, SelectionOptions, SelectionRange, SelectionValue } from "./types.js";

export type NormalizedSelectionOptions = {
  readonly mode: SelectionMode;
  readonly keys: readonly string[];
  readonly disabledKeys: readonly string[];
  readonly allowDisabledSelection: boolean;
  readonly value: SelectionValue | undefined;
  readonly defaultValue: SelectionValue;
  readonly onChange: ((detail: import("./events.js").SelectionChangeDetail) => void) | undefined;
};

function normalizeKeys(keys: readonly (string | number)[] | undefined): readonly string[] {
  if (!keys) {
    return [];
  }
  return keys.map((key) => String(key));
}

function emptyValueForMode(mode: SelectionMode): SelectionValue {
  if (mode === "single") {
    return null;
  }
  if (mode === "multiple") {
    return [];
  }
  return null;
}

/** Normalizes selection options once at instance creation. */
export function normalizeSelectionOptions(
  options: SelectionOptions = {}
): NormalizedSelectionOptions {
  const mode = options.mode ?? "single";
  const defaultValue = options.defaultValue ?? emptyValueForMode(mode);

  return {
    mode,
    keys: normalizeKeys(options.keys),
    disabledKeys: normalizeKeys(options.disabledKeys),
    allowDisabledSelection: options.allowDisabledSelection === true,
    value: options.value,
    defaultValue,
    onChange: options.onChange,
  };
}

/** Returns whether the instance runs in controlled mode. */
export function isControlledOptions(options: NormalizedSelectionOptions): boolean {
  return options.value !== undefined;
}

/** Coerces a key to the canonical string form used internally. */
export function toKeyString(key: string | number): string {
  return String(key);
}

/** Validates that a key exists in the registry when keys are non-empty. */
export function assertKnownKey(keys: readonly string[], key: string): void {
  if (keys.length > 0 && !keys.includes(key)) {
    throw new SelectionError(`key "${key}" is not registered`, "INVALID_KEY");
  }
}

/** Returns true when value is a range object. */
export function isRangeValue(value: SelectionValue): value is SelectionRange {
  return value !== null && typeof value === "object" && !Array.isArray(value) && "from" in value;
}

/** Returns true when value is a multiple selection array. */
export function isMultipleValue(value: SelectionValue): value is readonly string[] {
  return Array.isArray(value);
}

function normalizeSingleValue(value: SelectionValue): SelectionValue {
  if (value === null || typeof value === "string" || typeof value === "number") {
    return value === null ? null : String(value);
  }
  if (Array.isArray(value)) {
    const [first] = value;
    return first === undefined ? null : String(first);
  }
  if (isRangeValue(value)) {
    return String(value.from);
  }
  return null;
}

function normalizeMultipleValue(value: SelectionValue): SelectionValue {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }
  if (value === null) {
    return [];
  }
  if (typeof value === "string" || typeof value === "number") {
    return [String(value)];
  }
  if (isRangeValue(value)) {
    const keys: string[] = [String(value.from)];
    if (value.to !== undefined) {
      keys.push(String(value.to));
    }
    return keys;
  }
  return [];
}

function normalizeRangeValue(value: SelectionValue): SelectionValue {
  if (value === null) {
    return null;
  }
  if (isRangeValue(value)) {
    return {
      from: String(value.from),
      to: value.to === undefined ? undefined : String(value.to),
    };
  }
  if (Array.isArray(value)) {
    const [from, to] = value;
    if (from === undefined) {
      return null;
    }
    return {
      from: String(from),
      to: to === undefined ? undefined : String(to),
    };
  }
  if (typeof value === "string" || typeof value === "number") {
    return { from: String(value) };
  }
  return null;
}

/** Normalizes external value for the active mode. */
export function normalizeValueForMode(value: SelectionValue, mode: SelectionMode): SelectionValue {
  if (mode === "single") {
    return normalizeSingleValue(value);
  }
  if (mode === "multiple") {
    return normalizeMultipleValue(value);
  }
  return normalizeRangeValue(value);
}

function keysBetween(keys: readonly string[], fromKey: string, toKey: string): readonly string[] {
  if (keys.length === 0) {
    return fromKey === toKey ? [fromKey] : [fromKey, toKey];
  }

  const fromIndex = keys.indexOf(fromKey);
  const toIndex = keys.indexOf(toKey);
  if (fromIndex === -1 && toIndex === -1) {
    return [];
  }
  if (fromIndex === -1) {
    return [toKey];
  }
  if (toIndex === -1) {
    return [fromKey];
  }

  const start = Math.min(fromIndex, toIndex);
  const end = Math.max(fromIndex, toIndex);
  return keys.slice(start, end + 1);
}

/** Flattens any mode-specific value into ordered selected keys. */
export function flattenSelectedKeys(
  value: SelectionValue,
  mode: SelectionMode,
  keys: readonly string[]
): readonly string[] {
  if (mode === "single") {
    if (value === null || typeof value === "object") {
      return [];
    }
    const key = String(value);
    return keys.length === 0 || keys.includes(key) ? [key] : [];
  }

  if (mode === "multiple") {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((entry) => String(entry))
      .filter((key) => keys.length === 0 || keys.includes(key));
  }

  if (!isRangeValue(value)) {
    return [];
  }

  return keysBetween(
    keys,
    String(value.from),
    value.to === undefined ? String(value.from) : String(value.to)
  );
}

/** Converts mode when switching with explicit transition rules. */
export function convertValueForModeChange(
  value: SelectionValue,
  fromMode: SelectionMode,
  toMode: SelectionMode,
  keys: readonly string[]
): SelectionValue {
  if (fromMode === toMode) {
    return normalizeValueForMode(value, toMode);
  }

  if (toMode === "single") {
    const selected = flattenSelectedKeys(value, fromMode, keys);
    return selected[0] ?? null;
  }

  if (toMode === "multiple") {
    return flattenSelectedKeys(value, fromMode, keys);
  }

  const selected = flattenSelectedKeys(value, fromMode, keys);
  if (selected.length === 0) {
    return null;
  }
  if (selected.length === 1) {
    return { from: selected[0] };
  }
  return { from: selected[0], to: selected[selected.length - 1] };
}
