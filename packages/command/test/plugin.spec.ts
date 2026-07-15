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
import { commandPlugin } from "../src/index";

interface MockAlpine {
  stores: Record<string, unknown>;
  magics: Record<string, () => unknown>;
  effects: Array<() => unknown>;
  cleanups: Array<() => void>;
  plugin(cb: (alpine: MockAlpine) => void): void;
  store(name: string, value?: unknown): unknown;
  magic(name: string, factory: () => unknown): void;
  effect(cb: () => unknown): void;
  cleanup(cb: () => void): void;
}

function createMockAlpine(): MockAlpine {
  const alpine: MockAlpine = {
    stores: {},
    magics: {},
    effects: [],
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
    effect(cb) {
      alpine.effects.push(cb);
    },
    cleanup(cb) {
      alpine.cleanups.push(cb);
    },
  };
  return alpine;
}

/**
 * Collision-avoidance: hosts that already own a `command` store
 * can rename the registrations without touching the controller. The
 * magic follows the store when only `storeKey` is provided, so the
 * common case is a single argument.
 */
describe("commandPlugin — collision-avoidance keys", () => {
  it("registers under a custom storeKey", () => {
    const Alpine = createMockAlpine();
    commandPlugin({ storeKey: "palette", id: "rename-1" })(Alpine as unknown as AlpineBase);
    expect(Alpine.stores.palette).toBeDefined();
    expect(Alpine.stores.command).toBeUndefined();
    expect(Alpine.magics.palette).toBeDefined();
  });

  it("lets magicKey move independently from storeKey", () => {
    const Alpine = createMockAlpine();
    commandPlugin({
      storeKey: "palette",
      magicKey: "cmd",
      id: "rename-2",
    })(Alpine as unknown as AlpineBase);
    expect(Alpine.stores.palette).toBeDefined();
    expect(Alpine.stores.command).toBeUndefined();
    expect(Alpine.magics.cmd).toBeDefined();
    expect(Alpine.magics.palette).toBeUndefined();
  });

  it("leaves the default keys untouched when no rename is supplied", () => {
    const Alpine = createMockAlpine();
    commandPlugin()(Alpine as unknown as AlpineBase);
    expect(Alpine.stores.command).toBeDefined();
    expect(Alpine.magics.command).toBeDefined();
  });
});
