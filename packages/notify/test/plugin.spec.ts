/**
 * Plugin spec — Alpine integration without a full Alpine runtime.
 *
 * Mirrors the spec pattern from `@ailuracode/alpine-theme` and
 * `@ailuracode/alpine-scroll`: minimal mock Alpine that records
 * magic registrations so the contract can be asserted without
 * booting the real runtime.
 */

import type { Alpine as AlpineBase } from "alpinejs";
import { describe, expect, it } from "vitest";
import notifyPlugin from "../src/index";

interface MockAlpine {
  magics: Record<string, () => unknown>;
  plugin(cb: (alpine: MockAlpine) => void): void;
  magic(name: string, factory: () => unknown): void;
}

function createMockAlpine(): MockAlpine {
  const alpine: MockAlpine = {
    magics: {},
    plugin(cb) {
      cb(alpine);
    },
    magic(name, factory) {
      alpine.magics[name] = factory;
    },
  };
  return alpine;
}

type NotifyRegister = (alpine: AlpineBase) => void;

/**
 * Collision-avoidance: hosts that already own a `notify` magic
 * can rename the integration without touching the controller. The
 * plugin accepts an options object that resolves the `magicKey`.
 */
describe("notifyPlugin — collision-avoidance keys", () => {
  it("registers under a custom magicKey", () => {
    const Alpine = createMockAlpine();
    (notifyPlugin({ magicKey: "alerts" }) as NotifyRegister)(Alpine as unknown as AlpineBase);
    expect(Alpine.magics.alerts).toBeDefined();
    expect(Alpine.magics.notify).toBeUndefined();
  });

  it("leaves the default magicKey untouched when no rename is supplied", () => {
    const Alpine = createMockAlpine();
    (notifyPlugin({}) as NotifyRegister)(Alpine as unknown as AlpineBase);
    expect(Alpine.magics.notify).toBeDefined();
    expect(Alpine.magics.alerts).toBeUndefined();
  });

  it("does not register via the direct-Alpine overload when no options exist", () => {
    const Alpine = createMockAlpine();
    notifyPlugin(Alpine as unknown as AlpineBase);
    expect(Alpine.magics.notify).toBeDefined();
  });
});
