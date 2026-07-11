/**
 * CalendarController unit tests — framework-agnostic.
 */
import { es } from "date-fns/locale";
import { describe, expect, it, vi } from "vitest";
import { CalendarController, createCalendarController } from "../src/controller.js";

const JAN_2024 = new Date(2024, 0, 15);
const FEB_2024 = new Date(2024, 1, 10);

describe("CalendarController", () => {
  describe("construction", () => {
    it("starts in idle phase", () => {
      const controller = new CalendarController({ month: JAN_2024 });
      expect(controller.phase).toBe("idle");
    });

    it("exposes normalized config as readonly getters", () => {
      const controller = new CalendarController({
        month: JAN_2024,
        mode: "multiple",
        locale: es,
        weekStartsOn: 1,
      });

      expect(controller.mode).toBe("multiple");
      expect(controller.locale).toBe(es);
      expect(controller.weekStartsOn).toBe(1);
      expect(controller.month.getMonth()).toBe(0);
    });
  });

  describe("lifecycle", () => {
    it("mounts and transitions to mounted phase", () => {
      const controller = new CalendarController({ month: JAN_2024 });
      controller.mount();
      expect(controller.phase).toBe("mounted");
      expect(controller.isMounted).toBe(true);
    });

    it("destroy transitions to destroyed phase", () => {
      const controller = new CalendarController({ month: JAN_2024 });
      controller.mount();
      controller.destroy();
      expect(controller.phase).toBe("destroyed");
      expect(controller.isDestroyed).toBe(true);
    });

    it("commands are no-ops after destroy", () => {
      const controller = new CalendarController({ month: JAN_2024 });
      controller.mount();
      controller.destroy();

      controller.prevMonth();
      expect(controller.month.getMonth()).toBe(0);

      controller.nextMonth();
      expect(controller.month.getMonth()).toBe(0);

      controller.select(new Date(2024, 0, 5));
      expect(controller.selected).toBeNull();

      controller.clear();
      expect(controller.selected).toBeNull();
    });
  });

  describe("month grid", () => {
    it("builds a month grid with leading and trailing outside days", () => {
      const controller = createCalendarController({ month: JAN_2024, weekStartsOn: 0 });

      expect(controller.weeks).toHaveLength(5);
      expect(controller.weeks[0]).toHaveLength(7);
      expect(controller.weeks[0]?.[0]?.isCurrentMonth).toBe(false);
      expect(controller.weeks.at(-1)?.some((day) => !day.isCurrentMonth)).toBe(true);
      expect(controller.weeks.flat().filter((day) => day.isCurrentMonth)).toHaveLength(31);
    });

    it("exposes localized weekday labels", () => {
      const controller = createCalendarController({ locale: es, weekStartsOn: 1 });

      expect(controller.weekdayLabels).toHaveLength(7);
      expect(controller.weekdayLabels[0]).toBe("lu");
    });
  });

  describe("navigation", () => {
    it("navigates months", () => {
      const controller = createCalendarController({ month: JAN_2024 });

      controller.nextMonth();
      expect(controller.month.getMonth()).toBe(1);

      controller.prevMonth();
      expect(controller.month.getMonth()).toBe(0);

      controller.goToMonth(FEB_2024);
      expect(controller.month.getMonth()).toBe(1);
      expect(controller.month.getDate()).toBe(1);

      controller.goToToday();
      expect(controller.month.getMonth()).toBe(new Date().getMonth());
    });
  });

  describe("events", () => {
    it("emits monthChange on navigation", () => {
      const controller = createCalendarController({ month: JAN_2024 });
      const handler = vi.fn();
      controller.on("monthChange", handler);

      controller.nextMonth();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ month: expect.any(Date) }));
      expect(handler.mock.calls[0][0].month.getMonth()).toBe(1);
    });

    it("emits select on selection change", () => {
      const controller = createCalendarController({ month: JAN_2024, mode: "single" });
      const handler = vi.fn();
      controller.on("select", handler);

      controller.select(new Date(2024, 0, 8));
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          date: expect.any(Date),
          mode: "single",
          selected: expect.any(Date),
        })
      );
    });

    it("emits clear on clear()", () => {
      const controller = createCalendarController({ month: JAN_2024, mode: "single" });
      const handler = vi.fn();
      controller.on("clear", handler);

      controller.select(new Date(2024, 0, 8));
      controller.clear();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("does not emit select when selecting a disabled date", () => {
      const controller = createCalendarController({
        month: JAN_2024,
        disabled: new Date(2024, 0, 10),
      });
      const handler = vi.fn();
      controller.on("select", handler);

      controller.select(new Date(2024, 0, 10));
      expect(handler).not.toHaveBeenCalled();
    });

    it("does not emit clear when already empty", () => {
      const controller = createCalendarController({ month: JAN_2024, mode: "single" });
      const handler = vi.fn();
      controller.on("clear", handler);

      controller.clear();
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("selection — single", () => {
    it("selects a single date", () => {
      const controller = createCalendarController({ month: JAN_2024, mode: "single" });
      const day = new Date(2024, 0, 8);

      controller.select(day);

      expect(controller.selected).toEqual(new Date(2024, 0, 8));
      expect(controller.isSelected(day)).toBe(true);
      expect(controller.weeks.flat().find((entry) => entry.date.getDate() === 8)?.isSelected).toBe(
        true
      );
    });

    it("clears single selection", () => {
      const controller = createCalendarController({ mode: "single" });
      controller.select(new Date(2024, 0, 2));
      controller.clear();
      expect(controller.selected).toBeNull();
    });
  });

  describe("selection — multiple", () => {
    it("toggles multiple dates", () => {
      const controller = createCalendarController({ month: JAN_2024, mode: "multiple" });
      const first = new Date(2024, 0, 3);
      const second = new Date(2024, 0, 4);

      controller.select(first);
      controller.select(second);
      expect(controller.isSelected(first)).toBe(true);
      expect(controller.isSelected(second)).toBe(true);

      controller.select(first);
      expect(controller.isSelected(first)).toBe(false);
      expect(controller.isSelected(second)).toBe(true);
    });

    it("clears multiple selection", () => {
      const controller = createCalendarController({ mode: "multiple" });
      controller.select(new Date(2024, 0, 2));
      controller.clear();
      expect(controller.selected).toEqual([]);
    });
  });

  describe("selection — range", () => {
    it("selects a date range in two clicks", () => {
      const controller = createCalendarController({ month: JAN_2024, mode: "range" });
      const start = new Date(2024, 0, 5);
      const end = new Date(2024, 0, 9);
      const middle = new Date(2024, 0, 7);

      controller.select(start);
      expect(controller.isRangeStart(start)).toBe(true);

      controller.select(end);
      expect(controller.isRangeEnd(end)).toBe(true);
      expect(controller.isInRange(middle)).toBe(true);
      expect(controller.weeks.flat().find((entry) => entry.date.getDate() === 7)?.isInRange).toBe(
        true
      );
    });

    it("reorders range selection when the second date is earlier", () => {
      const controller = createCalendarController({ month: JAN_2024, mode: "range" });
      const later = new Date(2024, 0, 12);
      const earlier = new Date(2024, 0, 4);

      controller.select(later);
      controller.select(earlier);

      expect(controller.isRangeStart(earlier)).toBe(true);
      expect(controller.isRangeEnd(later)).toBe(true);
    });
  });

  describe("disabled dates", () => {
    it("respects minDate and maxDate constraints", () => {
      const controller = createCalendarController({
        month: JAN_2024,
        minDate: new Date(2024, 0, 5),
        maxDate: new Date(2024, 0, 25),
      });

      const blocked = new Date(2024, 0, 2);
      const allowed = new Date(2024, 0, 10);

      expect(controller.isDisabled(blocked)).toBe(true);
      expect(controller.isDisabled(allowed)).toBe(false);

      controller.select(blocked);
      expect(controller.selected).toBeNull();

      controller.select(allowed);
      expect(controller.isSelected(allowed)).toBe(true);
    });

    it("disables individual dates", () => {
      const blocked = new Date(2024, 0, 10);
      const controller = createCalendarController({ month: JAN_2024, disabled: blocked });

      expect(controller.isDisabled(blocked)).toBe(true);
      expect(controller.isDisabled(new Date(2024, 0, 11))).toBe(false);

      controller.select(blocked);
      expect(controller.selected).toBeNull();
    });

    it("disables multiple loose dates", () => {
      const controller = createCalendarController({
        month: JAN_2024,
        disabled: [new Date(2024, 0, 3), new Date(2024, 0, 17)],
      });

      expect(controller.isDisabled(new Date(2024, 0, 3))).toBe(true);
      expect(controller.isDisabled(new Date(2024, 0, 17))).toBe(true);
      expect(controller.isDisabled(new Date(2024, 0, 4))).toBe(false);
    });

    it("disables inclusive date ranges", () => {
      const controller = createCalendarController({
        month: JAN_2024,
        disabled: { from: new Date(2024, 0, 8), to: new Date(2024, 0, 12) },
      });

      expect(controller.isDisabled(new Date(2024, 0, 7))).toBe(false);
      expect(controller.isDisabled(new Date(2024, 0, 8))).toBe(true);
      expect(controller.isDisabled(new Date(2024, 0, 10))).toBe(true);
      expect(controller.isDisabled(new Date(2024, 0, 12))).toBe(true);
      expect(controller.isDisabled(new Date(2024, 0, 13))).toBe(false);
    });

    it("disables exclusive intervals between two bounds", () => {
      const controller = createCalendarController({
        month: JAN_2024,
        disabled: { after: new Date(2024, 0, 7), before: new Date(2024, 0, 13) },
      });

      expect(controller.isDisabled(new Date(2024, 0, 7))).toBe(false);
      expect(controller.isDisabled(new Date(2024, 0, 8))).toBe(true);
      expect(controller.isDisabled(new Date(2024, 0, 12))).toBe(true);
      expect(controller.isDisabled(new Date(2024, 0, 13))).toBe(false);
    });

    it("disables dates outside an only range", () => {
      const controller = createCalendarController({
        month: JAN_2024,
        disabled: { only: { from: new Date(2024, 0, 8), to: new Date(2024, 0, 12) } },
      });

      expect(controller.isDisabled(new Date(2024, 0, 7))).toBe(true);
      expect(controller.isDisabled(new Date(2024, 0, 8))).toBe(false);
      expect(controller.isDisabled(new Date(2024, 0, 12))).toBe(false);
      expect(controller.isDisabled(new Date(2024, 0, 13))).toBe(true);
    });

    it("disables weekdays and custom matchers", () => {
      const weekendCal = createCalendarController({
        month: JAN_2024,
        disabled: { dayOfWeek: [0, 6] },
      });

      expect(weekendCal.isDisabled(new Date(2024, 0, 6))).toBe(true);
      expect(weekendCal.isDisabled(new Date(2024, 0, 8))).toBe(false);

      const customCal = createCalendarController({
        month: JAN_2024,
        disabled: (date) => date.getDate() % 2 === 0,
      });

      expect(customCal.isDisabled(new Date(2024, 0, 10))).toBe(true);
      expect(customCal.isDisabled(new Date(2024, 0, 11))).toBe(false);
    });

    it("combines multiple disabled matchers", () => {
      const controller = createCalendarController({
        month: JAN_2024,
        disabled: [
          new Date(2024, 0, 2),
          { from: new Date(2024, 0, 20), to: new Date(2024, 0, 22) },
          { dayOfWeek: [0] },
        ],
      });

      expect(controller.isDisabled(new Date(2024, 0, 2))).toBe(true);
      expect(controller.isDisabled(new Date(2024, 0, 21))).toBe(true);
      expect(controller.isDisabled(new Date(2024, 0, 7))).toBe(true);
      expect(controller.isDisabled(new Date(2024, 0, 9))).toBe(false);
    });
  });

  describe("matching", () => {
    it("exposes matches() for arbitrary matchers", () => {
      const controller = createCalendarController({ month: JAN_2024 });

      expect(controller.matches(new Date(2024, 0, 10), { before: new Date(2024, 0, 15) })).toBe(
        true
      );
      expect(controller.matches(new Date(2024, 0, 20), { before: new Date(2024, 0, 15) })).toBe(
        false
      );
    });
  });

  describe("formatting", () => {
    it("merges dateFns options with top-level shortcuts", () => {
      const controller = createCalendarController({
        month: JAN_2024,
        weekStartsOn: 1,
        dateFns: { firstWeekContainsDate: 4 },
      });

      expect(controller.weekStartsOn).toBe(1);
      expect(controller.dateFns.firstWeekContainsDate).toBe(4);
      expect(controller.weekdayLabels[0]).toBe("Mo");
    });

    it("formats dates with the configured locale", () => {
      const controller = createCalendarController({ month: JAN_2024, locale: es });

      expect(controller.formatMonth()).toContain("2024");
      expect(controller.formatYear()).toBe("2024");
      expect(controller.format(new Date(2024, 0, 15), "d MMM")).toBe("15 ene");
    });
  });

  describe("toStore()", () => {
    it("returns a CalendarInstance-shaped object", () => {
      const controller = createCalendarController({ month: JAN_2024 });
      const store = controller.toStore();

      expect(store.month.getMonth()).toBe(0);
      expect(store.mode).toBe("single");
      expect(store.weeks).toHaveLength(5);
      expect(store.weekdayLabels).toHaveLength(7);
    });

    it("delegates commands to the controller", () => {
      const controller = createCalendarController({ month: JAN_2024 });
      const store = controller.toStore();

      store.nextMonth();
      expect(controller.month.getMonth()).toBe(1);
      expect(store.month.getMonth()).toBe(1);

      store.select(new Date(2024, 1, 5));
      expect(controller.isSelected(new Date(2024, 1, 5))).toBe(true);
      expect(store.isSelected(new Date(2024, 1, 5))).toBe(true);
    });

    it("syncs own properties after mutations (Alpine.reactive compatibility)", () => {
      const controller = createCalendarController({ month: JAN_2024 });
      const store = controller.toStore();

      const monthDesc = Object.getOwnPropertyDescriptor(store, "month");
      expect(monthDesc?.writable).toBe(true);
      expect(monthDesc?.value).toBeInstanceOf(Date);

      store.nextMonth();
      expect(store.month.getMonth()).toBe(1);

      store.prevMonth();
      expect(store.month.getMonth()).toBe(0);

      store.goToMonth(FEB_2024);
      expect(store.month.getMonth()).toBe(1);

      store.goToToday();
      expect(store.month.getMonth()).toBe(new Date().getMonth());

      store.select(new Date(2024, 0, 5));
      expect(store.selected).toBeInstanceOf(Date);

      store.clear();
      expect(store.selected).toBeNull();
    });

    it("creates independent instances", () => {
      const first = createCalendarController({ month: JAN_2024 });
      const second = createCalendarController({ month: FEB_2024 });

      first.select(new Date(2024, 0, 2));

      expect(first.selected).not.toBeNull();
      expect(second.selected).toBeNull();
      expect(first.month.getMonth()).toBe(0);
      expect(second.month.getMonth()).toBe(1);
    });
  });
});
