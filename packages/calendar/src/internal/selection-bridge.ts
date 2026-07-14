/**
 * Calendar ↔ selection primitive bridge.
 *
 * Works with a plain `{ mode, value }` state object — no SelectionController
 * overhead.
 */

import { format } from "date-fns";
import type { ResolvedDateFnsContext } from "../context.js";
import type { CalendarDateRange, CalendarMode, CalendarSelection } from "../types.js";
import { normalizeDate } from "./grid.js";
import { selectRangeDate } from "./selection.js";

/** Lightweight selection value — mirrors @ailuracode/alpine-selection's SelectionValue. */
type SelectionValue =
  | string
  | number
  | null
  | readonly (string | number)[]
  | { from: string | number; to?: string | number }
  | null;

export interface CalendarSelectionState {
  mode: CalendarMode;
  value: SelectionValue;
}

// ── Key conversion ──────────────────────────────────────────────────

export function dateToSelectionKey(date: Date, context: ResolvedDateFnsContext): string {
  return format(normalizeDate(date, context), "yyyy-MM-dd", context);
}

export function selectionKeyToDate(key: string, context: ResolvedDateFnsContext): Date {
  const [y, m, d] = key.split("-").map(Number);
  return normalizeDate(new Date(y, m - 1, d), context);
}

// ── Value conversion ────────────────────────────────────────────────

export function calendarSelectionToValue(
  selection: CalendarSelection,
  mode: CalendarMode,
  context: ResolvedDateFnsContext
): SelectionValue {
  if (selection === null) {
    return mode === "multiple" ? [] : null;
  }

  if (mode === "single") {
    return selection instanceof Date ? dateToSelectionKey(selection, context) : null;
  }

  if (mode === "multiple") {
    if (!Array.isArray(selection)) {
      return [];
    }
    return selection.map((date) => dateToSelectionKey(date, context));
  }

  if (typeof selection === "object" && !Array.isArray(selection) && !(selection instanceof Date)) {
    const range = selection as CalendarDateRange;
    if (!range.from) {
      return null;
    }
    return {
      from: dateToSelectionKey(range.from, context),
      to: range.to ? dateToSelectionKey(range.to, context) : undefined,
    };
  }

  return null;
}

export function valueToCalendarSelection(
  value: SelectionValue,
  mode: CalendarMode,
  context: ResolvedDateFnsContext
): CalendarSelection {
  if (mode === "single") {
    if (value === null || typeof value === "object") {
      return null;
    }
    return selectionKeyToDate(String(value), context);
  }

  if (mode === "multiple") {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.map((key) => selectionKeyToDate(String(key), context));
  }

  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const range = value as { from: string; to?: string };
  return {
    from: selectionKeyToDate(range.from, context),
    to: range.to ? selectionKeyToDate(range.to, context) : undefined,
  };
}

// ── State operations ────────────────────────────────────────────────

export function ensureCalendarSelection(
  state: CalendarSelectionState,
  mode: CalendarMode,
  selected: CalendarSelection,
  context: ResolvedDateFnsContext
): void {
  state.mode = mode;
  state.value = calendarSelectionToValue(selected, mode, context);
}

export function readCalendarSelection(
  state: CalendarSelectionState,
  context: ResolvedDateFnsContext
): CalendarSelection {
  return valueToCalendarSelection(state.value, state.mode, context);
}

export function selectCalendarDate(
  state: CalendarSelectionState,
  current: CalendarSelection,
  day: Date,
  context: ResolvedDateFnsContext
): CalendarSelection {
  const key = dateToSelectionKey(day, context);

  if (state.mode === "single") {
    state.value = key;
    return readCalendarSelection(state, context);
  }

  if (state.mode === "multiple") {
    const keys = Array.isArray(state.value) ? [...state.value] : [];
    const idx = keys.indexOf(key);
    if (idx >= 0) {
      keys.splice(idx, 1);
    } else {
      keys.push(key);
    }
    state.value = keys;
    return readCalendarSelection(state, context);
  }

  const next = selectRangeDate(current, day, context);
  state.value = calendarSelectionToValue(next, state.mode, context);
  return readCalendarSelection(state, context);
}

export function clearCalendarSelection(
  state: CalendarSelectionState,
  context: ResolvedDateFnsContext
): CalendarSelection {
  state.value = state.mode === "multiple" ? [] : null;
  return readCalendarSelection(state, context);
}

// ── Comparison ──────────────────────────────────────────────────────

function sameDate(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

function datesEqual(a: Date | null | undefined, b: Date | null | undefined): boolean {
  if (a == null || b == null) {
    return a == null && b == null;
  }
  return sameDate(a, b);
}

function datesArrayEqual(a: Date[], b: Date[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((d, i) => sameDate(d, b[i]));
}

function rangesEqual(left: CalendarSelection, right: CalendarSelection): boolean {
  const lr = left as CalendarDateRange | null;
  const rr = right as CalendarDateRange | null;
  if (!(lr || rr)) {
    return true;
  }
  if (!(lr && rr)) {
    return false;
  }
  return datesEqual(lr.from ?? null, rr.from ?? null) && datesEqual(lr.to ?? null, rr.to ?? null);
}

export function calendarSelectionEquals(
  left: CalendarSelection,
  right: CalendarSelection,
  state: CalendarSelectionState
): boolean {
  if (state.mode === "single") {
    return datesEqual(left instanceof Date ? left : null, right instanceof Date ? right : null);
  }

  if (state.mode === "multiple") {
    return datesArrayEqual(Array.isArray(left) ? left : [], Array.isArray(right) ? right : []);
  }

  return rangesEqual(left, right);
}
