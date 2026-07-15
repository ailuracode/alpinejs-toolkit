/**
 * Plugin spec — Alpine integration without a full Alpine runtime.
 *
 * Mirrors the spec pattern from `@ailuracode/alpine-theme` and
 * `@ailuracode/alpine-scroll`: minimal mock Alpine that records
 * store / magic / directive / cleanup registrations so the
 * contract can be asserted without booting the real runtime.
 */

import type { Alpine as AlpineBase } from "alpinejs";
import { describe, expect, it } from "vitest";
import { gesturePlugin } from "../src/index";

interface MockAlpine {
  stores: Record<string, unknown>;
  magics: Record<string, () => unknown>;
  directives: Record<string, unknown>;
  cleanups: Array<() => void>;
  plugin(cb: (alpine: MockAlpine) => void): void;
  store(name: string, value?: unknown): unknown;
  magic(name: string, factory: () => unknown): void;
  directive(name: string, handler: (...args: unknown[]) => unknown): void;
  cleanup(cb: () => void): void;
}

function createMockAlpine(): MockAlpine {
  const alpine: MockAlpine = {
    stores: {},
    magics: {},
    directives: {},
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
    directive(name, handler) {
      alpine.directives[name] = handler;
    },
    cleanup(cb) {
      alpine.cleanups.push(cb);
    },
  };
  return alpine;
}

/**
 * Collision-avoidance: hosts that already own a `gesture` store or
 * `x-gesture` directive can rename the integration surfaces
 * (store, magic, directive) without touching the controller. The
 * magic follows the store when only `storeKey` is provided, so the
 * common case is a single argument. The directive key is
 * independent — pick it when the host owns a different
 * `x-gesture` directive already.
 */
describe("gesturePlugin — collision-avoidance keys", () => {
  it("registers under a custom storeKey", () => {
    const Alpine = createMockAlpine();
    gesturePlugin({ storeKey: "pointer" })(Alpine as unknown as AlpineBase);
    expect(Alpine.stores.pointer).toBeDefined();
    expect(Alpine.stores.gesture).toBeUndefined();
    expect(Alpine.magics.pointer).toBeDefined();
    expect(Alpine.directives.gesture).toBeDefined();
  });

  it("lets directiveKey move independently from storeKey", () => {
    const Alpine = createMockAlpine();
    gesturePlugin({ storeKey: "pointer", directiveKey: "swipe" })(Alpine as unknown as AlpineBase);
    expect(Alpine.stores.pointer).toBeDefined();
    expect(Alpine.magics.pointer).toBeDefined();
    expect(Alpine.directives.swipe).toBeDefined();
    expect(Alpine.directives.gesture).toBeUndefined();
  });

  it("lets magicKey move independently from storeKey", () => {
    const Alpine = createMockAlpine();
    gesturePlugin({ storeKey: "pointer", magicKey: "gestureState" })(
      Alpine as unknown as AlpineBase
    );
    expect(Alpine.stores.pointer).toBeDefined();
    expect(Alpine.magics.gestureState).toBeDefined();
    expect(Alpine.magics.pointer).toBeUndefined();
  });

  it("leaves the default keys untouched when no rename is supplied", () => {
    const Alpine = createMockAlpine();
    gesturePlugin()(Alpine as unknown as AlpineBase);
    expect(Alpine.stores.gesture).toBeDefined();
    expect(Alpine.magics.gesture).toBeDefined();
    expect(Alpine.directives.gesture).toBeDefined();
  });
});
