/**
 * Public entrypoint for `@ailuracode/alpine-calendar`.
 *
 * Re-exports only. Implementation lives in `./controller.ts`,
 * `./plugin.ts`, `./context.ts`, and `./matchers.ts`.
 */

export type { CalendarDateFnsOptions, ResolvedDateFnsContext } from "./context.js";
export {
  CalendarController,
  createCalendar,
  createCalendarController,
  createCalendarMagic,
} from "./controller.js";
export type { CalendarEvents, CalendarMonthChangeDetail, CalendarSelectDetail } from "./events.js";
export {
  type CalendarDateAfterMatcher,
  type CalendarDateBeforeMatcher,
  type CalendarDateIntervalMatcher,
  type CalendarDateOnlyMatcher,
  type CalendarDateRangeMatcher,
  type CalendarDayOfWeekMatcher,
  type CalendarMatcher,
  type CalendarMatcherFn,
  matchesCalendarMatcher,
  normalizeMatchers,
} from "./matchers.js";
export { default } from "./plugin.js";
export type {
  CalendarDateRange,
  CalendarDay,
  CalendarInstance,
  CalendarMagic,
  CalendarMode,
  CalendarOptions,
  CalendarSelection,
  CreateCalendarPluginOptions,
} from "./types.js";
export { DEFAULT_CALENDAR_MAGIC_KEY } from "./types.js";
