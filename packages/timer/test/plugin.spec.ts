/**
 * Plugin spec — Alpine integration without a full Alpine runtime.
 */

import type { Alpine as AlpineBase } from "alpinejs";
import { describe, expect, it } from "vitest";
import { timerPlugin } from "../src/plugin.js";

interface MockAlpine {
  magics: Record<string, unknown>;
  plugin(cb: (alpine: MockAlpine) => void): void;
  magic(name: string, factory: () => unknown): void;
  reactive<T>(value: T): T;
  cleanup?(cb: () => void): void;
}

function createMockAlpine(): MockAlpine {
  const alpine: MockAlpine = {
    magics: {},
    plugin(cb) {
      cb(alpine);
    },
    magic(name, factory) {
      alpine.magics[name] = factory();
    },
    reactive(value) {
      return value;
    },
  };
  return alpine;
}

describe("timerPlugin — collision-avoidance keys", () => {
  it("registers under a custom magicKey", () => {
    const Alpine = createMockAlpine();
    timerPlugin({ magicKey: "clock" })(Alpine as unknown as AlpineBase);
    expect(Alpine.magics.clock).toBeDefined();
    expect(Alpine.magics.timer).toBeUndefined();
  });

  it("registers the timer magic surface", () => {
    const Alpine = createMockAlpine();
    timerPlugin()(Alpine as unknown as AlpineBase);
    const magic = Alpine.magics.timer as {
      create: (options?: unknown) => unknown;
      countdown: (options: unknown) => unknown;
      countup: (options?: unknown) => unknown;
      stopwatch: (options?: unknown) => unknown;
    };
    expect(magic.create).toBeTypeOf("function");
    expect(magic.countdown).toBeTypeOf("function");
    expect(magic.countup).toBeTypeOf("function");
    expect(magic.stopwatch).toBeTypeOf("function");
  });
});
