/**
 * Calendar ↔ selection primitive bridge.
 */

import type {
  SelectionController,
  SelectionMode,
  SelectionValue,
} from "@ailuracode/alpine-selection";
import { format, parse } from "date-fns";
import type { ResolvedDateFnsContext } from "../context.js";
import type { CalendarDateRange, CalendarMode, CalendarSelection } from "../types.js";
import { normalizeDate } from "./grid.js";
import { selectRangeDate } from "./selection.js";

const CALENDAR_SELECTION_ID = "calendar";

export function dateToSelectionKey(date: Date, context: ResolvedDateFnsContext): string {
  return format(normalizeDate(date, context), "yyyy-MM-dd", context);
}

export function selectionKeyToDate(key: string, context: ResolvedDateFnsContext): Date {
  return normalizeDate(parse(key, "yyyy-MM-dd", new Date()), context);
}

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

export function selectionModeForCalendar(mode: CalendarMode): SelectionMode {
  return mode;
}

export function ensureCalendarSelection(
  controller: SelectionController,
  mode: CalendarMode,
  selected: CalendarSelection,
  context: ResolvedDateFnsContext
): void {
  if (!controller.hasInstance(CALENDAR_SELECTION_ID)) {
    controller.create(CALENDAR_SELECTION_ID, {
      mode: selectionModeForCalendar(mode),
      defaultValue: calendarSelectionToValue(selected, mode, context),
      keys: [],
    });
    return;
  }
  controller.setMode(CALENDAR_SELECTION_ID, selectionModeForCalendar(mode));
  controller.setValue(CALENDAR_SELECTION_ID, calendarSelectionToValue(selected, mode, context));
}

export function readCalendarSelection(
  controller: SelectionController,
  mode: CalendarMode,
  context: ResolvedDateFnsContext
): CalendarSelection {
  return valueToCalendarSelection(
    controller.getSnapshot(CALENDAR_SELECTION_ID).value,
    mode,
    context
  );
}

export function selectCalendarDate(
  controller: SelectionController,
  current: CalendarSelection,
  day: Date,
  mode: CalendarMode,
  context: ResolvedDateFnsContext
): CalendarSelection {
  const key = dateToSelectionKey(day, context);

  if (mode === "single") {
    controller.replace(CALENDAR_SELECTION_ID, key);
    return readCalendarSelection(controller, mode, context);
  }

  if (mode === "multiple") {
    controller.toggle(CALENDAR_SELECTION_ID, key);
    return readCalendarSelection(controller, mode, context);
  }

  const next = selectRangeDate(current, day, context);
  controller.setValue(CALENDAR_SELECTION_ID, calendarSelectionToValue(next, mode, context));
  return readCalendarSelection(controller, mode, context);
}

export function clearCalendarSelection(
  controller: SelectionController,
  mode: CalendarMode,
  context: ResolvedDateFnsContext
): CalendarSelection {
  controller.clear(CALENDAR_SELECTION_ID);
  return readCalendarSelection(controller, mode, context);
}

export function calendarSelectionEquals(
  left: CalendarSelection,
  right: CalendarSelection,
  mode: CalendarMode,
  context: ResolvedDateFnsContext
): boolean {
  const leftValue = calendarSelectionToValue(left, mode, context);
  const rightValue = calendarSelectionToValue(right, mode, context);
  return JSON.stringify(leftValue) === JSON.stringify(rightValue);
}

export { CALENDAR_SELECTION_ID };
