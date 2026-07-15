/**
 * Alpine integration tests for `@ailuracode/alpine-toggle`.
 *
 * Per `.cursor/rules/testing.mdc`, plugin tests cover magic
 * registration, reactive wrapping, factory uniqueness, and cleanup.
 * A minimal mock Alpine exercises the contract without booting the
 * real runtime, plus a real `Proxy`-based harness exercises the
 * actual reactivity semantics that `Alpine.reactive` provides.
 *
 * The mock mirrors Alpine's real semantics: every access to a magic
 * invokes its factory. For toggle, the factory returns the toggle
 * factory function itself, which the consumer then calls with
 * `options`. Tests follow the same pattern as
 * `@ailuracode/alpine-theme/test/plugin.spec.ts`.
 */

import assert from "node:assert/strict";
import { describe, expectTypeOf, it } from "vitest";
import { type ToggleInstance, togglePlugin } from "../src/index";
import type { ToggleReactiveView } from "../src/types";

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
  }) => ToggleReactiveView<TA, TB, TN>;
}

/**
 * Tracks every property write on an Alpine-style reactive proxy.
 * Mirrors the calendar package's reactivity test harness.
 */
function createReactiveHarness() {
  const writes: Array<{ key: string; value: unknown }> = [];
  function wrap<T extends object>(value: T): T {
    return new Proxy(value, {
      set(target, prop, next) {
        if (typeof prop === "string") {
          writes.push({ key: prop, value: next });
        }
        return Reflect.set(target, prop, next);
      },
    }) as T;
  }
  return { wrap, writes };
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
  it("wraps the facade in Alpine.reactive exactly once", () => {
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
    const callArg = reactiveCalls[0] as { value: string } | undefined;
    assert.equal(callArg?.value, "on");
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

  it("preserves the consumer's generic narrowing on the factory", () => {
    type Binary = ToggleReactiveView<"on", "off", undefined>;
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

describe("togglePlugin — reactivity (real Proxy)", () => {
  it("toggle() writes through the reactive proxy on `value`", () => {
    const Alpine = createMockAlpine();
    const { wrap, writes } = createReactiveHarness();
    Alpine.reactive = <T>(value: T): T => wrap(value as object) as T;

    togglePlugin()(Alpine as never);
    const factory = resolveToggleMagic(Alpine);
    const instance = factory({ states: { on: "on", off: "off" } });

    writes.length = 0;
    instance.toggle();
    assert.deepEqual(writes, [{ key: "value", value: "off" }]);
    assert.equal(instance.value, "off");
  });

  it("set(), next(), and reset() each write `value` exactly once through the proxy", () => {
    const Alpine = createMockAlpine();
    const { wrap, writes } = createReactiveHarness();
    Alpine.reactive = <T>(value: T): T => wrap(value as object) as T;

    togglePlugin()(Alpine as never);
    const factory = resolveToggleMagic(Alpine);
    const instance = factory({ states: { on: "on", off: "off" } });

    // set: "on" → "off"
    writes.length = 0;
    instance.set("off");
    assert.deepEqual(writes, [{ key: "value", value: "off" }]);

    // reset: "off" → "on" (the initial). Tracks the previous off.
    writes.length = 0;
    instance.reset();
    assert.deepEqual(writes, [{ key: "value", value: "on" }]);

    // next: "on" → "off".
    writes.length = 0;
    instance.next();
    assert.deepEqual(writes, [{ key: "value", value: "off" }]);
  });

  it("setSilently() writes the new value to the reactive view without emitting a controller event", () => {
    const Alpine = createMockAlpine();
    const { wrap, writes } = createReactiveHarness();
    Alpine.reactive = <T>(value: T): T => wrap(value as object) as T;

    togglePlugin()(Alpine as never);
    const factory = resolveToggleMagic(Alpine);
    const instance = factory({ states: { on: "on", off: "off" } });

    writes.length = 0;
    instance.setSilently("off");

    // The facade must re-render…
    assert.equal(instance.value, "off");
    // …and the only write the proxy observes is the direct facade
    // method assignment (setSilently must NOT trigger the bridge
    // subscription — the controller never emitted a `change` event).
    assert.deepEqual(writes, [{ key: "value", value: "off" }]);
  });

  it("forwarding mutations updates the read-back value", () => {
    const Alpine = createMockAlpine();
    togglePlugin()(Alpine as never);
    const factory = resolveToggleMagic(Alpine);

    const instance = factory({ states: { on: "on", off: "off" } });
    assert.equal(instance.value, "on");
    instance.toggle();
    assert.equal(instance.value, "off");
  });

  it("lifecycle flags reflect the controller's current state", async () => {
    const Alpine = createMockAlpine();
    togglePlugin()(Alpine as never);
    const factory = resolveToggleMagic(Alpine);

    const instance = factory({ states: { on: "on", off: "off" } });
    assert.equal(instance.isMounted, true);
    assert.equal(instance.isDestroyed, false);
    assert.match(instance.id, /^toggle-/);

    for (const fn of Alpine.cleanups) {
      fn();
    }

    assert.equal(instance.isDestroyed, true);
    // Re-await a microtask so the queued init task has a chance to
    // run before the assertion — belt and braces.
    await Promise.resolve();
    assert.equal(instance.isDestroyed, true);
  });
});

describe("togglePlugin — cleanup", () => {
  it("destroys every controller and detaches bridge subscriptions when Alpine.cleanup fires", () => {
    const Alpine = createMockAlpine();
    togglePlugin()(Alpine as never);
    const factory = resolveToggleMagic(Alpine);

    const a = factory({ states: { on: 1, off: 0 } });
    const b = factory({ states: { on: 1, off: 0 } });

    for (const fn of Alpine.cleanups) {
      fn();
    }

    assert.equal(a.isDestroyed, true);
    assert.equal(b.isDestroyed, true);

    // Subsequent `set` calls must be silent and no-ops — the
    // controller is destroyed so the facade's command paths
    // observe `isDestroyed === true` and bail out.
    assert.doesNotThrow(() => a.set(0));
    assert.doesNotThrow(() => b.set(1));
  });

  it("does not throw when cleanup runs with no registered instances", () => {
    const Alpine = createMockAlpine();
    togglePlugin()(Alpine as never);
    assert.doesNotThrow(() => {
      for (const fn of Alpine.cleanups) {
        fn();
      }
    });
  });
});

describe("ToggleInstance — public contract still satisfied", () => {
  it("the Alpine facade is assignable to ToggleInstance", () => {
    const Alpine = createMockAlpine();
    togglePlugin()(Alpine as never);
    const factory = resolveToggleMagic(Alpine);

    // A consumer holding a `ToggleInstance` reference can still
    // accept the Alpine facade — the facade extends ToggleInstance.
    const view: ToggleInstance<"on", "off", undefined, "on" | "off"> = factory({
      states: { on: "on", off: "off" },
    });
    assert.equal(view.value, "on");
    assert.equal(typeof view.toggle, "function");
    assert.equal(typeof view.set, "function");
    assert.equal(typeof view.next, "function");
    assert.equal(typeof view.reset, "function");
    assert.equal(typeof view.is, "function");
  });
});
