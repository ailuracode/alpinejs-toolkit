import type AlpineType from "alpinejs";
import type { Day, Locale } from "date-fns";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday as isTodayDate,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  type CalendarDateFnsOptions,
  type ResolvedDateFnsContext,
  resolveDateFnsContext,
} from "./context.js";
import {
  type CalendarDateAfterMatcher,
  type CalendarDateBeforeMatcher,
  type CalendarDateIntervalMatcher,
  type CalendarDateOnlyMatcher,
  type CalendarDateRangeMatcher,
  type CalendarDayOfWeekMatcher,
  type CalendarMatcher,
  type CalendarMatcherFn,
  isDateDisabledByRules,
  matchesCalendarMatcher,
  normalizeMatchers,
} from "./matchers.js";

export type CalendarMode = "single" | "range" | "multiple";

export type CalendarDateRange = {
  from?: Date;
  to?: Date;
};

export type CalendarSelection = Date | Date[] | CalendarDateRange | null;

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

export { matchesCalendarMatcher, normalizeMatchers };

export interface CalendarOptions {
  locale?: Locale;
  weekStartsOn?: Day;
  minDate?: Date;
  maxDate?: Date;
  mode?: CalendarMode;
  month?: Date;
  selected?: CalendarSelection;
  disabled?: CalendarMatcher | CalendarMatcher[];
  dateFns?: CalendarDateFnsOptions;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
}

