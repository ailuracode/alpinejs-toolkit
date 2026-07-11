/**
 * Alpine.js integration for `@ailuracode/alpine-calendar`.
 *
 * Thin adapter — registers callable `$calendar` magic that creates
 * reactive calendar instances backed by {@link CalendarController}.
 * No domain logic lives here.
 *
 * @module
 */

import type AlpineType from "alpinejs";
import { CalendarController } from "./controller.js";
import type { CalendarOptions } from "./types.js";

/** Alpine.js calendar plugin. Registers callable magic `$calendar`. */
export default function calendarPlugin(Alpine: AlpineType.Alpine): void {
  Alpine.magic("calendar", () => {
    return (options?: CalendarOptions) => {
      const controller = new CalendarController(options);

      // Methods use `this` so Alpine.reactive() Proxy routes mutations
      // through the set trap — making state changes trackable.
      const raw = {
        month: controller.month,
        mode: controller.mode,
        selected: controller.selected,
        locale: controller.locale,
        weekStartsOn: controller.weekStartsOn,
        dateFns: controller.dateFns,
        weeks: controller.weeks,
        weekdayLabels: controller.weekdayLabels,

        prevMonth(this: Record<string, unknown>) {
          controller.prevMonth();
          this.month = controller.month;
          this.weeks = controller.weeks;
        },
        nextMonth(this: Record<string, unknown>) {
          controller.nextMonth();
          this.month = controller.month;
          this.weeks = controller.weeks;
        },
        goToMonth(this: Record<string, unknown>, date: Date) {
          controller.goToMonth(date);
          this.month = controller.month;
          this.weeks = controller.weeks;
        },
        goToToday(this: Record<string, unknown>) {
          controller.goToToday();
          this.month = controller.month;
          this.weeks = controller.weeks;
        },
        select(this: Record<string, unknown>, date: Date | null) {
          controller.select(date);
          this.selected = controller.selected;
          this.weeks = controller.weeks;
        },
        clear(this: Record<string, unknown>) {
          controller.clear();
          this.selected = controller.selected;
          this.weeks = controller.weeks;
        },
        matches: (date: Date, matcher: Parameters<CalendarController["matches"]>[1]) =>
          controller.matches(date, matcher),
        isSelected: (date: Date) => controller.isSelected(date),
        isDisabled: (date: Date) => controller.isDisabled(date),
        isToday: (date: Date) => controller.isToday(date),
        isSameMonth: (date: Date, month?: Date) => controller.isSameMonth(date, month),
        isInRange: (date: Date) => controller.isInRange(date),
        isRangeStart: (date: Date) => controller.isRangeStart(date),
        isRangeEnd: (date: Date) => controller.isRangeEnd(date),
        format: (date: Date, pattern: string) => controller.format(date, pattern),
        formatMonth: (month?: Date) => controller.formatMonth(month),
        formatYear: (month?: Date) => controller.formatYear(month),
      };

      return Alpine.reactive(raw);
    };
  });
}

export {
  CalendarController,
  createCalendar,
  createCalendarController,
  createCalendarMagic,
} from "./controller.js";
