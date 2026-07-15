/**
 * Doggo variant tests — custom states, cycling, reset, and change
 * subscriptions without Big Dog lifecycle infrastructure.
 */

import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import { createDoggoToggle, doggoTogglePlugin } from "../src/doggo.js";
import type { DoggoToggleChangeDetail, DoggoToggleInstance } from "../src/variants/doggo/types.js";

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

describe("createDoggoToggle() — binary", () => {
  it("defaults to the on state", () => {
    const toggle = createDoggoToggle({ states: { on: "on", off: "off" } });
    expect(toggle.value).toBe("on");
    expect(toggle.states).toEqual({ on: "on", off: "off", indeterminate: undefined });
  });

  it("toggle() flips between on and off", () => {
    const toggle = createDoggoToggle({ states: { on: 1, off: 0 }, initial: 1 });
    expect(toggle.toggle()).toBe(0);
    expect(toggle.toggle()).toBe(1);
  });
});

describe("createDoggoToggle() — ternary", () => {
  it("defaults to indeterminate when configured", () => {
    const toggle = createDoggoToggle({
      states: { on: "enabled", off: "disabled", indeterminate: "mixed" },
    });
    expect(toggle.value).toBe("mixed");
  });

  it("toggle() skips indeterminate and next() walks every state", () => {
    const toggle = createDoggoToggle({
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

describe("createDoggoToggle() — subscriptions", () => {
  it("onChange() delivers current and previous values", () => {
    const toggle = createDoggoToggle({ states: { on: "on", off: "off" }, initial: "on" });
    const changes: Array<DoggoToggleChangeDetail<"on" | "off">> = [];
    toggle.onChange((detail) => {
      changes.push(detail as DoggoToggleChangeDetail<"on" | "off">);
    });

    toggle.set("off");
    expect(changes).toEqual([{ current: "off", previous: "on" }]);
  });

  it("unsubscribe stops delivery", () => {
    const toggle = createDoggoToggle({ states: { on: 1, off: 0 }, initial: 1 });
    const calls: number[] = [];
    const unsubscribe = toggle.onChange((detail) => calls.push(detail.current));

    toggle.set(0);
    unsubscribe();
    toggle.set(1);
    expect(calls).toEqual([0]);
  });
});

describe("createDoggoToggle() — reset", () => {
  it("reset() restores the configured initial value", () => {
    const toggle = createDoggoToggle({
      states: { on: "enabled", off: "disabled", indeterminate: "mixed" },
      initial: "mixed",
    });
    toggle.toggle();
    toggle.reset();
    expect(toggle.value).toBe("mixed");
  });
});

describe("createDoggoToggle() — excluded Big Dog surface", () => {
  it("does not expose lifecycle, IDs, or the typed event bus", () => {
    const toggle = createDoggoToggle({ states: { on: 1, off: 0 } });
    expect("mount" in (toggle as unknown as Record<string, unknown>)).toBe(false);
    expect("destroy" in (toggle as unknown as Record<string, unknown>)).toBe(false);
    expect("setSilently" in (toggle as unknown as Record<string, unknown>)).toBe(false);
    expect("id" in (toggle as unknown as Record<string, unknown>)).toBe(false);
    expect(
      typeof (toggle as DoggoToggleInstance<number, number, undefined, number> & { on?: unknown })
        .on
    ).toBe("undefined");
  });
});

describe("doggoTogglePlugin — $toggle factory", () => {
  it("returns independent reactive instances", () => {
    const Alpine = createMockAlpine();
    doggoTogglePlugin()(Alpine as never);
    const factory = Alpine.magics.toggle() as (opts: {
      states: { on: string; off: string };
    }) => DoggoToggleInstance<string, string, undefined, string>;

    const a = factory({ states: { on: "on", off: "off" } });
    const b = factory({ states: { on: "on", off: "off" } });
    assert.notEqual(a, b);
    a.toggle();
    expect(a.value).toBe("off");
    expect(b.value).toBe("on");
  });
});
