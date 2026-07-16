import type { CalendarWeekDay, ResolvedCalendarContext } from "./context.js";

export type CalendarDateRangeMatcher = {
  from: Date;
  to: Date;
};

/** Disables dates strictly before `before` (exclusive). */
export type CalendarDateBeforeMatcher = {
  before: Date;
};

/** Disables dates strictly after `after` (exclusive). */
export type CalendarDateAfterMatcher = {
  after: Date;
};

/** Disables dates strictly between `after` and `before` (exclusive endpoints). */
export type CalendarDateIntervalMatcher = {
  before: Date;
  after: Date;
};

/** Disables dates outside the inclusive `only` range. */
export type CalendarDateOnlyMatcher = {
  only: CalendarDateRangeMatcher;
};

export type CalendarDayOfWeekMatcher = {
  dayOfWeek: CalendarWeekDay | CalendarWeekDay[];
};

export type CalendarMatcherFn = (date: Date) => boolean;

export type CalendarMatcher =
  | boolean
  | Date
  | Date[]
  | CalendarDateRangeMatcher
  | CalendarDateBeforeMatcher
  | CalendarDateAfterMatcher
  | CalendarDateIntervalMatcher
  | CalendarDateOnlyMatcher
  | CalendarDayOfWeekMatcher
  | CalendarMatcherFn;

function normalizeMatcherDate(date: Date, context: ResolvedCalendarContext): Date {
  return context.adapter.startOfDay(date, context);
}

function isInclusiveRangeMatcher(matcher: CalendarMatcher): matcher is CalendarDateRangeMatcher {
  return (
    typeof matcher === "object" &&
    matcher !== null &&
    !Array.isArray(matcher) &&
    !(matcher instanceof Date) &&
    "from" in matcher &&
    "to" in matcher &&
    !("only" in matcher)
  );
}

function isDateIntervalMatcher(matcher: CalendarMatcher): matcher is CalendarDateIntervalMatcher {
  return (
    typeof matcher === "object" &&
    matcher !== null &&
    !Array.isArray(matcher) &&
    !(matcher instanceof Date) &&
    "before" in matcher &&
    "after" in matcher
  );
}

function isDateBeforeMatcher(matcher: CalendarMatcher): matcher is CalendarDateBeforeMatcher {
  return (
    typeof matcher === "object" &&
    matcher !== null &&
    !Array.isArray(matcher) &&
    !(matcher instanceof Date) &&
    "before" in matcher &&
    !("after" in matcher)
  );
}

function isDateAfterMatcher(matcher: CalendarMatcher): matcher is CalendarDateAfterMatcher {
  return (
    typeof matcher === "object" &&
    matcher !== null &&
    !Array.isArray(matcher) &&
    !(matcher instanceof Date) &&
    "after" in matcher &&
    !("before" in matcher)
  );
}

function isDateOnlyMatcher(matcher: CalendarMatcher): matcher is CalendarDateOnlyMatcher {
  return (
    typeof matcher === "object" &&
    matcher !== null &&
    !Array.isArray(matcher) &&
    !(matcher instanceof Date) &&
    "only" in matcher
  );
}

function isDayOfWeekMatcher(matcher: CalendarMatcher): matcher is CalendarDayOfWeekMatcher {
  return (
    typeof matcher === "object" &&
    matcher !== null &&
    !Array.isArray(matcher) &&
    !(matcher instanceof Date) &&
    "dayOfWeek" in matcher
  );
}

function matchesInclusiveRange(
  day: Date,
  matcher: CalendarDateRangeMatcher,
  context: ResolvedCalendarContext
): boolean {
  const from = normalizeMatcherDate(matcher.from, context);
  const to = normalizeMatcherDate(matcher.to, context);

  return context.adapter.isWithinInterval(day, { start: from, end: to }, context);
}

function matchesDateOnly(
  day: Date,
  matcher: CalendarDateOnlyMatcher,
  context: ResolvedCalendarContext
): boolean {
  const from = normalizeMatcherDate(matcher.only.from, context);
  const to = normalizeMatcherDate(matcher.only.to, context);

  return context.adapter.isBefore(day, from, context) || context.adapter.isAfter(day, to, context);
}

function matchesDayOfWeek(
  day: Date,
  matcher: CalendarDayOfWeekMatcher,
  context: ResolvedCalendarContext
): boolean {
  const days = Array.isArray(matcher.dayOfWeek) ? matcher.dayOfWeek : [matcher.dayOfWeek];

  return days.includes(context.adapter.getDay(day, context));
}

export function normalizeMatchers(
  disabled?: CalendarMatcher | CalendarMatcher[]
): CalendarMatcher[] {
  if (disabled === undefined) {
    return [];
  }

  return Array.isArray(disabled) ? disabled : [disabled];
}

/** Returns `true` when the date matches the matcher. */
export function matchesCalendarMatcher(
  date: Date,
  matcher: CalendarMatcher,
  context: ResolvedCalendarContext
): boolean {
  const day = normalizeMatcherDate(date, context);

  if (typeof matcher === "boolean") {
    return matcher;
  }

  if (matcher instanceof Date) {
    return context.adapter.isSameDay(day, matcher, context);
  }

  if (Array.isArray(matcher)) {
    return matcher.some((value) => context.adapter.isSameDay(day, value, context));
  }

  if (typeof matcher === "function") {
    return matcher(day);
  }

  if (isDateOnlyMatcher(matcher)) {
    return matchesDateOnly(day, matcher, context);
  }

  if (isInclusiveRangeMatcher(matcher)) {
    return matchesInclusiveRange(day, matcher, context);
  }

  if (isDateIntervalMatcher(matcher)) {
    const before = normalizeMatcherDate(matcher.before, context);
    const after = normalizeMatcherDate(matcher.after, context);

    return (
      context.adapter.isAfter(day, after, context) && context.adapter.isBefore(day, before, context)
    );
  }

  if (isDateBeforeMatcher(matcher)) {
    return context.adapter.isBefore(day, normalizeMatcherDate(matcher.before, context), context);
  }

  if (isDateAfterMatcher(matcher)) {
    return context.adapter.isAfter(day, normalizeMatcherDate(matcher.after, context), context);
  }

  if (isDayOfWeekMatcher(matcher)) {
    return matchesDayOfWeek(day, matcher, context);
  }

  return false;
}

export function matchesAnyCalendarMatcher(
  date: Date,
  matchers: CalendarMatcher[],
  context: ResolvedCalendarContext
): boolean {
  return matchers.some((matcher) => matchesCalendarMatcher(date, matcher, context));
}

export function isDateDisabledByRules(
  date: Date,
  minDate: Date | undefined,
  maxDate: Date | undefined,
  matchers: CalendarMatcher[],
  context: ResolvedCalendarContext
): boolean {
  const day = normalizeMatcherDate(date, context);

  if (minDate && context.adapter.isBefore(day, minDate, context)) {
    return true;
  }

  if (maxDate && context.adapter.isAfter(day, maxDate, context)) {
    return true;
  }

  return matchesAnyCalendarMatcher(day, matchers, context);
}
