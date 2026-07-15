/**
 * Puppy variant tests — boolean-only behavior and Alpine integration.
 */

import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import { createToggle, type ToggleInstance, togglePlugin } from "../src/puppy.js";

interface MockAlpine {
  magics: Record<string, () => unknown>;
  reactiveCalls: unknown[];
  reactive<T>(value: T): T;
  magic(name: string, factory: () => unknown): void;
}

function createMockAlpine(): MockAlpine {
  return {
    magics: {},
    reactiveCalls: [],
    reactive<T>(value: T) {
      this.reactiveCalls.push(value);
      return value;
    },
    magic(name, factory) {
      this.magics[name] = factory;
    },
  };
}

describe("createToggle() — Puppy", () => {
  it("defaults to false", () => {
    expect(createToggle().value).toBe(false);
  });

  it("accepts an explicit initial value", () => {
    expect(createToggle(true).value).toBe(true);
  });

  it("toggle() flips the boolean", () => {
    const toggle = createToggle(false);
    expect(toggle.toggle()).toBe(true);
    expect(toggle.toggle()).toBe(false);
  });

  it("set() is a no-op when the value is unchanged", () => {
    const toggle = createToggle(true);
    toggle.set(true);
    expect(toggle.value).toBe(true);
  });

  it("does not expose event, lifecycle, or state configuration APIs", () => {
    const toggle = createToggle(false);
    const record = toggle as unknown as Record<string, unknown>;
    expect("on" in record).toBe(false);
    expect("destroy" in record).toBe(false);
    expect("states" in record).toBe(false);
    expect("id" in record).toBe(false);
  });
});

describe("togglePlugin — Puppy $toggle factory", () => {
  it("wraps the controller in Alpine.reactive", () => {
    const Alpine = createMockAlpine();
    togglePlugin()(Alpine as never);
    const factory = Alpine.magics.toggle() as (initial?: boolean) => ToggleInstance;
    factory(true);
    assert.equal(Alpine.reactiveCalls.length, 1);
  });

  it("returns independent instances per call", () => {
    const Alpine = createMockAlpine();
    togglePlugin()(Alpine as never);
    const factory = Alpine.magics.toggle() as (initial?: boolean) => ToggleInstance;

    const a = factory(false);
    const b = factory(false);
    assert.notEqual(a, b);
    a.toggle();
    expect(a.value).toBe(true);
    expect(b.value).toBe(false);
  });
});
