/**
 * Controller tests for `@ailuracode/alpine-toggle`.
 *
 * Covers the framework-agnostic {@link ToggleController} surface:
 * state shape, transitions, event emission, and lifecycle. The Alpine
 * integration is tested separately in `plugin.spec.ts`.
 *
 * Test ordering follows the package's intended usage — binary first
 * (the primary case), ternary as a focused supplement.
 */

import assert from "node:assert/strict";
import { describe, expect, expectTypeOf, it } from "vitest";
import type { ToggleChangeDetail, ToggleEvents, ToggleInstance } from "../src/index";
import { createToggle } from "../src/index";

describe("createToggle() — binary (the primary case)", () => {
  it("exposes the configured states and defaults to `on`", () => {
    const toggle = createToggle({ states: { on: "on", off: "off" } });

    expect(toggle.states).toEqual({ on: "on", off: "off", indeterminate: undefined });
    expect(toggle.value).toBe("on");
    expect(toggle.is(toggle.states.on)).toBe(true);
    expect(toggle.is(toggle.states.off)).toBe(false);
  });

  it("toggle() flips between on and off", () => {
    const toggle = createToggle({ states: { on: "on", off: "off" } });

    expect(toggle.toggle()).toBe("off");
    expect(toggle.value).toBe("off");
    expect(toggle.toggle()).toBe("on");
  });

  it("next() cycles through the two states", () => {
    const toggle = createToggle({ states: { on: true, off: false } });

    toggle.next();
    expect(toggle.value).toBe(false);
    toggle.next();
    expect(toggle.value).toBe(true);
  });

  it("set() changes the value and returns void", () => {
    const toggle = createToggle({ states: { on: 1, off: 0 }, initial: 1 });

    const result = toggle.set(0);
    expect(result).toBeUndefined();
    expect(toggle.value).toBe(0);

    // setting the current value is a no-op (no event)
    const events: ToggleChangeDetail<number, number, undefined>[] = [];
    toggle.on("change", (detail) => events.push(detail));
    toggle.set(0);
    expect(events).toHaveLength(0);
  });

  it("set() silently rejects values outside the configured states", () => {
    const toggle = createToggle({ states: { on: 1, off: 0 }, initial: 1 });
    const events: ToggleChangeDetail<number, number, undefined>[] = [];
    toggle.on("change", (detail) => events.push(detail));

    toggle.set(42 as never);
    expect(events).toHaveLength(0);
    expect(toggle.value).toBe(1);
  });

  it("reset() restores the initial value", () => {
    const toggle = createToggle({ states: { on: 1, off: 0 }, initial: 1 });
    toggle.set(0);
    toggle.reset();
    expect(toggle.value).toBe(1);
  });

  it("infers the value type from the configured states", () => {
    const toggle = createToggle({
      states: { on: "on" as const, off: "off" as const },
    });

    expectTypeOf(toggle.value).toEqualTypeOf<"on" | "off">();
    expectTypeOf(toggle.states.on).toEqualTypeOf<"on">();
    expectTypeOf(toggle.states.off).toEqualTypeOf<"off">();
    expectTypeOf(toggle.states.indeterminate).toEqualTypeOf<undefined>();
  });
});

describe("createToggle() — ternary (opt-in)", () => {
  it("defaults to `indeterminate` when one is configured", () => {
    const toggle = createToggle({
      states: { on: "yes", off: "no", indeterminate: "unknown" },
    });

    expect(toggle.value).toBe("unknown");
    expect(toggle.states.indeterminate).toBe("unknown");
  });

  it("toggle() skips `indeterminate` and only flips opposites", () => {
    const toggle = createToggle({
      states: { on: "yes", off: "no", indeterminate: "unknown" },
      initial: "unknown",
    });

    expect(toggle.toggle()).toBe("yes");
    toggle.toggle();
    expect(toggle.value).toBe("no");
    toggle.toggle();
    expect(toggle.value).toBe("yes");
  });

  it("next() walks every state in declaration order", () => {
    const toggle = createToggle({
      states: { on: "a", off: "b", indeterminate: "c" },
      initial: "a",
    });

    toggle.next();
    expect(toggle.value).toBe("b");
    toggle.next();
    expect(toggle.value).toBe("c");
    expect(toggle.is(toggle.states.indeterminate)).toBe(true);
    toggle.next();
    expect(toggle.value).toBe("a");
  });

  it("infers the value union across all three states", () => {
    const toggle = createToggle({
      states: { on: true, off: false, indeterminate: null },
    });

    expectTypeOf(toggle.value).toEqualTypeOf<true | false | null>();
  });
});

