/**
 * Doggo variant tests — custom states, cycling, reset, and change
 * subscriptions without Big Dog lifecycle infrastructure.
 */

import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import {
  createToggle,
  type ToggleChangeDetail,
  type ToggleInstance,
  togglePlugin,
} from "../src/doggo.js";

interface MockAlpine {
  magics: Record<string, () => unknown>;
  reactive<T>(value: T): T;
  magic(name: string, factory: () => unknown): void;
}

function createMockAlpine(): MockAlpine {
  return {
    magics: {},
    reactive<T>(value: T) {
      return value;
    },
    magic(name, factory) {
      this.magics[name] = factory;
    },
  };
}

describe("createToggle() — Doggo binary", () => {
  it("defaults to the on state", () => {
    const toggle = createToggle({ states: { on: "on", off: "off" } });
    expect(toggle.value).toBe("on");
    expect(toggle.states).toEqual({ on: "on", off: "off", indeterminate: undefined });
  });

  it("toggle() flips between on and off", () => {
    const toggle = createToggle({ states: { on: 1, off: 0 }, initial: 1 });
    expect(toggle.toggle()).toBe(0);
    expect(toggle.toggle()).toBe(1);
  });
});

describe("createToggle() — Doggo ternary", () => {
  it("defaults to indeterminate when configured", () => {
    const toggle = createToggle({
      states: { on: "enabled", off: "disabled", indeterminate: "mixed" },
    });
    expect(toggle.value).toBe("mixed");
  });

  it("toggle() skips indeterminate and next() walks every state", () => {
    const toggle = createToggle({
      states: { on: "a", off: "b", indeterminate: "c" },
      initial: "c",
    });

    expect(toggle.toggle()).toBe("a");
    toggle.next();
    expect(toggle.value).toBe("b");
    toggle.next();
    expect(toggle.value).toBe("c");
  });
});

describe("createToggle() — Doggo subscriptions", () => {
  it("onChange() delivers current and previous values", () => {
    const toggle = createToggle({ states: { on: "on", off: "off" }, initial: "on" });
    const changes: Array<ToggleChangeDetail<"on" | "off">> = [];
    toggle.onChange((detail) => {
      changes.push(detail as ToggleChangeDetail<"on" | "off">);
    });

    toggle.set("off");
    expect(changes).toEqual([{ current: "off", previous: "on" }]);
  });

  it("unsubscribe stops delivery", () => {
    const toggle = createToggle({ states: { on: 1, off: 0 }, initial: 1 });
    const calls: number[] = [];
    const unsubscribe = toggle.onChange((detail) => calls.push(detail.current));

    toggle.set(0);
    unsubscribe();
    toggle.set(1);
    expect(calls).toEqual([0]);
  });
});

describe("createToggle() — Doggo reset", () => {
  it("reset() restores the configured initial value", () => {
    const toggle = createToggle({
      states: { on: "enabled", off: "disabled", indeterminate: "mixed" },
      initial: "mixed",
    });
    toggle.toggle();
    toggle.reset();
    expect(toggle.value).toBe("mixed");
  });
});

describe("createToggle() — Doggo excluded Big Dog surface", () => {
  it("does not expose lifecycle, IDs, or the typed event bus", () => {
    const toggle = createToggle({ states: { on: 1, off: 0 } });
    expect("mount" in (toggle as unknown as Record<string, unknown>)).toBe(false);
    expect("destroy" in (toggle as unknown as Record<string, unknown>)).toBe(false);
    expect("setSilently" in (toggle as unknown as Record<string, unknown>)).toBe(false);
    expect("id" in (toggle as unknown as Record<string, unknown>)).toBe(false);
    expect(
      typeof (toggle as ToggleInstance<number, number, undefined, number> & { on?: unknown }).on
    ).toBe("undefined");
  });
});

describe("togglePlugin — Doggo $toggle factory", () => {
  it("returns independent reactive instances", () => {
    const Alpine = createMockAlpine();
    togglePlugin()(Alpine as never);
    const factory = Alpine.magics.toggle() as (opts: {
      states: { on: string; off: string };
    }) => ToggleInstance<string, string, undefined, string>;

    const a = factory({ states: { on: "on", off: "off" } });
    const b = factory({ states: { on: "on", off: "off" } });
    assert.notEqual(a, b);
    a.toggle();
    expect(a.value).toBe("off");
    expect(b.value).toBe("on");
  });
});
