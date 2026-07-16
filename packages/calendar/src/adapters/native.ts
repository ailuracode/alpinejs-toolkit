/**
 * Native calendar date adapter — no date-fns dependency.
 */

import type {
  CalendarDateAdapter,
  CalendarDateAdapterOptions,
  CalendarDateContext,
  CalendarDateInterval,
  CalendarWeekDay,
} from "./types.js";
import { resolveLocaleTag } from "./types.js";

const DEFAULT_WEEK_STARTS_ON: CalendarWeekDay = 0;

function cloneDate(date: Date): Date {
  return new Date(date.getTime());
}

function calendarDay(date: Date): { year: number; month: number; day: number } {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  };
}

function fromCalendarDay(parts: { year: number; month: number; day: number }): Date {
  return new Date(parts.year, parts.month, parts.day);
}

function normalizeWeekDay(day: number): CalendarWeekDay {
  const normalized = day % 7;
  return (normalized < 0 ? normalized + 7 : normalized) as CalendarWeekDay;
}

function compareCalendarDays(left: Date, right: Date): number {
  const a = calendarDay(left);
  const b = calendarDay(right);

  if (a.year !== b.year) {
    return a.year - b.year;
  }

  if (a.month !== b.month) {
    return a.month - b.month;
  }

  return a.day - b.day;
}

function addMonthsClamped(date: Date, amount: number): Date {
  const parts = calendarDay(date);
  const targetMonth = parts.month + amount;
  const year = parts.year + Math.floor(targetMonth / 12);
  const month = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const day = Math.min(parts.day, lastDay);
  return new Date(year, month, day);
}

function weekOffset(date: Date, weekStartsOn: CalendarWeekDay): number {
  const day = normalizeWeekDay(date.getDay());
  return (day - weekStartsOn + 7) % 7;
}

function formatYyyyMmDd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createIntl(localeTag: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(localeTag, options);
}

export const nativeCalendarDateAdapter: CalendarDateAdapter = {
  id: "native",

  resolveContext(options: CalendarDateAdapterOptions = {}): CalendarDateContext {
    return {
      locale: resolveLocaleTag(options.locale),
      weekStartsOn: options.weekStartsOn ?? DEFAULT_WEEK_STARTS_ON,
    };
  },

  startOfDay(date: Date): Date {
    const parts = calendarDay(date);
    return fromCalendarDay(parts);
  },

  startOfMonth(date: Date): Date {
    const parts = calendarDay(date);
    return fromCalendarDay({ year: parts.year, month: parts.month, day: 1 });
  },

  endOfMonth(date: Date): Date {
    const parts = calendarDay(date);
    const lastDay = new Date(parts.year, parts.month + 1, 0).getDate();
    return fromCalendarDay({ year: parts.year, month: parts.month, day: lastDay });
  },

  startOfWeek(date: Date, context: CalendarDateContext): Date {
    const offset = weekOffset(date, context.weekStartsOn);
    return this.startOfDay(this.addDays(date, -offset, context), context);
  },

  endOfWeek(date: Date, context: CalendarDateContext): Date {
    const offset = weekOffset(date, context.weekStartsOn);
    return this.startOfDay(this.addDays(date, 6 - offset, context), context);
  },

  addDays(date: Date, amount: number): Date {
    const next = cloneDate(date);
    next.setDate(next.getDate() + amount);
    return this.startOfDay(next, { locale: { tag: "en-US" }, weekStartsOn: 0 });
  },

  addMonths(date: Date, amount: number): Date {
    return this.startOfDay(addMonthsClamped(date, amount), {
      locale: { tag: "en-US" },
      weekStartsOn: 0,
    });
  },

  subMonths(date: Date, amount: number, context: CalendarDateContext): Date {
    return this.addMonths(date, -amount, context);
  },

  eachDayOfInterval(interval: CalendarDateInterval, context: CalendarDateContext): Date[] {
    const days: Date[] = [];
    let cursor = this.startOfDay(interval.start, context);
    const end = this.startOfDay(interval.end, context);

    while (compareCalendarDays(cursor, end) <= 0) {
      days.push(cursor);
      cursor = this.addDays(cursor, 1, context);
    }

    return days;
  },

  isSameDay(left: Date, right: Date): boolean {
    return compareCalendarDays(left, right) === 0;
  },

  isSameMonth(left: Date, right: Date): boolean {
    const a = calendarDay(left);
    const b = calendarDay(right);
    return a.year === b.year && a.month === b.month;
  },

  isBefore(left: Date, right: Date): boolean {
    return compareCalendarDays(left, right) < 0;
  },

  isAfter(left: Date, right: Date): boolean {
    return compareCalendarDays(left, right) > 0;
  },

  isToday(date: Date, context: CalendarDateContext): boolean {
    return this.isSameDay(date, new Date(), context);
  },

  isWithinInterval(
    date: Date,
    interval: CalendarDateInterval,
    context: CalendarDateContext
  ): boolean {
    const day = this.startOfDay(date, context);
    const start = this.startOfDay(interval.start, context);
    const end = this.startOfDay(interval.end, context);
    return compareCalendarDays(day, start) >= 0 && compareCalendarDays(day, end) <= 0;
  },

  getDay(date: Date): CalendarWeekDay {
    return normalizeWeekDay(date.getDay());
  },

  formatWeekdayLabel(date: Date, context: CalendarDateContext): string {
    return createIntl(context.locale.tag, { weekday: "narrow" }).format(date);
  },

  formatMonthLabel(date: Date, context: CalendarDateContext): string {
    const month = createIntl(context.locale.tag, { month: "long" }).format(date);
    return `${month} ${date.getFullYear()}`;
  },

  formatYear(date: Date): string {
    return String(date.getFullYear());
  },

  formatPattern(date: Date, pattern: string, context: CalendarDateContext): string {
    if (pattern === "yyyy-MM-dd") {
      return this.toSelectionKey(date, context);
    }

    if (pattern === "LLLL yyyy") {
      return this.formatMonthLabel(date, context);
    }

    if (pattern === "yyyy") {
      return this.formatYear(date, context);
    }

    if (pattern === "EEEEEE") {
      return this.formatWeekdayLabel(date, context);
    }

    throw new Error(
      `[alpine-calendar] Pattern "${pattern}" requires @ailuracode/alpine-calendar/date-fns`
    );
  },

  toSelectionKey(date: Date, context: CalendarDateContext): string {
    return formatYyyyMmDd(this.startOfDay(date, context));
  },

  fromSelectionKey(key: string, context: CalendarDateContext): Date {
    const [year, month, day] = key.split("-").map(Number);
    return this.startOfDay(new Date(year, month - 1, day), context);
  },
};

export function createNativeCalendarDateAdapter(): CalendarDateAdapter {
  return nativeCalendarDateAdapter;
}
