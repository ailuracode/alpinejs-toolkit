/**
 * Serialization helpers for URL and storage integration.
 */

import { SelectionError } from "./error.js";
import { isRangeValue } from "./options.js";
import type { SelectionMode, SelectionValue } from "./types.js";

const RANGE_SEPARATOR = "..";
const MULTIPLE_SEPARATOR = ",";

/** Serializes a selection value for the active mode. */
export function serializeSelection(value: SelectionValue, mode: SelectionMode): string {
  if (mode === "single") {
    if (value === null || typeof value === "object") {
      return "";
    }
    return String(value);
  }

  if (mode === "multiple") {
    if (!Array.isArray(value) || value.length === 0) {
      return "";
    }
    return value.map((entry) => String(entry)).join(MULTIPLE_SEPARATOR);
  }

  if (!isRangeValue(value)) {
    return "";
  }

  const from = String(value.from);
  if (value.to === undefined) {
    return from;
  }
  return `${from}${RANGE_SEPARATOR}${String(value.to)}`;
}

/** Deserializes a stored selection string for the active mode. */
export function deserializeSelection(serialized: string, mode: SelectionMode): SelectionValue {
  const trimmed = serialized.trim();
  if (trimmed === "") {
    return mode === "multiple" ? [] : null;
  }

  if (mode === "single") {
    return trimmed;
  }

  if (mode === "multiple") {
    return trimmed
      .split(MULTIPLE_SEPARATOR)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  const separatorIndex = trimmed.indexOf(RANGE_SEPARATOR);
  if (separatorIndex === -1) {
    return { from: trimmed };
  }

  const from = trimmed.slice(0, separatorIndex);
  const to = trimmed.slice(separatorIndex + RANGE_SEPARATOR.length);
  if (from === "" || to === "") {
    throw new SelectionError("invalid range serialization", "INVALID_VALUE");
  }
  return { from, to };
}

/** Parses a URL search param into a selection value. */
export function parseSelectionParam(
  params: URLSearchParams,
  key: string,
  mode: SelectionMode
): SelectionValue {
  const raw = params.get(key);
  if (raw === null) {
    return mode === "multiple" ? [] : null;
  }
  return deserializeSelection(raw, mode);
}

/** Writes a selection value into URL search params. */
export function writeSelectionParam(
  params: URLSearchParams,
  key: string,
  value: SelectionValue,
  mode: SelectionMode
): void {
  const serialized = serializeSelection(value, mode);
  if (serialized === "") {
    params.delete(key);
    return;
  }
  params.set(key, serialized);
}
