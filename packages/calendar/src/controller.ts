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
import { SelectionController } from "@ailuracode/alpine-selection";
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
} from "./internal/selection.js";
import {
  calendarSelectionEquals,
  clearCalendarSelection,
  ensureCalendarSelection,
  readCalendarSelection,
  selectCalendarDate,
} from "./internal/selection-bridge.js";
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

/** Strips `readonly` modifiers so reactive methods can write through `this`. */
type Writable<T> = {
  -readonly [K in keyof T]: T[K];
};

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
  readonly #selection = new SelectionController();
  #month: Date;

  constructor(options: CalendarOptions = {}, id?: string) {
    super(id);
    this.#config = resolveConfig(options);
    this.#month = this.#config.month;
    ensureCalendarSelection(
      this.#selection,
      this.#config.mode,
      this.#config.selected,
      this.#config.context
    );
  }

  // ── Read-only state ──────────────────────────────────────────────

  get month(): Date {
    return this.#month;
  }

  get mode(): CalendarMode {
    return this.#config.mode;
  }

  get selected(): CalendarSelection {
    return readCalendarSelection(this.#selection, this.#config.mode, this.#config.context);
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

    const previous = this.selected;
    const next = selectCalendarDate(
      this.#selection,
      previous,
      day,
      this.#config.mode,
      this.#config.context
    );

    if (!calendarSelectionEquals(next, previous, this.#config.mode, this.#config.context)) {
      this.#emitSelect(date);
    }
  }

  clear(): void {
    if (this.isDestroyed) {
      return;
    }

    const previous = this.selected;
    const next = clearCalendarSelection(this.#selection, this.#config.mode, this.#config.context);

    if (!calendarSelectionEquals(next, previous, this.#config.mode, this.#config.context)) {
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
      return isSingleSelected(this.selected, day, this.#config.context);
    }

    if (this.#config.mode === "multiple") {
      return isMultipleSelected(this.selected, day, this.#config.context);
    }

    return isRangeEndpointSelected(this.selected, day, this.#config.context);
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

    const range = this.selected as CalendarDateRange | null;

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
    const range = this.selected as CalendarDateRange | null;
    return range?.from ? isSameDay(date, range.from, this.#config.context) : false;
  }

  isRangeEnd(date: Date): boolean {
    const range = this.selected as CalendarDateRange | null;
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
    return buildReactiveInstance(this);
  }

  // ── Internals ────────────────────────────────────────────────────

  #emitSelect(date: Date): void {
    const detail: CalendarSelectDetail = {
      date,
      mode: this.#config.mode,
      selected: this.selected,
    };
    this.emit("select", detail);
  }
}

/**
 * Builds a raw CalendarInstance-shaped object backed by the given controller.
 * Methods use `this` so Alpine.reactive() Proxy routes mutations through the set trap.
 */
export function buildReactiveInstance(controller: CalendarController): CalendarInstance {
  return {
    month: controller.month,
    mode: controller.mode,
    selected: controller.selected,
    locale: controller.locale,
    weekStartsOn: controller.weekStartsOn,
    dateFns: controller.dateFns,
    weeks: controller.weeks,
    weekdayLabels: controller.weekdayLabels,

    prevMonth(this: Writable<CalendarInstance>) {
      controller.prevMonth();
      this.month = controller.month;
      this.weeks = controller.weeks;
    },
    nextMonth(this: Writable<CalendarInstance>) {
      controller.nextMonth();
      this.month = controller.month;
      this.weeks = controller.weeks;
    },
    goToMonth(this: Writable<CalendarInstance>, date: Date) {
      controller.goToMonth(date);
      this.month = controller.month;
      this.weeks = controller.weeks;
    },
    goToToday(this: Writable<CalendarInstance>) {
      controller.goToToday();
      this.month = controller.month;
      this.weeks = controller.weeks;
    },
    select(this: Writable<CalendarInstance>, date: Date | null) {
      controller.select(date);
      this.selected = controller.selected;
      this.weeks = controller.weeks;
    },
    clear(this: Writable<CalendarInstance>) {
      controller.clear();
      this.selected = controller.selected;
      this.weeks = controller.weeks;
    },
    matches: (date, matcher) => controller.matches(date, matcher),
    isSelected: (date) => controller.isSelected(date),
    isDisabled: (date) => controller.isDisabled(date),
    isToday: (date) => controller.isToday(date),
    isSameMonth: (date, month) => controller.isSameMonth(date, month),
    isInRange: (date) => controller.isInRange(date),
    isRangeStart: (date) => controller.isRangeStart(date),
    isRangeEnd: (date) => controller.isRangeEnd(date),
    format: (date, pattern) => controller.format(date, pattern),
    formatMonth: (month) => controller.formatMonth(month),
    formatYear: (month) => controller.formatYear(month),
  } satisfies CalendarInstance;
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
    const raw = buildReactiveInstance(new CalendarController(options));
    return Alpine ? Alpine.reactive(raw) : raw;
  };
}
