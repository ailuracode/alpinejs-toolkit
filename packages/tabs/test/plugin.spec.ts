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
import { tabsPlugin } from "../src/index";

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
 * Collision-avoidance: hosts that already own a `tabs` store can
 * rename the registrations without touching the controller. The
 * magic follows the store when only `storeKey` is provided, so the
 * common case is a single argument.
 */
describe("tabsPlugin — collision-avoidance keys", () => {
  it("registers under a custom storeKey", () => {
    const Alpine = createMockAlpine();
    tabsPlugin({ storeKey: "panels" })(Alpine as unknown as AlpineBase);
    expect(Alpine.stores.panels).toBeDefined();
    expect(Alpine.stores.tabs).toBeUndefined();
    expect(Alpine.magics.panels).toBeDefined();
  });

  it("lets magicKey move independently from storeKey", () => {
    const Alpine = createMockAlpine();
    tabsPlugin({ storeKey: "panels", magicKey: "tabsState" })(Alpine as unknown as AlpineBase);
    expect(Alpine.stores.panels).toBeDefined();
    expect(Alpine.stores.tabs).toBeUndefined();
    expect(Alpine.magics.tabsState).toBeDefined();
    expect(Alpine.magics.panels).toBeUndefined();
  });

  it("leaves the default keys untouched when no rename is supplied", () => {
    const Alpine = createMockAlpine();
    tabsPlugin()(Alpine as unknown as AlpineBase);
    expect(Alpine.stores.tabs).toBeDefined();
    expect(Alpine.magics.tabs).toBeDefined();
  });
});
