/**
 * Plugin spec — Alpine integration without a full Alpine runtime.
 */

import type { Alpine as AlpineBase } from "alpinejs";
import { describe, expect, it } from "vitest";
import envPlugin from "../src/index";

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

type EnvRegister = (alpine: AlpineBase) => void;

/**
 * Collision-avoidance: hosts that already own one of the env magics
 * (`network`, `visibility`, `battery`, `platform`) can rename any
 * combination of them through dedicated `*Key` options.
 */
describe("envPlugin — collision-avoidance keys", () => {
  it("registers under custom networkKey, visibilityKey, batteryKey, platformKey", () => {
    const Alpine = createMockAlpine();
    (
      envPlugin({
        networkKey: "net",
        visibilityKey: "page",
        batteryKey: "power",
        platformKey: "os",
      }) as EnvRegister
    )(Alpine as unknown as AlpineBase);

    expect(Alpine.magics.net).toBeDefined();
    expect(Alpine.magics.page).toBeDefined();
    expect(Alpine.magics.power).toBeDefined();
    expect(Alpine.magics.os).toBeDefined();
    expect(Alpine.magics.network).toBeUndefined();
    expect(Alpine.magics.visibility).toBeUndefined();
    expect(Alpine.magics.battery).toBeUndefined();
    expect(Alpine.magics.platform).toBeUndefined();
  });

  it("leaves default keys untouched when no rename is supplied", () => {
    const Alpine = createMockAlpine();
    (envPlugin({}) as EnvRegister)(Alpine as unknown as AlpineBase);
    expect(Alpine.magics.network).toBeDefined();
    expect(Alpine.magics.visibility).toBeDefined();
    expect(Alpine.magics.battery).toBeDefined();
    expect(Alpine.magics.platform).toBeDefined();
  });

  it("only registers the keys the caller enabled", () => {
    const Alpine = createMockAlpine();
    (envPlugin({ battery: false, platform: false }) as EnvRegister)(
      Alpine as unknown as AlpineBase
    );
    expect(Alpine.magics.network).toBeDefined();
    expect(Alpine.magics.visibility).toBeDefined();
    expect(Alpine.magics.battery).toBeUndefined();
    expect(Alpine.magics.platform).toBeUndefined();
  });
});
