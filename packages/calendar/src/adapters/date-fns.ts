/**
 * date-fns calendar adapter — opt-in via `@ailuracode/alpine-calendar/date-fns`.
 */

import type {
  ContextOptions,
  Day,
  FirstWeekContainsDateOptions,
  FormatOptions,
  Locale,
  WeekOptions,
} from "date-fns";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  isToday,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { enUS } from "date-fns/locale";
import type {
  CalendarDateAdapter,
  CalendarDateAdapterOptions,
  CalendarDateContext,
  CalendarWeekDay,
} from "./types.js";

export type CalendarDateFnsOptions = ContextOptions<Date> &
  WeekOptions &
  FirstWeekContainsDateOptions &
  Pick<FormatOptions, "useAdditionalWeekYearTokens" | "useAdditionalDayOfYearTokens"> & {
    locale?: Locale;
  };

export type ResolvedDateFnsContext = CalendarDateFnsOptions & {
  locale: Locale;
  weekStartsOn: Day;
};

type DateFnsOptionInput = CalendarDateAdapterOptions & {
  dateFns?: CalendarDateFnsOptions;
};

function toDateFnsContext(context: CalendarDateContext): ResolvedDateFnsContext {
  const locale = (context.locale as { dateFnsLocale?: Locale }).dateFnsLocale ?? enUS;
  return {
    locale,
    weekStartsOn: context.weekStartsOn as Day,
  };
}

function isDateFnsLocale(value: unknown): value is Locale {
  return typeof value === "object" && value !== null && "localize" in value;
}

function resolveDateFnsContext(options: DateFnsOptionInput = {}): ResolvedDateFnsContext {
  const dateFns = options.dateFns ?? {};
  let locale = dateFns.locale ?? enUS;

  if (isDateFnsLocale(options.locale)) {
    locale = options.locale;
  }

  return {
    ...dateFns,
    locale,
    weekStartsOn: (options.weekStartsOn ?? dateFns.weekStartsOn ?? 0) as Day,
  };
}

function createContext(options: DateFnsOptionInput = {}): CalendarDateContext {
  const resolved = resolveDateFnsContext(options);
  const { locale: dateFnsLocale, weekStartsOn, ...dateFnsExtras } = resolved;

  return {
    ...dateFnsExtras,
    locale: {
      tag: dateFnsLocale.code ?? "en-US",
      dateFnsLocale,
    },
    weekStartsOn: weekStartsOn as CalendarWeekDay,
  } as CalendarDateContext;
}

export function createDateFnsCalendarAdapter(
  options: DateFnsOptionInput = {}
): CalendarDateAdapter {
  const resolveContext = (overrides: DateFnsOptionInput = {}) =>
    createContext({ ...options, ...overrides });

  return {
    id: "date-fns",
    resolveContext,

    startOfDay(date, context) {
      return startOfDay(date, toDateFnsContext(context));
    },

    startOfMonth(date, context) {
      return startOfMonth(date, toDateFnsContext(context));
    },

    endOfMonth(date, context) {
      return endOfMonth(date, toDateFnsContext(context));
    },

    startOfWeek(date, context) {
      return startOfWeek(date, toDateFnsContext(context));
    },

    endOfWeek(date, context) {
      return endOfWeek(date, toDateFnsContext(context));
    },

    addDays(date, amount, context) {
      return addDays(date, amount, toDateFnsContext(context));
    },

    addMonths(date, amount, context) {
      return addMonths(date, amount, toDateFnsContext(context));
    },

    subMonths(date, amount, context) {
      return subMonths(date, amount, toDateFnsContext(context));
    },

    eachDayOfInterval(interval, context) {
      const ctx = toDateFnsContext(context);
      return eachDayOfInterval({ start: interval.start, end: interval.end }, ctx);
    },

    isSameDay(left, right, context) {
      return isSameDay(left, right, toDateFnsContext(context));
    },

    isSameMonth(left, right, context) {
      return isSameMonth(left, right, toDateFnsContext(context));
    },

    isBefore(left, right, context) {
      const ctx = toDateFnsContext(context);
      return startOfDay(left, ctx).getTime() < startOfDay(right, ctx).getTime();
    },

    isAfter(left, right, context) {
      const ctx = toDateFnsContext(context);
      return startOfDay(left, ctx).getTime() > startOfDay(right, ctx).getTime();
    },

    isToday(date, context) {
      return isToday(date, toDateFnsContext(context));
    },

    isWithinInterval(date, interval, context) {
      return isWithinInterval(date, interval, toDateFnsContext(context));
    },

    getDay(date, context) {
      return getDay(date, toDateFnsContext(context)) as CalendarWeekDay;
    },

    formatWeekdayLabel(date, context) {
      return format(date, "EEEEEE", toDateFnsContext(context));
    },

    formatMonthLabel(date, context) {
      return format(date, "LLLL yyyy", toDateFnsContext(context));
    },

    formatYear(date, context) {
      return format(date, "yyyy", toDateFnsContext(context));
    },

    formatPattern(date, pattern, context) {
      return format(date, pattern, toDateFnsContext(context));
    },

    toSelectionKey(date, context) {
      return format(
        startOfDay(date, toDateFnsContext(context)),
        "yyyy-MM-dd",
        toDateFnsContext(context)
      );
    },

    fromSelectionKey(key, context) {
      const [year, month, day] = key.split("-").map(Number);
      return startOfDay(new Date(year, month - 1, day), toDateFnsContext(context));
    },
  };
}

export type {
  CalendarDateAdapterOptions,
  CalendarDateContext,
  ResolvedCalendarContext,
} from "./types.js";
export { resolveDateFnsContext };
