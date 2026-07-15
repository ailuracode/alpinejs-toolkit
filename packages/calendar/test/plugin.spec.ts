/**
 * Plugin spec — Alpine integration without a full Alpine runtime.
 *
 * Mirrors the spec pattern from `@ailuracode/alpine-theme` and
 * `@ailuracode/alpine-scroll`: minimal mock Alpine that records
 * magic registrations so the contract can be asserted without
 * booting the real runtime.
 */

import type { Alpine as AlpineBase } from "alpinejs";
import { describe, expect, it, vi } from "vitest";
import calendarPlugin from "../src/index";

interface MockAlpine {
  magics: Record<string, () => unknown>;
  reactiveMap: Record<string, unknown>;
  plugin(cb: (alpine: MockAlpine) => void): void;
  magic(name: string, factory: () => unknown): void;
  reactive<T>(value: T): T;
}

function createMockAlpine(): MockAlpine {
  const reactiveMap: Record<string, unknown> = {};
  const alpine: MockAlpine = {
    magics: {},
    reactiveMap,
    plugin(cb) {
      cb(alpine);
    },
    magic(name, factory) {
      alpine.magics[name] = factory;
    },
    reactive(value) {
      // Stamp each reactive call with a token so we can introspect it.
      const token = Symbol("reactive");
      const tagged = Object.assign(value as object, { [token]: true }) as never;
      reactiveMap[String(token)] = tagged;
      return value;
    },
  };
  return alpine;
}

type CalendarRegister = (alpine: AlpineBase) => void;

/**
 * Collision-avoidance: hosts that already own a `calendar` magic
 * can rename the integration without touching the controller. The
 * plugin accepts an options object that resolves the `magicKey`.
 */
describe("calendarPlugin — collision-avoidance keys", () => {
  it("registers under a custom magicKey", () => {
    const Alpine = createMockAlpine();
    (calendarPlugin({ magicKey: "datePicker" }) as CalendarRegister)(
      Alpine as unknown as AlpineBase
    );
    expect(Alpine.magics.datePicker).toBeDefined();
    expect(Alpine.magics.calendar).toBeUndefined();
  });

  it("leaves the default magicKey untouched when no rename is supplied", () => {
    const Alpine = createMockAlpine();
    (calendarPlugin({}) as CalendarRegister)(Alpine as unknown as AlpineBase);
    expect(Alpine.magics.calendar).toBeDefined();
    expect(Alpine.magics.datePicker).toBeUndefined();
  });

  it("does not register via the direct-Alpine overload when no options exist", () => {
    const Alpine = createMockAlpine();
    calendarPlugin(Alpine as unknown as AlpineBase);
    expect(Alpine.magics.calendar).toBeDefined();
  });
});