export interface CalendarInstance {
  month: Date;
  mode: CalendarMode;
  selected: CalendarSelection;
  locale: Locale;
  weekStartsOn: Day;
  dateFns: ResolvedDateFnsContext;
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

export type CalendarMagic = (options?: CalendarOptions) => CalendarInstance;

type ResolvedCalendarConfig = {
  context: ResolvedDateFnsContext;
  minDate?: Date;
  maxDate?: Date;
  mode: CalendarMode;
  month: Date;
  selected: CalendarSelection;
  disabled: CalendarMatcher[];
};

function normalizeDate(date: Date, context: ResolvedDateFnsContext): Date {
  return startOfDay(date, context);
}

function normalizeRange(
  range: CalendarDateRange,
  context: ResolvedDateFnsContext
): CalendarDateRange {
  return {
    from: range.from ? normalizeDate(range.from, context) : undefined,
    to: range.to ? normalizeDate(range.to, context) : undefined,
  };
}

function normalizeSelection(
  selection: CalendarSelection,
  mode: CalendarMode,
  context: ResolvedDateFnsContext
): CalendarSelection {
  if (selection === null) {
    return null;
  }

  if (mode === "single") {
    return selection instanceof Date ? normalizeDate(selection, context) : null;
  }

  if (mode === "multiple") {
    if (!Array.isArray(selection)) {
      return [];
    }

    return selection.map((date) => normalizeDate(date, context));
  }

  if (typeof selection === "object" && !Array.isArray(selection) && !(selection instanceof Date)) {
    return normalizeRange(selection, context);
  }

  return null;
}

function resolveConfig(options: CalendarOptions = {}): ResolvedCalendarConfig {
  const context = resolveDateFnsContext(options);

  return {
    context,
    minDate: options.minDate ? normalizeDate(options.minDate, context) : undefined,
    maxDate: options.maxDate ? normalizeDate(options.maxDate, context) : undefined,
    mode: options.mode ?? "single",
    month: startOfMonth(options.month ?? new Date(), context),
    selected: normalizeSelection(options.selected ?? null, options.mode ?? "single", context),
    disabled: normalizeMatchers(options.disabled),
  };
}

function getMonthDays(month: Date, context: ResolvedDateFnsContext): Date[] {
  const start = startOfWeek(startOfMonth(month, context), context);
  const end = endOfWeek(endOfMonth(month, context), context);

  return eachDayOfInterval({ start, end }, context);
}

function chunkWeeks(days: Date[]): Date[][] {
  const weeks: Date[][] = [];

  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return weeks;
}

function getWeekdayLabels(context: ResolvedDateFnsContext): string[] {
  const start = startOfWeek(new Date(), context);

  return Array.from({ length: 7 }, (_, index) =>
    format(addDays(start, index, context), "EEEEEE", context)
  );
}

function selectSingleDate(calendar: CalendarInstance, day: Date): void {
  calendar.selected = day;
}

function selectMultipleDate(calendar: CalendarInstance, day: Date): void {
  const current = Array.isArray(calendar.selected) ? [...calendar.selected] : [];
  const existingIndex = current.findIndex((value) => isSameDay(value, day, calendar.dateFns));

  if (existingIndex >= 0) {
    current.splice(existingIndex, 1);
  } else {
    current.push(day);
  }

  calendar.selected = current;
}

function selectRangeDate(calendar: CalendarInstance, day: Date): void {
  const range = (calendar.selected as CalendarDateRange | null) ?? {};

  if (!range.from || (range.from && range.to)) {
    calendar.selected = { from: day, to: undefined };
    return;
  }

  if (isSameDay(day, range.from, calendar.dateFns)) {
    return;
  }

  if (isBefore(day, range.from)) {
    calendar.selected = { from: day, to: range.from };
    return;
  }

  calendar.selected = { from: range.from, to: day };
}

function isSingleSelected(
  selected: CalendarSelection,
  day: Date,
  context: ResolvedDateFnsContext
): boolean {
  return selected instanceof Date ? isSameDay(selected, day, context) : false;
}

function isMultipleSelected(
  selected: CalendarSelection,
  day: Date,
  context: ResolvedDateFnsContext
): boolean {
  return Array.isArray(selected) ? selected.some((value) => isSameDay(value, day, context)) : false;
}

function isRangeEndpointSelected(
  selected: CalendarSelection,
  day: Date,
  context: ResolvedDateFnsContext
): boolean {
  const range = selected as CalendarDateRange | null;

  if (!range) {
    return false;
  }

  return (
    (range.from ? isSameDay(range.from, day, context) : false) ||
    (range.to ? isSameDay(range.to, day, context) : false)
  );
}

/** Creates an independent calendar logic instance backed by date-fns. */
export function createCalendar(options: CalendarOptions = {}): CalendarInstance {
  const config = resolveConfig(options);

  const calendar: CalendarInstance = {
    month: config.month,
    mode: config.mode,
    selected: config.selected,
    locale: config.context.locale,
    weekStartsOn: config.context.weekStartsOn,
    dateFns: config.context,

    get weeks() {
      const days = getMonthDays(this.month, this.dateFns);

      return chunkWeeks(days).map((week) =>
        week.map((date) => ({
          date,
          isCurrentMonth: isSameMonth(date, this.month, this.dateFns),
          isToday: isTodayDate(date, this.dateFns),
          isSelected: this.isSelected(date),
          isDisabled: this.isDisabled(date),
          isRangeStart: this.isRangeStart(date),
          isRangeEnd: this.isRangeEnd(date),
          isInRange: this.isInRange(date),
        }))
      );
    },

    get weekdayLabels() {
      return getWeekdayLabels(this.dateFns);
    },

    prevMonth() {
      this.month = subMonths(this.month, 1, this.dateFns);
    },

    nextMonth() {
      this.month = addMonths(this.month, 1, this.dateFns);
    },

    goToMonth(date: Date) {
      this.month = startOfMonth(date, this.dateFns);
    },

    goToToday() {
      this.goToMonth(new Date());
    },

    select(date: Date | null) {
      if (date === null) {
        this.clear();
        return;
      }

      const day = normalizeDate(date, this.dateFns);

      if (this.isDisabled(day)) {
        return;
      }

      if (this.mode === "single") {
        selectSingleDate(this, day);
        return;
      }

      if (this.mode === "multiple") {
        selectMultipleDate(this, day);
        return;
      }

      selectRangeDate(this, day);
    },

    clear() {
      this.selected = this.mode === "multiple" ? [] : null;
    },

    matches(date: Date, matcher: CalendarMatcher) {
      return matchesCalendarMatcher(date, matcher, this.dateFns);
    },

    isSelected(date: Date) {
      const day = normalizeDate(date, this.dateFns);

      if (this.mode === "single") {
        return isSingleSelected(this.selected, day, this.dateFns);
      }

      if (this.mode === "multiple") {
        return isMultipleSelected(this.selected, day, this.dateFns);
      }

      return isRangeEndpointSelected(this.selected, day, this.dateFns);
    },

    isDisabled(date: Date) {
      return isDateDisabledByRules(
        date,
        config.minDate,
        config.maxDate,
        config.disabled,
        this.dateFns
      );
    },

    isToday(date: Date) {
      return isTodayDate(date, this.dateFns);
    },

    isSameMonth(date: Date, month?: Date) {
      return isSameMonth(date, month ?? calendar.month, calendar.dateFns);
    },

    isInRange(date: Date) {
      if (this.mode !== "range") {
        return false;
      }

      const range = this.selected as CalendarDateRange | null;

      if (!(range?.from && range.to)) {
        return false;
      }

      const day = normalizeDate(date, this.dateFns);

      return (
        isWithinInterval(day, { start: range.from, end: range.to }, this.dateFns) &&
        !isSameDay(day, range.from, this.dateFns) &&
        !isSameDay(day, range.to, this.dateFns)
      );
    },

    isRangeStart(date: Date) {
      const range = this.selected as CalendarDateRange | null;
      return range?.from ? isSameDay(date, range.from, this.dateFns) : false;
    },

    isRangeEnd(date: Date) {
      const range = this.selected as CalendarDateRange | null;
      return range?.to ? isSameDay(date, range.to, this.dateFns) : false;
    },

    format(date: Date, pattern: string) {
      return format(date, pattern, this.dateFns);
    },

    formatMonth(month?: Date) {
      const value = month ?? calendar.month;
      return format(value, "LLLL yyyy", calendar.dateFns);
    },

    formatYear(month?: Date) {
      const value = month ?? calendar.month;
      return format(value, "yyyy", calendar.dateFns);
    },
  };

  return calendar;
}

/** Builds callable `$calendar` magic that returns independent calendar instances. */
export function createCalendarMagic(): CalendarMagic {
  return (options?: CalendarOptions) => createCalendar(options);
}

/** Alpine.js calendar plugin. Registers callable magic `$calendar`. */
export default function calendarPlugin(Alpine: AlpineType.Alpine): void {
  Alpine.magic("calendar", () => createCalendarMagic());
}

declare global {
  namespace Alpine {
    interface Magics<T> {
      $calendar: CalendarMagic;
    }
  }
}
