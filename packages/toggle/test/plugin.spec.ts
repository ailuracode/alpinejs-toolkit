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
import { togglePlugin } from "../src/index";

interface MockAlpine {
  magics: Record<string, () => unknown>;
  plugin(cb: (alpine: MockAlpine) => void): void;
  magic(name: string, factory: () => unknown): void;
  cleanup?(cb: () => void): void;
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

/**
 * Collision-avoidance: hosts that already own a `toggle` magic
 * can rename the integration without touching the controller. The
 * plugin accepts an options object that resolves the `magicKey`.
 */
describe("togglePlugin — collision-avoidance keys", () => {
  it("registers under a custom magicKey", () => {
    const Alpine = createMockAlpine();
    togglePlugin({ magicKey: "switch" })(Alpine as unknown as AlpineBase);
    expect(Alpine.magics.switch).toBeDefined();
    expect(Alpine.magics.toggle).toBeUndefined();
  });

  it("leaves the default magicKey untouched when no rename is supplied", () => {
    const Alpine = createMockAlpine();
    togglePlugin({})(Alpine as unknown as AlpineBase);
    expect(Alpine.magics.toggle).toBeDefined();
    expect(Alpine.magics.switch).toBeUndefined();
  });

  it("registers without any options via default key", () => {
    const Alpine = createMockAlpine();
    togglePlugin()(Alpine as unknown as AlpineBase);
    expect(Alpine.magics.toggle).toBeDefined();
  });
});
