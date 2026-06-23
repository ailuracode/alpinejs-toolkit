/// <reference types="@types/alpinejs" />

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
  ResolvedDateFnsContext,
} from "./index.js";

export { matchesCalendarMatcher } from "./index.js";

declare global {
  namespace Alpine {
    interface Magics<T> {
      $calendar: import("./index.js").CalendarMagic;
    }
  }
}
