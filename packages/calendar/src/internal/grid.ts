/**
 * Month-grid computation helpers.
 *
 * @module
 */

import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { ResolvedDateFnsContext } from "../context.js";

/** Normalizes a date to start-of-day using the resolved date-fns context. */
export function normalizeDate(date: Date, context: ResolvedDateFnsContext): Date {
  return startOfDay(date, context);
}

/** Returns every calendar day (including leading/trailing outside days) for the given month. */
export function getMonthDays(month: Date, context: ResolvedDateFnsContext): Date[] {
  const start = startOfWeek(startOfMonth(month, context), context);
  const end = endOfWeek(endOfMonth(month, context), context);

  return eachDayOfInterval({ start, end }, context);
}

/** Splits a flat array of days into weekly rows. */
export function chunkWeeks(days: Date[]): Date[][] {
  const weeks: Date[][] = [];

  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return weeks;
}

/** Returns localized two-letter weekday labels starting from the configured week start. */
export function getWeekdayLabels(context: ResolvedDateFnsContext): string[] {
  const start = startOfWeek(new Date(), context);

  return Array.from({ length: 7 }, (_, index) =>
    format(addDays(start, index, context), "EEEEEE", context)
  );
}
