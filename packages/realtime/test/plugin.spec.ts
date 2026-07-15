/**
 * Plugin spec — Alpine integration without a full Alpine runtime.
 */

import type { Alpine as AlpineBase } from "alpinejs";
import { describe, expect, it } from "vitest";
import { realtimePlugin } from "../src/index";

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
      if (value !== undefined) {
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

type RealtimeRegister = (alpine: AlpineBase) => void;

describe("realtimePlugin — collision-avoidance keys", () => {
  it("registers under a custom magicKey", () => {
    const Alpine = createMockAlpine();
    (realtimePlugin({ magicKey: "live" }) as RealtimeRegister)(Alpine as unknown as AlpineBase);
    expect(Alpine.magics.live).toBeDefined();
    expect(Alpine.magics.realtime).toBeUndefined();
  });

  it("leaves the default magicKey untouched when no rename is supplied", () => {
    const Alpine = createMockAlpine();
    (realtimePlugin({}) as RealtimeRegister)(Alpine as unknown as AlpineBase);
    expect(Alpine.magics.realtime).toBeDefined();
    expect(Alpine.magics.live).toBeUndefined();
  });
});
