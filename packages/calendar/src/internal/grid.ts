/**
 * Month-grid computation helpers.
 *
 * @module
 */

import type { ResolvedCalendarContext } from "../context.js";

/** Normalizes a date to start-of-day using the resolved calendar context. */
export function normalizeDate(date: Date, context: ResolvedCalendarContext): Date {
  return context.adapter.startOfDay(date, context);
}

/** Returns every calendar day (including leading/trailing outside days) for the given month. */
export function getMonthDays(month: Date, context: ResolvedCalendarContext): Date[] {
  const start = context.adapter.startOfWeek(context.adapter.startOfMonth(month, context), context);
  const end = context.adapter.endOfWeek(context.adapter.endOfMonth(month, context), context);

  return context.adapter.eachDayOfInterval({ start, end }, context);
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
export function getWeekdayLabels(context: ResolvedCalendarContext): string[] {
  const start = context.adapter.startOfWeek(new Date(), context);

  return Array.from({ length: 7 }, (_, index) =>
    context.adapter.formatWeekdayLabel(context.adapter.addDays(start, index, context), context)
  );
}
