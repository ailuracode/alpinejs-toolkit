/**
 * Headless calendar controller. Manages month navigation, selection
 * (single / multiple / range), date matching, and formatting.
 *
 * Framework-agnostic — the Alpine adapter in `plugin.ts` wraps this
 * via `toStore()`.
 *
 * @module
 */

import { BaseController } from "@ailuracode/alpine-core";
import type { Day, Locale } from "date-fns";
import {
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  isToday as isTodayDate,
  isWithinInterval,
  startOfMonth,
  subMonths,
} from "date-fns";
import { resolveDateFnsContext } from "./context.js";
import type { CalendarEvents, CalendarSelectDetail } from "./events.js";
import { chunkWeeks, getMonthDays, getWeekdayLabels, normalizeDate } from "./internal/grid.js";
import {
  isMultipleSelected,
  isRangeEndpointSelected,
  isSingleSelected,
  normalizeSelection,
  selectMultipleDate,
  selectRangeDate,
  selectSingleDate,
} from "./internal/selection.js";
import { isDateDisabledByRules, matchesCalendarMatcher, normalizeMatchers } from "./matchers.js";
import type {
  CalendarDateRange,
  CalendarDay,
  CalendarInstance,
  CalendarMagic,
  CalendarMode,
  CalendarOptions,
  CalendarSelection,
  ResolvedCalendarConfig,
} from "./types.js";

function resolveConfig(options: CalendarOptions = {}): ResolvedCalendarConfig {
  const context = resolveDateFnsContext(options);

  return Object.freeze({
    context,
    minDate: options.minDate ? normalizeDate(options.minDate, context) : undefined,
    maxDate: options.maxDate ? normalizeDate(options.maxDate, context) : undefined,
    mode: options.mode ?? "single",
    month: startOfMonth(options.month ?? new Date(), context),
    selected: normalizeSelection(options.selected ?? null, options.mode ?? "single", context),
    disabled: normalizeMatchers(options.disabled),
  });
}

/**
 * Headless calendar controller. Manages month grid, selection, and
 * formatting. All mutable state is private — exposed through getters
 * and selection commands.
 */
export class CalendarController extends BaseController<CalendarEvents> {
  readonly #config: ResolvedCalendarConfig;
  #month: Date;
  #selected: CalendarSelection;

  constructor(options: CalendarOptions = {}, id?: string) {
    super(id);
    this.#config = resolveConfig(options);
    this.#month = this.#config.month;
    this.#selected = this.#config.selected;
  }

  // ── Read-only state ──────────────────────────────────────────────

  get month(): Date {
    return this.#month;
  }

  get mode(): CalendarMode {
    return this.#config.mode;
  }

  get selected(): CalendarSelection {
    return this.#selected;
  }

  get locale(): Locale {
    return this.#config.context.locale;
  }

  get weekStartsOn(): Day {
    return this.#config.context.weekStartsOn;
  }

  get dateFns() {
    return this.#config.context;
  }

  // ── Derived state ────────────────────────────────────────────────

