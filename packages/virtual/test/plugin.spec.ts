/**
 * Plugin spec — Alpine integration without a full Alpine runtime.
 */

import type { Alpine as AlpineBase } from "alpinejs";
import { describe, expect, it } from "vitest";
import { virtualPlugin } from "../src/index";

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

type VirtualRegister = (alpine: AlpineBase) => void;

describe("virtualPlugin — collision-avoidance keys", () => {
  it("registers under a custom storeKey", () => {
    const Alpine = createMockAlpine();
    (virtualPlugin({ storeKey: "windowed" }) as VirtualRegister)(Alpine as unknown as AlpineBase);
    expect(Alpine.stores.windowed).toBeDefined();
    expect(Alpine.stores.virtual).toBeUndefined();
  });

  it("leaves the default storeKey untouched when no rename is supplied", () => {
    const Alpine = createMockAlpine();
    (virtualPlugin({}) as VirtualRegister)(Alpine as unknown as AlpineBase);
    expect(Alpine.stores.virtual).toBeDefined();
    expect(Alpine.stores.windowed).toBeUndefined();
  });
});
