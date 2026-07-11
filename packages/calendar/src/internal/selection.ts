/**
 * Selection transition helpers for single, multiple, and range modes.
 *
 * @module
 */

import { isBefore, isSameDay, startOfDay } from "date-fns";
import type { ResolvedDateFnsContext } from "../context.js";
import type { CalendarDateRange, CalendarMode, CalendarSelection } from "../types.js";

// ── Normalization ──────────────────────────────────────────────────

/** Normalizes a date range to start-of-day. */
export function normalizeRange(
  range: CalendarDateRange,
  context: ResolvedDateFnsContext
): CalendarDateRange {
  return {
    from: range.from ? startOfDay(range.from, context) : undefined,
    to: range.to ? startOfDay(range.to, context) : undefined,
  };
}

/** Normalizes a selection value for the given mode. */
export function normalizeSelection(
  selection: CalendarSelection,
  mode: CalendarMode,
  context: ResolvedDateFnsContext
): CalendarSelection {
  if (selection === null) {
    return null;
  }

  if (mode === "single") {
    return selection instanceof Date ? startOfDay(selection, context) : null;
  }

  if (mode === "multiple") {
    if (!Array.isArray(selection)) {
      return [];
    }

    return selection.map((date) => startOfDay(date, context));
  }

  if (typeof selection === "object" && !Array.isArray(selection) && !(selection instanceof Date)) {
    return normalizeRange(selection, context);
  }

  return null;
}

// ── Transition helpers ─────────────────────────────────────────────

/** Sets a single-date selection. */
export function selectSingleDate(_current: CalendarSelection, day: Date): CalendarSelection {
  return day;
}

/** Toggles a date in a multiple-date selection. */
export function selectMultipleDate(
  current: CalendarSelection,
  day: Date,
  context: ResolvedDateFnsContext
): CalendarSelection {
  const dates = Array.isArray(current) ? [...current] : [];
  const existingIndex = dates.findIndex((value) => isSameDay(value, day, context));

  if (existingIndex >= 0) {
    dates.splice(existingIndex, 1);
  } else {
    dates.push(day);
  }

  return dates;
}

/** Advances a range selection: first click sets `from`, second click sets `to`. */
export function selectRangeDate(
  current: CalendarSelection,
  day: Date,
  context: ResolvedDateFnsContext
): CalendarSelection {
  const range = (current as CalendarDateRange | null) ?? {};

  if (!range.from || (range.from && range.to)) {
    return { from: day, to: undefined };
  }

  if (isSameDay(day, range.from, context)) {
    return current;
  }

  if (isBefore(day, range.from)) {
    return { from: day, to: range.from };
  }

  return { from: range.from, to: day };
}

// ── Query helpers ──────────────────────────────────────────────────

/** Returns `true` when `day` matches the single-date selection. */
export function isSingleSelected(
  selected: CalendarSelection,
  day: Date,
  context: ResolvedDateFnsContext
): boolean {
  return selected instanceof Date ? isSameDay(selected, day, context) : false;
}

/** Returns `true` when `day` is one of the multiple-date selections. */
export function isMultipleSelected(
  selected: CalendarSelection,
  day: Date,
  context: ResolvedDateFnsContext
): boolean {
  return Array.isArray(selected) ? selected.some((value) => isSameDay(value, day, context)) : false;
}

/** Returns `true` when `day` is a range endpoint (from or to). */
export function isRangeEndpointSelected(
  selected: CalendarSelection,
  day: Date,
  context: ResolvedDateFnsContext
): boolean {
  const range = selected as CalendarDateRange | null;

  if (!range) {
    return false;
  }

  return (
    (range.from ? isSameDay(range.from, day, context) : false) ||
    (range.to ? isSameDay(range.to, day, context) : false)
  );
}
