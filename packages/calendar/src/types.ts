/**
 * Public type contracts for `@ailuracode/alpine-calendar`.
 */

import type { Day, Locale } from "date-fns";
import type { CalendarDateFnsOptions, ResolvedDateFnsContext } from "./context.js";
import type {
  CalendarDateAfterMatcher,
  CalendarDateBeforeMatcher,
  CalendarDateIntervalMatcher,
  CalendarDateOnlyMatcher,
  CalendarDateRangeMatcher,
  CalendarDayOfWeekMatcher,
  CalendarMatcher,
  CalendarMatcherFn,
} from "./matchers.js";

/** Calendar display mode. */
export type CalendarMode = "single" | "range" | "multiple";

/** A date range with optional bounds. */
export type CalendarDateRange = {
  readonly from?: Date;
  readonly to?: Date;
};

/** Selection value depending on the current mode. */
export type CalendarSelection = Date | Date[] | CalendarDateRange | null;

/** Options accepted by `createCalendar()` or `$calendar()`. All fields are readonly. */
export interface CalendarOptions {
  readonly locale?: Locale;
  readonly weekStartsOn?: Day;
  readonly minDate?: Date;
  readonly maxDate?: Date;
  readonly mode?: CalendarMode;
  readonly month?: Date;
  readonly selected?: CalendarSelection;
  readonly disabled?: CalendarMatcher | CalendarMatcher[];
  readonly dateFns?: CalendarDateFnsOptions;
}

/** A single day cell in the month grid. */
export interface CalendarDay {
  readonly date: Date;
  readonly isCurrentMonth: boolean;
  readonly isToday: boolean;
  readonly isSelected: boolean;
  readonly isDisabled: boolean;
  readonly isRangeStart: boolean;
  readonly isRangeEnd: boolean;
  readonly isInRange: boolean;
}

/**
 * Consumer-facing calendar surface. Returned by `createCalendar()` and
 * `$calendar()`. All mutable state is exposed through getters — internal
 * mutation is private to the controller.
 */
export interface CalendarInstance {
  readonly month: Date;
  readonly mode: CalendarMode;
  readonly selected: CalendarSelection;
  readonly locale: Locale;
  readonly weekStartsOn: Day;
  readonly dateFns: ResolvedDateFnsContext;
  readonly weeks: CalendarDay[][];
  readonly weekdayLabels: string[];
  prevMonth(): void;
  nextMonth(): void;
  goToMonth(date: Date): void;
  goToToday(): void;
  select(date: Date | null): void;
  clear(): void;
  matches(date: Date, matcher: CalendarMatcher): boolean;
  isSelected(date: Date): boolean;
  isDisabled(date: Date): boolean;
  isToday(date: Date): boolean;
  isSameMonth(date: Date, month?: Date): boolean;
  isInRange(date: Date): boolean;
  isRangeStart(date: Date): boolean;
  isRangeEnd(date: Date): boolean;
  format(date: Date, pattern: string): string;
  formatMonth(month?: Date): string;
  formatYear(month?: Date): string;
}

/** `$calendar` magic signature. */
export type CalendarMagic = (options?: CalendarOptions) => CalendarInstance;

/** Internal resolved configuration — options normalized once at construction. */
export type ResolvedCalendarConfig = {
  readonly context: ResolvedDateFnsContext;
  readonly minDate?: Date;
  readonly maxDate?: Date;
  readonly mode: CalendarMode;
  readonly month: Date;
  readonly selected: CalendarSelection;
  readonly disabled: CalendarMatcher[];
};

export type {
  CalendarDateAfterMatcher,
  CalendarDateBeforeMatcher,
  CalendarDateFnsOptions,
  CalendarDateIntervalMatcher,
  CalendarDateOnlyMatcher,
  CalendarDateRangeMatcher,
  CalendarDayOfWeekMatcher,
  CalendarMatcher,
  CalendarMatcherFn,
  ResolvedDateFnsContext,
};
