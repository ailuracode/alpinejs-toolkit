/**
 * Alpine integration tests — plugin registration, $calendar magic,
 * reactive wrapping.
 */
import type AlpineType from "alpinejs";
import { describe, expect, it, vi } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine.js";
import { createCalendarMagic } from "../src/controller.js";
import calendarPlugin from "../src/plugin.js";
import type { CalendarMagic } from "../src/types.js";

const JAN_2024 = new Date(2024, 0, 15);

describe("calendarPlugin — Alpine integration", () => {
  it("registers only the $calendar magic", () => {
    const store = vi.fn();
    let magicApi: CalendarMagic | undefined;

    const Alpine = {
      reactive<T>(value: T): T {
        return value;
      },
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
    const reactive = vi.fn((value: unknown) => value);
    const magic = createCalendarMagic({ reactive: reactive as <T>(value: T) => T });

    magic({ month: JAN_2024 });

    expect(reactive).toHaveBeenCalledTimes(1);
    expect((reactive.mock.calls[0]?.[0] as { month: Date }).month.getMonth()).toBe(0);
  });

  it("plugin methods use `this` so Alpine.reactive Proxy tracks mutations", () => {
    const { calendar } = createMagicHarness(calendarPlugin) as { calendar: CalendarMagic };
    const raw = calendar({ month: JAN_2024 });

    // Simulate Alpine.reactive() Proxy behavior: wrap in a real Proxy
    const proxy = new Proxy(raw as object, {
      set(target, prop, value) {
        Reflect.set(target, prop, value);
        return true;
      },
    }) as unknown as ReturnType<CalendarMagic>;

    // Navigation via proxy — methods use `this` which is the proxy
    proxy.nextMonth();
    expect(proxy.month.getMonth()).toBe(1);

    proxy.prevMonth();
    expect(proxy.month.getMonth()).toBe(0);

    // Selection via proxy
    proxy.select(new Date(2024, 0, 5));
    expect(proxy.selected).toBeInstanceOf(Date);

    proxy.clear();
    expect(proxy.selected).toBeNull();
  });
});
