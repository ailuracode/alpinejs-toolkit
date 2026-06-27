import type AlpineType from "alpinejs";
import { es } from "date-fns/locale";
import { describe, expect, it, vi } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine.js";
import calendarPlugin, {
  type CalendarInstance,
  type CalendarMagic,
  createCalendar,
  createCalendarMagic,
} from "../src/index.js";

const JAN_2024 = new Date(2024, 0, 15);
const FEB_2024 = new Date(2024, 1, 10);

describe("@ailuracode/alpinejs-calendar", () => {
  describe("createCalendar()", () => {
    it("builds a month grid with leading and trailing outside days", () => {
      const cal = createCalendar({ month: JAN_2024, weekStartsOn: 0 });

      expect(cal.weeks).toHaveLength(5);
      expect(cal.weeks[0]).toHaveLength(7);
      expect(cal.weeks[0]?.[0]?.isCurrentMonth).toBe(false);
      expect(cal.weeks.at(-1)?.some((day) => !day.isCurrentMonth)).toBe(true);
      expect(cal.weeks.flat().filter((day) => day.isCurrentMonth)).toHaveLength(31);
    });

    it("exposes localized weekday labels", () => {
      const cal = createCalendar({ locale: es, weekStartsOn: 1 });

      expect(cal.weekdayLabels).toHaveLength(7);
      expect(cal.weekdayLabels[0]).toBe("lu");
    });

    it("navigates months", () => {
      const cal = createCalendar({ month: JAN_2024 });

      cal.nextMonth();
      expect(cal.month.getMonth()).toBe(1);

      cal.prevMonth();
      expect(cal.month.getMonth()).toBe(0);

      cal.goToMonth(FEB_2024);
      expect(cal.month.getMonth()).toBe(1);
      expect(cal.month.getDate()).toBe(1);
    });

    it("selects a single date", () => {
      const cal = createCalendar({ month: JAN_2024, mode: "single" });
      const day = new Date(2024, 0, 8);

      cal.select(day);

      expect(cal.selected).toEqual(new Date(2024, 0, 8));
      expect(cal.isSelected(day)).toBe(true);
      expect(cal.weeks.flat().find((entry) => entry.date.getDate() === 8)?.isSelected).toBe(true);
    });

    it("toggles multiple dates", () => {
      const cal = createCalendar({ month: JAN_2024, mode: "multiple" });
      const first = new Date(2024, 0, 3);
      const second = new Date(2024, 0, 4);

      cal.select(first);
      cal.select(second);
      expect(cal.isSelected(first)).toBe(true);
      expect(cal.isSelected(second)).toBe(true);

      cal.select(first);
      expect(cal.isSelected(first)).toBe(false);
      expect(cal.isSelected(second)).toBe(true);
    });

    it("selects a date range in two clicks", () => {
      const cal = createCalendar({ month: JAN_2024, mode: "range" });
      const start = new Date(2024, 0, 5);
      const end = new Date(2024, 0, 9);
      const middle = new Date(2024, 0, 7);

      cal.select(start);
      expect(cal.isRangeStart(start)).toBe(true);

      cal.select(end);
      expect(cal.isRangeEnd(end)).toBe(true);
      expect(cal.isInRange(middle)).toBe(true);
      expect(cal.weeks.flat().find((entry) => entry.date.getDate() === 7)?.isInRange).toBe(true);
    });

    it("reorders range selection when the second date is earlier", () => {
      const cal = createCalendar({ month: JAN_2024, mode: "range" });
      const later = new Date(2024, 0, 12);
      const earlier = new Date(2024, 0, 4);

      cal.select(later);
      cal.select(earlier);

      expect(cal.isRangeStart(earlier)).toBe(true);
      expect(cal.isRangeEnd(later)).toBe(true);
    });

    it("respects minDate and maxDate constraints", () => {
      const cal = createCalendar({
        month: JAN_2024,
        minDate: new Date(2024, 0, 5),
        maxDate: new Date(2024, 0, 25),
      });

      const blocked = new Date(2024, 0, 2);
      const allowed = new Date(2024, 0, 10);

      expect(cal.isDisabled(blocked)).toBe(true);
      expect(cal.isDisabled(allowed)).toBe(false);

      cal.select(blocked);
      expect(cal.selected).toBeNull();

      cal.select(allowed);
      expect(cal.isSelected(allowed)).toBe(true);
    });

    it("disables individual dates", () => {
      const blocked = new Date(2024, 0, 10);
      const cal = createCalendar({
        month: JAN_2024,
        disabled: blocked,
      });

      expect(cal.isDisabled(blocked)).toBe(true);
      expect(cal.isDisabled(new Date(2024, 0, 11))).toBe(false);

      cal.select(blocked);
      expect(cal.selected).toBeNull();
    });

    it("disables multiple loose dates", () => {
      const cal = createCalendar({
        month: JAN_2024,
        disabled: [new Date(2024, 0, 3), new Date(2024, 0, 17)],
      });

      expect(cal.isDisabled(new Date(2024, 0, 3))).toBe(true);
      expect(cal.isDisabled(new Date(2024, 0, 17))).toBe(true);
      expect(cal.isDisabled(new Date(2024, 0, 4))).toBe(false);
    });

    it("disables inclusive date ranges", () => {
      const cal = createCalendar({
        month: JAN_2024,
        disabled: { from: new Date(2024, 0, 8), to: new Date(2024, 0, 12) },
      });

      expect(cal.isDisabled(new Date(2024, 0, 7))).toBe(false);
      expect(cal.isDisabled(new Date(2024, 0, 8))).toBe(true);
      expect(cal.isDisabled(new Date(2024, 0, 10))).toBe(true);
      expect(cal.isDisabled(new Date(2024, 0, 12))).toBe(true);
      expect(cal.isDisabled(new Date(2024, 0, 13))).toBe(false);
    });

    it("disables exclusive intervals between two bounds", () => {
      const cal = createCalendar({
        month: JAN_2024,
        disabled: { after: new Date(2024, 0, 7), before: new Date(2024, 0, 13) },
      });

      expect(cal.isDisabled(new Date(2024, 0, 7))).toBe(false);
      expect(cal.isDisabled(new Date(2024, 0, 8))).toBe(true);
      expect(cal.isDisabled(new Date(2024, 0, 12))).toBe(true);
      expect(cal.isDisabled(new Date(2024, 0, 13))).toBe(false);
    });

    it("disables dates outside an only range", () => {
      const cal = createCalendar({
        month: JAN_2024,
        disabled: { only: { from: new Date(2024, 0, 8), to: new Date(2024, 0, 12) } },
      });

      expect(cal.isDisabled(new Date(2024, 0, 7))).toBe(true);
      expect(cal.isDisabled(new Date(2024, 0, 8))).toBe(false);
      expect(cal.isDisabled(new Date(2024, 0, 12))).toBe(false);
      expect(cal.isDisabled(new Date(2024, 0, 13))).toBe(true);
    });

    it("disables weekdays and custom matchers", () => {
      const weekendCal = createCalendar({
        month: JAN_2024,
        disabled: { dayOfWeek: [0, 6] },
      });

      expect(weekendCal.isDisabled(new Date(2024, 0, 6))).toBe(true);
      expect(weekendCal.isDisabled(new Date(2024, 0, 8))).toBe(false);

      const customCal = createCalendar({
        month: JAN_2024,
        disabled: (date) => date.getDate() % 2 === 0,
      });

      expect(customCal.isDisabled(new Date(2024, 0, 10))).toBe(true);
      expect(customCal.isDisabled(new Date(2024, 0, 11))).toBe(false);
    });

    it("combines multiple disabled matchers", () => {
      const cal = createCalendar({
        month: JAN_2024,
        disabled: [
          new Date(2024, 0, 2),
          { from: new Date(2024, 0, 20), to: new Date(2024, 0, 22) },
          { dayOfWeek: [0] },
        ],
      });

      expect(cal.isDisabled(new Date(2024, 0, 2))).toBe(true);
      expect(cal.isDisabled(new Date(2024, 0, 21))).toBe(true);
      expect(cal.isDisabled(new Date(2024, 0, 7))).toBe(true);
      expect(cal.isDisabled(new Date(2024, 0, 9))).toBe(false);
    });

    it("exposes matches() for arbitrary matchers", () => {
      const cal = createCalendar({ month: JAN_2024 });

      expect(cal.matches(new Date(2024, 0, 10), { before: new Date(2024, 0, 15) })).toBe(true);
      expect(cal.matches(new Date(2024, 0, 20), { before: new Date(2024, 0, 15) })).toBe(false);
    });

    it("merges dateFns options with top-level shortcuts", () => {
      const cal = createCalendar({
        month: JAN_2024,
        weekStartsOn: 1,
        dateFns: {
          firstWeekContainsDate: 4,
        },
      });

      expect(cal.weekStartsOn).toBe(1);
      expect(cal.dateFns.firstWeekContainsDate).toBe(4);
      expect(cal.weekdayLabels[0]).toBe("Mo");
    });

    it("formats dates with the configured locale", () => {
      const cal = createCalendar({ month: JAN_2024, locale: es });

      expect(cal.formatMonth()).toContain("2024");
      expect(cal.formatYear()).toBe("2024");
      expect(cal.format(new Date(2024, 0, 15), "d MMM")).toBe("15 ene");
    });

    it("creates independent instances", () => {
      const first = createCalendar({ month: JAN_2024 });
      const second = createCalendar({ month: FEB_2024 });

      first.select(new Date(2024, 0, 2));

      expect(first.selected).not.toBeNull();
      expect(second.selected).toBeNull();
      expect(first.month.getMonth()).toBe(0);
      expect(second.month.getMonth()).toBe(1);
    });

    it("clears the current selection", () => {
      const single = createCalendar({ mode: "single" });
      single.select(new Date(2024, 0, 2));
      single.clear();
      expect(single.selected).toBeNull();

      const multiple = createCalendar({ mode: "multiple" });
      multiple.select(new Date(2024, 0, 2));
      multiple.clear();
      expect(multiple.selected).toEqual([]);
    });
  });

  describe("plugin registration", () => {
    it("registers only the $calendar magic", () => {
      const store = vi.fn();
      let magicApi: CalendarMagic | undefined;

      const Alpine = {
        store,
        magic(_name: string, factory: () => CalendarMagic) {
          magicApi = factory();
        },
      };

      calendarPlugin(Alpine as unknown as AlpineType.Alpine);

      expect(store).not.toHaveBeenCalled();
      expect(typeof magicApi).toBe("function");
    });

    it("registers callable $calendar magic", () => {
      const { calendar } = createMagicHarness(calendarPlugin) as { calendar: CalendarMagic };
      const instance = calendar({ month: JAN_2024 });

      expect(instance.month.getMonth()).toBe(0);
      instance.select(new Date(2024, 0, 4));
      expect(instance.isSelected(new Date(2024, 0, 4))).toBe(true);
    });

    it("createCalendarMagic() exposes the public API", () => {
      const magic = createCalendarMagic();
      const instance = magic({ weekStartsOn: 1 });

      expect(instance.weekStartsOn).toBe(1);
      expect(instance.weekdayLabels[0]).toBe("Mo");
    });

    it("createCalendarMagic() wraps instances with Alpine.reactive when Alpine is provided", () => {
      const reactive = vi.fn(<T>(value: T) => value);
      const magic = createCalendarMagic({ reactive } as Pick<AlpineType.Alpine, "reactive">);

      magic({ month: JAN_2024 });

      expect(reactive).toHaveBeenCalledTimes(1);
      expect((reactive.mock.calls[0]?.[0] as CalendarInstance).month.getMonth()).toBe(0);
    });
  });
});
