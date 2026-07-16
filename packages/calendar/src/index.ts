/**
 * Public entrypoint for `@ailuracode/alpine-calendar`.
 *
 * Re-exports only. Implementation lives in `./controller.ts`,
 * `./plugin.ts`, `./context.ts`, and `./matchers.ts`.
 */

export type {
  CalendarDateAdapter,
  CalendarDateAdapterOptions,
  CalendarDateContext,
  CalendarDateFnsOptions,
  CalendarLocale,
  CalendarWeekDay,
  ResolvedCalendarContext,
  ResolvedDateFnsContext,
} from "./context.js";
export {
  createNativeCalendarDateAdapter,
  nativeCalendarDateAdapter,
  resolveCalendarDateContext,
  resolveDateFnsContext,
} from "./context.js";
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
export { default, default as calendarPlugin } from "./plugin.js";
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
