/**
 * Plugin spec — Alpine integration without a full Alpine runtime.
 */

import type { Alpine as AlpineBase } from "alpinejs";
import { describe, expect, it } from "vitest";
import { attentionPlugin } from "../src/index";

interface MockAlpine {
  magics: Record<string, () => unknown>;
  plugin(cb: (alpine: MockAlpine) => void): void;
  magic(name: string, factory: () => unknown): void;
  cleanup?(cb: () => void): void;
  reactive<T>(value: T): T;
}

function createMockAlpine(): MockAlpine {
  let alpineRef!: MockAlpine;
  const alpine: MockAlpine = {
    magics: {},
    plugin(cb) {
      cb(alpineRef);
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

type AttentionRegister = (alpine: AlpineBase) => void;

/**
 * Collision-avoidance: hosts that already own a `wakelock` or `idle`
 * magic can rename the integration without touching the controllers.
 */
describe("attentionPlugin — collision-avoidance keys", () => {
  it("registers under custom wakelockKey and idleKey", () => {
    const Alpine = createMockAlpine();
    (
      attentionPlugin({
        wakelockKey: "screen",
        idleKey: "presence",
      }) as AttentionRegister
    )(Alpine as unknown as AlpineBase);
    expect(Alpine.magics.screen).toBeDefined();
    expect(Alpine.magics.presence).toBeDefined();
    expect(Alpine.magics.wakelock).toBeUndefined();
    expect(Alpine.magics.idle).toBeUndefined();
  });

  it("leaves default keys untouched when no rename is supplied", () => {
    const Alpine = createMockAlpine();
    (attentionPlugin({}) as AttentionRegister)(Alpine as unknown as AlpineBase);
    expect(Alpine.magics.wakelock).toBeDefined();
    expect(Alpine.magics.idle).toBeDefined();
  });

  it("does not register via the direct-Alpine overload when no options exist", () => {
    const Alpine = createMockAlpine();
    attentionPlugin(Alpine as unknown as AlpineBase);
    expect(Alpine.magics.wakelock).toBeDefined();
    expect(Alpine.magics.idle).toBeDefined();
  });
});
