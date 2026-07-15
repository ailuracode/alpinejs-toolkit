import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { describe, it } from "vitest";
import { togglePlugin as bigDogPlugin } from "../src/plugin.js";
import togglePlugin, {
  type CreatePuppyOptions,
  createPuppyToggle,
  type PuppyReactiveToggle,
} from "../src/puppy.js";

interface MockAlpine {
  magics: Record<string, () => unknown>;
  cleanups: Array<() => void>;
  reactive<T>(value: T): T;
  magic(name: string, factory: () => unknown): void;
  cleanup(callback: () => void): void;
}

function createMockAlpine(): MockAlpine {
  const Alpine: MockAlpine = {
    magics: {},
    cleanups: [],
    reactive: (value) => value,
    magic(name, factory) {
      Alpine.magics[name] = factory;
    },
    cleanup(callback) {
      Alpine.cleanups.push(callback);
    },
  };
  return Alpine;
}

function resolveToggleMagic(Alpine: MockAlpine) {
  return Alpine.magics.toggle() as (options?: CreatePuppyOptions) => PuppyReactiveToggle;
}

function createReactiveHarness() {
  const writes: Array<{ key: string; value: unknown }> = [];
  return {
    writes,
    wrap<T extends object>(value: T): T {
      return new Proxy(value, {
        set(target, property, next) {
          if (typeof property === "string") {
            writes.push({ key: property, value: next });
          }
          return Reflect.set(target, property, next);
        },
      });
    },
  };
}

describe("Puppy toggle", () => {
  it("registers $toggle and creates independent controllers", () => {
    const Alpine = createMockAlpine();
    togglePlugin()(Alpine as never);
    const factory = resolveToggleMagic(Alpine);
    const first = factory();
    const second = factory({ initial: true });

    assert.ok(Alpine.magics.toggle);
    assert.equal(first.value, false);
    assert.equal(second.value, true);
    first.toggle();
    assert.equal(second.value, true);
  });

  it("creates framework-agnostic toggles", () => {
    const toggle = createPuppyToggle();

    assert.equal(toggle.value, false);
    assert.equal(toggle.toggle(), true);
    toggle.set(false);
    assert.equal(toggle.value, false);
  });

  it("writes set() and toggle() through the reactive facade", () => {
    const Alpine = createMockAlpine();
    const { wrap, writes } = createReactiveHarness();
    Alpine.reactive = <T>(value: T): T => wrap(value as object) as T;
    togglePlugin()(Alpine as never);
    const toggle = resolveToggleMagic(Alpine)();

    toggle.set(true);
    toggle.toggle();

    assert.deepEqual(writes, [
      { key: "value", value: true },
      { key: "value", value: false },
    ]);
  });

  it("keeps Puppy cleanup isolated from Big Dog controllers", () => {
    const Alpine = createMockAlpine();
    togglePlugin()(Alpine as never);
    resolveToggleMagic(Alpine)();
    bigDogPlugin()(Alpine as never);
    const bigDogFactory = Alpine.magics.toggle() as (options: {
      states: { on: string; off: string };
    }) => { readonly isDestroyed: boolean };
    const bigDog = bigDogFactory({ states: { on: "on", off: "off" } });

    Alpine.cleanups[0]?.();

    assert.equal(bigDog.isDestroyed, false);
  });

  it("stays within the 350 B gzip budget", () => {
    const bundle = readFileSync(path.resolve("dist/puppy.js"));
    assert.ok(gzipSync(bundle).byteLength <= 350);
  });
});
