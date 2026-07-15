/**
 * Plugin spec — Alpine integration without a full Alpine runtime.
 *
 * Mirrors the spec pattern from `@ailuracode/alpine-theme` and
 * `@ailuracode/alpine-scroll`: minimal mock Alpine that records
 * store / magic / cleanup registrations so the contract can be
 * asserted without booting the real runtime.
 */

import type { Alpine as AlpineBase } from "alpinejs";
import { describe, expect, it } from "vitest";
import { geoPlugin } from "../src/index";

interface MockAlpine {
  stores: Record<string, unknown>;
  magics: Record<string, () => unknown>;
  cleanups: Array<() => void>;
  plugin(cb: (alpine: MockAlpine) => void): void;
  store(name: string, value?: unknown): unknown;
  magic(name: string, factory: () => unknown): void;
  cleanup(cb: () => void): void;
}

function createMockAlpine(): MockAlpine {
  const alpine: MockAlpine = {
    stores: {},
    magics: {},
    cleanups: [],
    plugin(cb) {
      cb(alpine);
    },
    store(name, value?) {
      if (value === undefined) {
        return alpine.stores[name];
      }
      alpine.stores[name] = value;
      return undefined;
    },
    magic(name, factory) {
      alpine.magics[name] = factory;
    },
    cleanup(cb) {
      alpine.cleanups.push(cb);
    },
  };
  return alpine;
}

/**
 * Collision-avoidance: hosts that already own a `geo` store can
 * rename the registrations without touching the controller. The
 * magic follows the store when only `storeKey` is provided, so the
 * common case is a single argument.
 */
describe("geoPlugin — collision-avoidance keys", () => {
  it("registers under a custom storeKey", () => {
    const Alpine = createMockAlpine();
    geoPlugin({ storeKey: "location" })(Alpine as unknown as AlpineBase);
    expect(Alpine.stores.location).toBeDefined();
    expect(Alpine.stores.geo).toBeUndefined();
    expect(Alpine.magics.location).toBeDefined();
  });

  it("lets magicKey move independently from storeKey", () => {
    const Alpine = createMockAlpine();
    geoPlugin({ storeKey: "location", magicKey: "geoState" })(Alpine as unknown as AlpineBase);
    expect(Alpine.stores.location).toBeDefined();
    expect(Alpine.stores.geo).toBeUndefined();
    expect(Alpine.magics.geoState).toBeDefined();
    expect(Alpine.magics.location).toBeUndefined();
  });

  it("leaves the default keys untouched when no rename is supplied", () => {
    const Alpine = createMockAlpine();
    geoPlugin()(Alpine as unknown as AlpineBase);
    expect(Alpine.stores.geo).toBeDefined();
    expect(Alpine.magics.geo).toBeDefined();
  });
});
