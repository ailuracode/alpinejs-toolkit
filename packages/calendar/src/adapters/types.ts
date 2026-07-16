/**
 * Calendar date adapter contract.
 *
 * Default calendar runtime uses the native adapter (`Date` + `Intl`).
 * Optional date-fns behavior lives in `@ailuracode/alpine-calendar/date-fns`.
 */

export type CalendarWeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface CalendarLocale {
  readonly tag: string;
}

export interface CalendarDateContext {
  readonly locale: CalendarLocale;
  readonly weekStartsOn: CalendarWeekDay;
}

export interface CalendarDateAdapterOptions {
  readonly locale?: string | CalendarLocale;
  readonly weekStartsOn?: CalendarWeekDay;
}

export interface CalendarDateInterval {
  readonly start: Date;
  readonly end: Date;
}

export interface CalendarDateAdapter {
  readonly id: string;
  resolveContext(options?: CalendarDateAdapterOptions): CalendarDateContext;
  startOfDay(date: Date, context: CalendarDateContext): Date;
  startOfMonth(date: Date, context: CalendarDateContext): Date;
  endOfMonth(date: Date, context: CalendarDateContext): Date;
  startOfWeek(date: Date, context: CalendarDateContext): Date;
  endOfWeek(date: Date, context: CalendarDateContext): Date;
  addDays(date: Date, amount: number, context: CalendarDateContext): Date;
  addMonths(date: Date, amount: number, context: CalendarDateContext): Date;
  subMonths(date: Date, amount: number, context: CalendarDateContext): Date;
  eachDayOfInterval(interval: CalendarDateInterval, context: CalendarDateContext): Date[];
  isSameDay(left: Date, right: Date, context: CalendarDateContext): boolean;
  isSameMonth(left: Date, right: Date, context: CalendarDateContext): boolean;
  isBefore(left: Date, right: Date, context: CalendarDateContext): boolean;
  isAfter(left: Date, right: Date, context: CalendarDateContext): boolean;
  isToday(date: Date, context: CalendarDateContext): boolean;
  isWithinInterval(
    date: Date,
    interval: CalendarDateInterval,
    context: CalendarDateContext
  ): boolean;
  getDay(date: Date, context: CalendarDateContext): CalendarWeekDay;
  formatWeekdayLabel(date: Date, context: CalendarDateContext): string;
  formatMonthLabel(date: Date, context: CalendarDateContext): string;
  formatYear(date: Date, context: CalendarDateContext): string;
  formatPattern(date: Date, pattern: string, context: CalendarDateContext): string;
  toSelectionKey(date: Date, context: CalendarDateContext): string;
  fromSelectionKey(key: string, context: CalendarDateContext): Date;
}

export type ResolvedCalendarContext = CalendarDateContext & {
  readonly adapter: CalendarDateAdapter;
};

export function resolveLocaleTag(locale?: string | CalendarLocale): CalendarLocale {
  if (typeof locale === "string") {
    return { tag: locale };
  }

  return locale ?? { tag: "en-US" };
}

export function resolveCalendarContext(
  adapter: CalendarDateAdapter,
  options: CalendarDateAdapterOptions = {}
): ResolvedCalendarContext {
  const base = adapter.resolveContext(options);
  return {
    ...base,
    adapter,
  };
}
