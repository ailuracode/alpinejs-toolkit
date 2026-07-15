/**
 * Plugin spec — Alpine integration without a full Alpine runtime.
 */

import type { Alpine as AlpineBase } from "alpinejs";
import { describe, expect, it } from "vitest";
import { toastPlugin } from "../src/index";

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

type ToastRegister = (alpine: AlpineBase) => void;

/**
 * Collision-avoidance: hosts that already own a `toast` magic
 * can rename the integration without touching the controller.
 */
describe("toastPlugin — collision-avoidance keys", () => {
  it("registers under a custom magicKey", () => {
    const Alpine = createMockAlpine();
    (toastPlugin({ magicKey: "snack" }) as ToastRegister)(Alpine as unknown as AlpineBase);
    expect(Alpine.magics.snack).toBeDefined();
    expect(Alpine.magics.toast).toBeUndefined();
  });

  it("leaves the default magicKey untouched when no rename is supplied", () => {
    const Alpine = createMockAlpine();
    (toastPlugin({}) as ToastRegister)(Alpine as unknown as AlpineBase);
    expect(Alpine.magics.toast).toBeDefined();
    expect(Alpine.magics.snack).toBeUndefined();
  });

  it("registers the store and magic under a custom storeKey + magicKey pair", () => {
    const Alpine = createMockAlpine();
    (
      toastPlugin({
        storeKey: "alerts" as never,
        magicKey: "snack",
      }) as ToastRegister
    )(Alpine as unknown as AlpineBase);
    expect(Alpine.stores.alerts).toBeDefined();
    expect(Alpine.magics.snack).toBeDefined();
    expect(Alpine.stores.toast).toBeUndefined();
    expect(Alpine.magics.toast).toBeUndefined();
  });
});
