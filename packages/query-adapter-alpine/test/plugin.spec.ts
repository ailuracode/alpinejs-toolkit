/**
 * Plugin spec — Alpine integration without a full Alpine runtime.
 */

import type { Alpine as AlpineBase } from "alpinejs";
import { describe, expect, it } from "vitest";
import { createQueryPlugin } from "../src/index";

interface MockAlpine {
  stores: Record<string, unknown>;
  plugin(cb: (alpine: MockAlpine) => void): void;
  store(name: string, value?: unknown): unknown;
  cleanup(callback: () => void): void;
}

function createMockAlpine(): MockAlpine {
  let alpineRef!: MockAlpine;
  const alpine: MockAlpine = {
    stores: {},
    plugin(cb) {
      cb(alpineRef);
    },
    store(name, value?) {
      if (value !== undefined) {
        alpine.stores[name] = value;
      }
      return alpine.stores[name];
    },
    cleanup() {
      /* noop */
    },
  };
  alpineRef = alpine;
  return alpine;
}

const stubAdapter = {
  name: "stub",
  createQueryState: () => ({}) as never,
  createMutationState: () => ({}) as never,
};

type QueryRegister = (alpine: AlpineBase) => void;

describe("query-adapter-alpine — collision-avoidance keys", () => {
  it("registers under a custom storeKey", () => {
    const Alpine = createMockAlpine();
    const cb = createQueryPlugin(stubAdapter, { storeKey: "cache" });
    (cb as QueryRegister)(Alpine as unknown as AlpineBase);
    expect(Alpine.stores.cache).toBeDefined();
    expect(Alpine.stores.query).toBeUndefined();
  });

  it("leaves the default storeKey untouched when no rename is supplied", () => {
    const Alpine = createMockAlpine();
    const cb = createQueryPlugin(stubAdapter, {});
    (cb as QueryRegister)(Alpine as unknown as AlpineBase);
    expect(Alpine.stores.query).toBeDefined();
    expect(Alpine.stores.cache).toBeUndefined();
  });
});
