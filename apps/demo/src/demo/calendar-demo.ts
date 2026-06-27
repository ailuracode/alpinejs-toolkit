import type { CalendarInstance, CalendarMagic, CalendarMode } from "@ailuracode/alpine-calendar";
import { addMonths } from "date-fns";
import { enUS, es } from "date-fns/locale";
import type { AlpineInstance } from "../types/alpine.js";

type CalendarDemoData = {
  cal: CalendarInstance | null;
  mode: CalendarMode;
  localeCode: "en" | "es";
  init(): void;
  createCalendar(): void;
  setMode(mode: CalendarMode): void;
  setLocale(code: "en" | "es"): void;
  clear(): void;
  jumpNextMonth(): void;
  selectionLabel(): string;
};

type CalendarDemoComponent = CalendarDemoData & {
  $calendar: CalendarMagic;
};

function localeFor(code: "en" | "es") {
  return code === "es" ? es : enUS;
}

function formatSelectionLabel(cal: CalendarInstance): string {
  const { selected, mode } = cal;

  if (mode === "single" && selected instanceof Date) {
    return cal.format(selected, "PPP");
  }

  if (mode === "multiple" && Array.isArray(selected)) {
    return selected.length === 0
      ? "None"
      : selected.map((date) => cal.format(date, "d MMM")).join(", ");
  }

  if (mode === "range" && selected && typeof selected === "object" && "from" in selected) {
    const from = selected.from ? cal.format(selected.from, "d MMM") : "…";
    const to = selected.to ? cal.format(selected.to, "d MMM") : "…";
    return `${from} → ${to}`;
  }

  return "None";
}

export function registerCalendarDemo(Alpine: AlpineInstance): void {
  Alpine.data(
    "calendarDemo",
    (): CalendarDemoData => ({
      cal: null,
      mode: "single",
      localeCode: "en",

      init(this: CalendarDemoComponent) {
        this.createCalendar();
      },

      createCalendar(this: CalendarDemoComponent) {
        const today = new Date();
        const minDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const maxDate = addMonths(minDate, 3);

        this.cal = this.$calendar({
          locale: localeFor(this.localeCode),
          weekStartsOn: 1,
          mode: this.mode,
          minDate,
          maxDate,
          disabled: { dayOfWeek: [0, 6] },
        });
      },

      setMode(this: CalendarDemoComponent, mode: CalendarMode) {
        this.mode = mode;
        this.createCalendar();
      },

      setLocale(this: CalendarDemoComponent, code: "en" | "es") {
        this.localeCode = code;
        this.createCalendar();
      },

      clear(this: CalendarDemoComponent) {
        this.cal?.clear();
      },

      jumpNextMonth(this: CalendarDemoComponent) {
        if (!this.cal) {
          return;
        }

        this.cal.goToMonth(addMonths(this.cal.month, 2));
      },

      selectionLabel(this: CalendarDemoComponent): string {
        return this.cal ? formatSelectionLabel(this.cal) : "";
      },
    })
  );
}
