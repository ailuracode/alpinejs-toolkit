/**
 * Plugin spec — Alpine integration without a full Alpine runtime.
 */

import type { Alpine as AlpineBase } from "alpinejs";
import { describe, expect, it } from "vitest";
import { tooltipPlugin } from "../src/index";

interface MockAlpine {
  stores: Record<string, unknown>;
  magics: Record<string, () => unknown>;
  plugin(cb: (alpine: MockAlpine) => void): void;
  store(name: string, value?: unknown): unknown;
  magic(name: string, factory: () => unknown): void;
  reactive<T>(value: T): T;
}

function createMockAlpine(): MockAlpine {
  let alpineRef!: MockAlpine;
  const alpine: MockAlpine = {
    stores: {},
    magics: {},
    plugin(cb) {
      cb(alpineRef);
    },
    store(name, value?) {
      if (arguments.length === 2) {
        alpine.stores[name] = value;
      }
      return alpine.stores[name];
    },
    magic(name, factory) {
      alpine.magics[name] = factory;
    },
    reactive(value) {
      return value;
    },
  };
  alpineRef = alpine;
  return alpine;
}

type TooltipRegister = (alpine: AlpineBase) => void;

describe("tooltipPlugin — collision-avoidance keys", () => {
  it("registers under a custom storeKey", () => {
    const Alpine = createMockAlpine();
    (tooltipPlugin({ storeKey: "hints" }) as TooltipRegister)(Alpine as unknown as AlpineBase);
    expect(Alpine.stores.hints).toBeDefined();
    expect(Alpine.stores.tooltip).toBeUndefined();
  });

  it("leaves the default storeKey untouched when no rename is supplied", () => {
    const Alpine = createMockAlpine();
    (tooltipPlugin({}) as TooltipRegister)(Alpine as unknown as AlpineBase);
    expect(Alpine.stores.tooltip).toBeDefined();
    expect(Alpine.stores.hints).toBeUndefined();
  });
});