  get weeks(): CalendarDay[][] {
    const days = getMonthDays(this.#month, this.#config.context);

    return chunkWeeks(days).map((week) =>
      week.map((date) => ({
        date,
        isCurrentMonth: isSameMonth(date, this.#month, this.#config.context),
        isToday: isTodayDate(date, this.#config.context),
        isSelected: this.isSelected(date),
        isDisabled: this.isDisabled(date),
        isRangeStart: this.isRangeStart(date),
        isRangeEnd: this.isRangeEnd(date),
        isInRange: this.isInRange(date),
      }))
    );
  }

  get weekdayLabels(): string[] {
    return getWeekdayLabels(this.#config.context);
  }

  // ── Navigation commands ──────────────────────────────────────────

  prevMonth(): void {
    if (this.isDestroyed) {
      return;
    }
    this.#month = subMonths(this.#month, 1, this.#config.context);
    this.emit("monthChange", { month: this.#month });
  }

  nextMonth(): void {
    if (this.isDestroyed) {
      return;
    }
    this.#month = addMonths(this.#month, 1, this.#config.context);
    this.emit("monthChange", { month: this.#month });
  }

  goToMonth(date: Date): void {
    if (this.isDestroyed) {
      return;
    }
    this.#month = startOfMonth(date, this.#config.context);
    this.emit("monthChange", { month: this.#month });
  }

  goToToday(): void {
    this.goToMonth(new Date());
  }

  // ── Selection commands ───────────────────────────────────────────

  select(date: Date | null): void {
    if (this.isDestroyed) {
      return;
    }

    if (date === null) {
      this.clear();
      return;
    }

    const day = normalizeDate(date, this.#config.context);

    if (this.isDisabled(day)) {
      return;
    }

    const previous = this.#selected;

    if (this.#config.mode === "single") {
      this.#selected = selectSingleDate(previous, day);
    } else if (this.#config.mode === "multiple") {
      this.#selected = selectMultipleDate(previous, day, this.#config.context);
    } else {
      this.#selected = selectRangeDate(previous, day, this.#config.context);
    }

    if (this.#selected !== previous) {
      this.#emitSelect(date);
    }
  }

  clear(): void {
    if (this.isDestroyed) {
      return;
    }

    const previous = this.#selected;
    this.#selected = this.#config.mode === "multiple" ? [] : null;

    if (this.#selected !== previous) {
      this.emit("clear", undefined);
    }
  }

  // ── Query helpers ────────────────────────────────────────────────

  matches(date: Date, matcher: Parameters<typeof matchesCalendarMatcher>[1]): boolean {
    return matchesCalendarMatcher(date, matcher, this.#config.context);
  }

  isSelected(date: Date): boolean {
    const day = normalizeDate(date, this.#config.context);

    if (this.#config.mode === "single") {
      return isSingleSelected(this.#selected, day, this.#config.context);
    }

    if (this.#config.mode === "multiple") {
      return isMultipleSelected(this.#selected, day, this.#config.context);
    }

    return isRangeEndpointSelected(this.#selected, day, this.#config.context);
  }

  isDisabled(date: Date): boolean {
    return isDateDisabledByRules(
      date,
      this.#config.minDate,
      this.#config.maxDate,
      this.#config.disabled,
      this.#config.context
    );
  }

  isToday(date: Date): boolean {
    return isTodayDate(date, this.#config.context);
  }

  isSameMonth(date: Date, month?: Date): boolean {
    return isSameMonth(date, month ?? this.#month, this.#config.context);
  }

  isInRange(date: Date): boolean {
    if (this.#config.mode !== "range") {
      return false;
    }

    const range = this.#selected as CalendarDateRange | null;

    if (!(range?.from && range.to)) {
      return false;
    }

    const day = normalizeDate(date, this.#config.context);

    return (
      isWithinInterval(day, { start: range.from, end: range.to }, this.#config.context) &&
      !isSameDay(day, range.from, this.#config.context) &&
      !isSameDay(day, range.to, this.#config.context)
    );
  }

  isRangeStart(date: Date): boolean {
    const range = this.#selected as CalendarDateRange | null;
    return range?.from ? isSameDay(date, range.from, this.#config.context) : false;
  }

  isRangeEnd(date: Date): boolean {
    const range = this.#selected as CalendarDateRange | null;
    return range?.to ? isSameDay(date, range.to, this.#config.context) : false;
  }

  // ── Formatting ───────────────────────────────────────────────────

  format(date: Date, pattern: string): string {
    return format(date, pattern, this.#config.context);
  }

  formatMonth(month?: Date): string {
    return format(month ?? this.#month, "LLLL yyyy", this.#config.context);
  }

  formatYear(month?: Date): string {
    return format(month ?? this.#month, "yyyy", this.#config.context);
  }

  // ── Backward-compatible adapter ──────────────────────────────────

  /**
   * Returns a store-shaped object matching the `CalendarInstance`
   * interface. Delegates to this controller — mutations flow through
   * the controller and trigger events.
   */
  toStore(): CalendarInstance {
    const self = this;

    const store = {
      month: self.month,
      mode: self.mode,
      selected: self.selected,
      locale: self.locale,
      weekStartsOn: self.weekStartsOn,
      dateFns: self.dateFns,
      weeks: self.weeks,
      weekdayLabels: self.weekdayLabels,

      prevMonth() {
        self.prevMonth();
        store.month = self.month;
        store.weeks = self.weeks;
      },
      nextMonth() {
        self.nextMonth();
        store.month = self.month;
        store.weeks = self.weeks;
      },
      goToMonth(date: Date) {
        self.goToMonth(date);
        store.month = self.month;
        store.weeks = self.weeks;
      },
      goToToday() {
        self.goToToday();
        store.month = self.month;
        store.weeks = self.weeks;
      },
      select(date: Date | null) {
        self.select(date);
        store.selected = self.selected;
        store.weeks = self.weeks;
      },
      clear() {
        self.clear();
        store.selected = self.selected;
        store.weeks = self.weeks;
      },
      matches: (date: Date, matcher) => self.matches(date, matcher),
      isSelected: (date: Date) => self.isSelected(date),
      isDisabled: (date: Date) => self.isDisabled(date),
      isToday: (date: Date) => self.isToday(date),
      isSameMonth: (date: Date, month?: Date) => self.isSameMonth(date, month),
      isInRange: (date: Date) => self.isInRange(date),
      isRangeStart: (date: Date) => self.isRangeStart(date),
      isRangeEnd: (date: Date) => self.isRangeEnd(date),
      format: (date: Date, pattern: string) => self.format(date, pattern),
      formatMonth: (month?: Date) => self.formatMonth(month),
      formatYear: (month?: Date) => self.formatYear(month),
    } satisfies CalendarInstance;

    return store;
  }

  // ── Internals ────────────────────────────────────────────────────

  #emitSelect(date: Date): void {
    const detail: CalendarSelectDetail = {
      date,
      mode: this.#config.mode,
      selected: this.#selected,
    };
    this.emit("select", detail);
  }
}

/** Creates a CalendarController. */
export function createCalendarController(
  options?: CalendarOptions,
  id?: string
): CalendarController {
  return new CalendarController(options, id);
}

/**
 * Creates an independent calendar instance backed by a controller.
 * Backward-compatible alias for existing consumers.
 */
export function createCalendar(options?: CalendarOptions): CalendarInstance {
  return new CalendarController(options).toStore();
}

/** Builds callable `$calendar` magic that returns independent calendar instances. */
export function createCalendarMagic(Alpine?: { reactive: <T>(value: T) => T }): CalendarMagic {
  return (options?: CalendarOptions) => {
    const controller = new CalendarController(options);
    const store = controller.toStore();
    return Alpine ? Alpine.reactive(store) : store;
  };
}