describe("ToggleController — events", () => {
  it("emits the initialization event on a microtask with previous=null", async () => {
    const toggle = createToggle({
      states: { on: "on" as const, off: "off" as const },
      initial: "on",
    });

    const events: ToggleChangeDetail<"on", "off", undefined>[] = [];
    toggle.on("change", (detail) => events.push(detail));

    // No synchronous emit — wait one microtask.
    expect(events).toHaveLength(0);
    await Promise.resolve();
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      current: "on",
      previous: null,
      source: "initialization",
    });
  });

  it("emits 'user' events with the previous snapshot", () => {
    const toggle = createToggle({
      states: { on: "on" as const, off: "off" as const },
      initial: "on",
    });
    const events: ToggleChangeDetail<"on", "off", undefined>[] = [];
    toggle.on("change", (detail) => events.push(detail));

    toggle.set("off");
    expect(events.at(-1)).toEqual({
      current: "off",
      previous: "on",
      source: "user",
    });

    toggle.toggle();
    expect(events.at(-1)).toEqual({
      current: "on",
      previous: "off",
      source: "user",
    });
  });

  it("emits 'reset' events with the initial value", () => {
    const toggle = createToggle({
      states: { on: "on" as const, off: "off" as const },
      initial: "on",
    });
    const events: ToggleChangeDetail<"on", "off", undefined>[] = [];
    toggle.on("change", (detail) => events.push(detail));

    toggle.set("off");
    toggle.reset();
    expect(events.at(-1)).toEqual({
      current: "on",
      previous: "off",
      source: "reset",
    });
  });

  it("unsubscribe stops delivery", () => {
    const toggle = createToggle({
      states: { on: "on" as const, off: "off" as const },
      initial: "on",
    });
    const calls: ("on" | "off")[] = [];
    const unsubscribe = toggle.on("change", (detail) => {
      calls.push(detail.current as "on" | "off");
    });

    toggle.set("off");
    unsubscribe();
    toggle.set("on");
    expect(calls).toEqual(["off"]);
  });

  it("types on() against the per-instance EventMap", () => {
    const toggle = createToggle({
      states: { on: "yes", off: "no", indeterminate: "unknown" },
      initial: "yes",
    });

    expectTypeOf(toggle).toMatchTypeOf<{
      on<K extends keyof ToggleEvents<"yes", "no", "unknown">>(
        event: K,
        listener: (detail: ToggleEvents<"yes", "no", "unknown">[K]) => void
      ): unknown;
    }>();
  });
});

describe("ToggleController — silent hydration", () => {
  it("setSilently() changes the value without emitting", () => {
    const toggle = createToggle({ states: { on: 1, off: 0 }, initial: 1 });
    const events: ToggleChangeDetail<number, number, undefined>[] = [];
    toggle.on("change", (detail) => events.push(detail));

    toggle.setSilently(0);
    expect(toggle.value).toBe(0);
    expect(events).toHaveLength(0);
  });

  it("setSilently() rejects invalid values", () => {
    const toggle = createToggle({ states: { on: 1, off: 0 }, initial: 1 });
    const events: ToggleChangeDetail<number, number, undefined>[] = [];
    toggle.on("change", (detail) => events.push(detail));

    toggle.setSilently(42 as never);
    expect(toggle.value).toBe(1);
    expect(events).toHaveLength(0);
  });

  it("setSilently() before the init microtask preserves the hydrated value", async () => {
    const toggle = createToggle({ states: { on: 1, off: 0 }, initial: 1 });
    toggle.setSilently(0);
    // Microtask has not run yet — wait for it.
    await Promise.resolve();
    expect(toggle.value).toBe(0);
  });

  it("init event carries the hydrated value (not the original initial)", async () => {
    const toggle = createToggle({
      states: { on: "on" as const, off: "off" as const },
      initial: "on",
    });
    toggle.setSilently("off");
    const events: ToggleChangeDetail<"on", "off", undefined>[] = [];
    toggle.on("change", (detail) => events.push(detail));
    await Promise.resolve();
    expect(events).toEqual([{ current: "off", previous: null, source: "initialization" }]);
  });

  it("reset() restores the original initial, not the hydrated value", () => {
    const toggle = createToggle({
      states: { on: "on" as const, off: "off" as const },
      initial: "on",
    });
    toggle.setSilently("off");
    toggle.reset();
    expect(toggle.value).toBe("on");
  });
});

describe("ToggleController — lifecycle", () => {
  it("exposes an auto-generated id when none is provided", () => {
    const toggle = createToggle({ states: { on: 1, off: 0 } });
    expect(toggle.id).toMatch(/^toggle-/);
    expect(toggle.isDestroyed).toBe(false);
  });

  it("uses the supplied id when provided", () => {
    const toggle = createToggle({
      states: { on: 1, off: 0 },
      id: "my-toggle",
    });
    expect(toggle.id).toBe("my-toggle");
  });

  it("destroy() is idempotent and flips isDestroyed", () => {
    const toggle = createToggle({ states: { on: 1, off: 0 } });
    toggle.destroy();
    toggle.destroy(); // does not throw
    expect(toggle.isDestroyed).toBe(true);
  });

  it("destroy() detaches every listener", () => {
    const toggle = createToggle({ states: { on: 1, off: 0 }, initial: 1 });
    let calls = 0;
    toggle.on("change", () => {
      calls++;
    });

    toggle.destroy();
    toggle.set(0); // would normally emit — now silent
    expect(calls).toBe(0);
  });
});

describe("ToggleController — standalone surface", () => {
  it("matches the public ToggleInstance contract", () => {
    const toggle: ToggleInstance<"a", "b", undefined, "a" | "b"> = createToggle({
      states: { on: "a", off: "b" },
    });

    // Compile-time guarantees from the contract; runtime checks for
    // presence.
    assert.equal(typeof toggle.value, "string");
    assert.equal(typeof toggle.toggle, "function");
    assert.equal(typeof toggle.set, "function");
    assert.equal(typeof toggle.reset, "function");
    assert.equal(typeof toggle.next, "function");
    assert.equal(typeof toggle.is, "function");
  });
});
