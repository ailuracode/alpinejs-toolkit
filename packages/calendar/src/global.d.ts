/// <reference types="@types/alpinejs" />

import type { CalendarMagic } from "./types.js";

export type {
  CalendarDateAfterMatcher,
  CalendarDateBeforeMatcher,
  CalendarDateFnsOptions,
  CalendarDateIntervalMatcher,
  CalendarDateOnlyMatcher,
  CalendarDateRangeMatcher,
  CalendarDayOfWeekMatcher,
  CalendarInstance,
  CalendarMagic,
  CalendarMatcher,
  CalendarMatcherFn,
  CalendarMonthView,
  ResolvedDateFnsContext,
} from "./index.js";

export { matchesCalendarMatcher } from "./index.js";

export function createCalendarController(
  options?: import("./types.js").CalendarOptions,
  id?: string
): import("./controller.js").CalendarController;

export default function calendarPlugin(): import("alpinejs").PluginCallback;

declare global {
  namespace Alpine {
    interface Magics<T> {
      $calendar: CalendarMagic;
    }
  }
}
