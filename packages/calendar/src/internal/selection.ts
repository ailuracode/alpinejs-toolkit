/**
 * Selection transition helpers for single, multiple, and range modes.
 *
 * @module
 */

import type { ResolvedCalendarContext } from "../context.js";
import type { CalendarDateRange, CalendarMode, CalendarSelection } from "../types.js";

// ── Normalization ──────────────────────────────────────────────────

/** Normalizes a date range to start-of-day. */
export function normalizeRange(
  range: CalendarDateRange,
  context: ResolvedCalendarContext
): CalendarDateRange {
  return {
    from: range.from ? context.adapter.startOfDay(range.from, context) : undefined,
    to: range.to ? context.adapter.startOfDay(range.to, context) : undefined,
  };
}

/** Normalizes a selection value for the given mode. */
export function normalizeSelection(
  selection: CalendarSelection,
  mode: CalendarMode,
  context: ResolvedCalendarContext
): CalendarSelection {
  if (selection === null) {
    return null;
  }

  if (mode === "single") {
    return selection instanceof Date ? context.adapter.startOfDay(selection, context) : null;
  }

  if (mode === "multiple") {
    if (!Array.isArray(selection)) {
      return [];
    }

    return selection.map((date) => context.adapter.startOfDay(date, context));
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
  context: ResolvedCalendarContext
): CalendarSelection {
  const dates = Array.isArray(current) ? [...current] : [];
  const existingIndex = dates.findIndex((value) => context.adapter.isSameDay(value, day, context));

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
  context: ResolvedCalendarContext
): CalendarSelection {
  const range = (current as CalendarDateRange | null) ?? {};

  if (!range.from || (range.from && range.to)) {
    return { from: day, to: undefined };
  }

  if (context.adapter.isSameDay(day, range.from, context)) {
    return current;
  }

  if (context.adapter.isBefore(day, range.from, context)) {
    return { from: day, to: range.from };
  }

  return { from: range.from, to: day };
}

// ── Query helpers ──────────────────────────────────────────────────

/** Returns `true` when `day` matches the single-date selection. */
export function isSingleSelected(
  selected: CalendarSelection,
  day: Date,
  context: ResolvedCalendarContext
): boolean {
  return selected instanceof Date ? context.adapter.isSameDay(selected, day, context) : false;
}

/** Returns `true` when `day` is one of the multiple-date selections. */
export function isMultipleSelected(
  selected: CalendarSelection,
  day: Date,
  context: ResolvedCalendarContext
): boolean {
  return Array.isArray(selected)
    ? selected.some((value) => context.adapter.isSameDay(value, day, context))
    : false;
}

/** Returns `true` when `day` is a range endpoint (from or to). */
export function isRangeEndpointSelected(
  selected: CalendarSelection,
  day: Date,
  context: ResolvedCalendarContext
): boolean {
  const range = selected as CalendarDateRange | null;

  if (!range) {
    return false;
  }

  return (
    (range.from ? context.adapter.isSameDay(range.from, day, context) : false) ||
    (range.to ? context.adapter.isSameDay(range.to, day, context) : false)
  );
}
