import assert from "node:assert/strict";
import { describe, it } from "vitest";
import togglePlugin, {
  createDoggoToggle,
  type DoggoReactiveToggle,
  type ToggleDoggoOptions,
} from "../src/doggo.js";
import { togglePlugin as bigDogPlugin } from "../src/plugin.js";

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

function resolveToggleMagic<TA, TB, TN>(Alpine: MockAlpine) {
  return Alpine.magics.toggle() as (
    options: ToggleDoggoOptions<TA, TB, TN>
  ) => DoggoReactiveToggle<TA, TB, TN>;
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

const ternaryOptions = {
  states: { on: "a", off: "b", indeterminate: "c" },
  initial: "a",
} as const;

describe("Doggo toggle", () => {
  it("cycles every ternary state with next()", () => {
    const toggle = createDoggoToggle(ternaryOptions);

    assert.equal(toggle.next(), "b");
    assert.equal(toggle.next(), "c");
    assert.equal(toggle.next(), "a");
  });

  it("jumps from indeterminate to on with toggle()", () => {
    const toggle = createDoggoToggle({ ...ternaryOptions, initial: "c" });

    assert.equal(toggle.toggle(), "a");
  });

  it("resets to the configured initial value", () => {
    const toggle = createDoggoToggle(ternaryOptions);
    toggle.set("b");

    assert.equal(toggle.reset(), "a");
    assert.equal(toggle.is("a"), true);
  });

  it("notifies listeners with previous values and supports unsubscribe", () => {
    const toggle = createDoggoToggle(ternaryOptions);
    const details: unknown[] = [];
    const unsubscribe = toggle.onChange((detail) => details.push(detail));

    toggle.set("b");
    unsubscribe();
    toggle.set("c");

    assert.deepEqual(details, [{ current: "b", previous: "a" }]);
  });

  it("rejects an initial value outside the configured states", () => {
    assert.throws(
      () =>
        createDoggoToggle({
          states: { on: "a", off: "b" },
          initial: "c" as never,
        }),
      /Invalid initial/
    );
  });

  it("writes controller changes through the reactive facade", () => {
    const Alpine = createMockAlpine();
    const { wrap, writes } = createReactiveHarness();
    Alpine.reactive = <T>(value: T): T => wrap(value as object) as T;
    togglePlugin()(Alpine as never);
    const toggle = resolveToggleMagic<"a", "b", "c">(Alpine)(ternaryOptions);

    toggle.next();
    toggle.reset();
    toggle.set("c");
    toggle.toggle();

    assert.deepEqual(writes, [
      { key: "value", value: "b" },
      { key: "value", value: "a" },
      { key: "value", value: "c" },
      { key: "value", value: "a" },
    ]);
  });

  it("keeps Doggo cleanup isolated and unsubscribes its listeners", () => {
    const Alpine = createMockAlpine();
    togglePlugin()(Alpine as never);
    const doggo = resolveToggleMagic<"a", "b", "c">(Alpine)(ternaryOptions);
    let calls = 0;
    doggo.onChange(() => {
      calls += 1;
    });

    bigDogPlugin()(Alpine as never);
    const bigDogFactory = Alpine.magics.toggle() as (options: {
      states: { on: string; off: string };
    }) => { readonly isDestroyed: boolean };
    const bigDog = bigDogFactory({ states: { on: "on", off: "off" } });

    Alpine.cleanups[0]?.();
    doggo.set("b");

    assert.equal(calls, 0);
    assert.equal(bigDog.isDestroyed, false);
  });
});
