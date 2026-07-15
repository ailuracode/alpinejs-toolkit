/**
 * Plugin spec — Alpine integration without a full Alpine runtime.
 */

import type { Alpine as AlpineBase } from "alpinejs";
import { describe, expect, it } from "vitest";
import { carouselPlugin } from "../src/index";

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

type CarouselRegister = (alpine: AlpineBase) => void;

/**
 * Collision-avoidance: hosts that already own a `carousel` store
 * can rename the integration without touching the controller.
 */
describe("carouselPlugin — collision-avoidance keys", () => {
  it("registers under a custom storeKey", () => {
    const Alpine = createMockAlpine();
    (carouselPlugin({ storeKey: "slider" }) as CarouselRegister)(Alpine as unknown as AlpineBase);
    expect(Alpine.stores.slider).toBeDefined();
    expect(Alpine.stores.carousel).toBeUndefined();
  });

  it("leaves the default storeKey untouched when no rename is supplied", () => {
    const Alpine = createMockAlpine();
    (carouselPlugin({}) as CarouselRegister)(Alpine as unknown as AlpineBase);
    expect(Alpine.stores.carousel).toBeDefined();
    expect(Alpine.stores.slider).toBeUndefined();
  });
});
