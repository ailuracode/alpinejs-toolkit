/**
 * Alpine integration tests for `@ailuracode/alpine-toggle`.
 *
 * Per `.cursor/rules/testing.mdc`, plugin tests
 * cover magic registration, reactive wrapping, factory uniqueness,
 * and cleanup. A minimal mock Alpine exercises the contract without
 * booting the real runtime.
 *
 * The mock mirrors Alpine's real semantics: every access to a magic
 * invokes its factory. For toggle, the factory returns the toggle
 * factory function itself, which the consumer then calls with
 * `options`. Tests follow the same pattern as
 * `@ailuracode/alpine-theme/test/plugin.spec.ts`.
 */

import assert from "node:assert/strict";
import { describe, expectTypeOf, it } from "vitest";
import type { ToggleInstance } from "../src/index";
import { togglePlugin } from "../src/index";

interface MockAlpine {
  magics: Record<string, () => unknown>;
  cleanups: Array<() => void>;
  reactive<T>(value: T): T;
  magic(name: string, factory: () => unknown): void;
  cleanup(cb: () => void): void;
}

function createMockAlpine(): MockAlpine {
  const alpine: MockAlpine = {
    magics: {},
    cleanups: [],
    reactive<T>(value: T) {
      return value;
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
 * Resolves the registered `$toggle` magic factory. Mirrors how
 * Alpine evaluates a magic expression: the registered factory runs
 * once per access.
 */
function resolveToggleMagic(Alpine: MockAlpine) {
  return Alpine.magics.toggle() as <TA, TB, TN>(opts: {
    states: { on: TA; off: TB; indeterminate?: TN };
  }) => ToggleInstance<TA, TB, TN, TA | TB | TN>;
}

describe("togglePlugin — registration", () => {
  it("registers the $toggle magic", () => {
    const Alpine = createMockAlpine();
    togglePlugin()(Alpine as never);
    assert.ok(Alpine.magics.toggle);
  });

  it("registers an Alpine cleanup callback when available", () => {
    const Alpine = createMockAlpine();
    togglePlugin()(Alpine as never);
    assert.equal(Alpine.cleanups.length, 1);
  });

  it("does not crash when Alpine.cleanup is missing", () => {
    interface AlpineMock {
      magics: Record<string, () => unknown>;
      magic: (name: string, factory: () => unknown) => void;
    }
    const Alpine: AlpineMock = {
      magics: {},
      magic: () => undefined,
    };
    assert.doesNotThrow(() => togglePlugin()(Alpine as never));
  });

  it("accepts a custom id at the plugin level", () => {
    // The plugin-level id is reserved for future use, but the
    // factory must accept it without throwing. Asserted here so
    // removing the parameter becomes a deliberate decision.
    const Alpine = createMockAlpine();
    assert.doesNotThrow(() => togglePlugin({ id: "demo-toggle" })(Alpine as never));
  });
});

describe("togglePlugin — $toggle factory", () => {
  it("builds a plain reactive shell instead of wrapping the controller", () => {
    const Alpine = createMockAlpine();
    const reactiveCalls: unknown[] = [];
    Alpine.reactive = <T>(value: T): T => {
      reactiveCalls.push(value);
      return value;
    };

    togglePlugin()(Alpine as never);
    const factory = resolveToggleMagic(Alpine);
    factory({ states: { on: "on", off: "off" } });

    assert.equal(reactiveCalls.length, 1);
    const shell = reactiveCalls[0] as { value: string; toggle: () => string };
    assert.equal(typeof shell.toggle, "function");
    assert.equal(shell.value, "on");
  });

  it("returns an independent instance per call", () => {
    const Alpine = createMockAlpine();
    togglePlugin()(Alpine as never);
    const factory = resolveToggleMagic(Alpine);

    const a = factory({ states: { on: "on", off: "off" } });
    const b = factory({ states: { on: "on", off: "off" } });
    assert.notEqual(a, b);

    a.toggle();
    assert.equal(a.value, "off");
    assert.equal(b.value, "on");
  });

  it("forwards mutations through the reactive proxy", () => {
    const Alpine = createMockAlpine();
    togglePlugin()(Alpine as never);
    const factory = resolveToggleMagic(Alpine);

    const instance = factory({ states: { on: "on", off: "off" } });
    assert.equal(instance.value, "on");
    instance.toggle();
    assert.equal(instance.value, "off");
  });

  it("preserves the consumer's generic narrowing on the factory", () => {
    type Binary = ToggleInstance<"on", "off", undefined, "on" | "off">;
    const Alpine = createMockAlpine();
    togglePlugin()(Alpine as never);
    const factory = Alpine.magics.toggle() as (opts: {
      states: { on: "on"; off: "off" };
    }) => Binary;

    const instance = factory({ states: { on: "on", off: "off" } });
    expectTypeOf(instance.value).toEqualTypeOf<"on" | "off">();
    expectTypeOf(instance.states.on).toEqualTypeOf<"on">();
    expectTypeOf(instance.states.off).toEqualTypeOf<"off">();
  });
});

describe("togglePlugin — cleanup", () => {
  it("stops mutations after Alpine.cleanup destroys controllers", () => {
    const Alpine = createMockAlpine();
    togglePlugin()(Alpine as never);
    const factory = resolveToggleMagic(Alpine);

    const instance = factory({ states: { on: "on", off: "off" } });
    instance.toggle();
    assert.equal(instance.value, "off");

    for (const fn of Alpine.cleanups) {
      fn();
    }

    instance.toggle();
    assert.equal(instance.value, "off");
  });
});
