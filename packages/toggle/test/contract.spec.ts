/**
 * Shared contract tests across Puppy, Doggo, and Big Dog toggle variants.
 *
 * Verifies the common `value`, `set()`, and `toggle()` surface plus
 * `$toggle` magic registration for each entrypoint.
 */

import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import { createDoggoToggle, doggoTogglePlugin } from "../src/doggo.js";
import { createToggle, togglePlugin } from "../src/index.js";
import type { BaseToggle } from "../src/internal/base-types.js";
import { createPuppyToggle, puppyTogglePlugin } from "../src/puppy.js";

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

function exerciseBaseContract<T>(toggle: BaseToggle<T>, on: T, off: T): void {
  expect(toggle.value).toBe(on);
  toggle.set(off);
  expect(toggle.value).toBe(off);
  expect(toggle.toggle()).toBe(on);
  expect(toggle.value).toBe(on);
}

describe("toggle variants — shared contract", () => {
  it("Puppy implements value, set(), and toggle()", () => {
    exerciseBaseContract(createPuppyToggle(false), false, true);
  });

  it("Doggo implements value, set(), and toggle()", () => {
    exerciseBaseContract(createDoggoToggle({ states: { on: "on", off: "off" } }), "on", "off");
  });

  it("Big Dog implements value, set(), and toggle()", () => {
    exerciseBaseContract(createToggle({ states: { on: "on", off: "off" } }), "on", "off");
  });
});

describe("toggle variants — $toggle magic registration", () => {
  it("Puppy registers the $toggle magic", () => {
    const Alpine = createMockAlpine();
    puppyTogglePlugin()(Alpine as never);
    assert.ok(Alpine.magics.toggle);
  });

  it("Doggo registers the $toggle magic", () => {
    const Alpine = createMockAlpine();
    doggoTogglePlugin()(Alpine as never);
    assert.ok(Alpine.magics.toggle);
  });

  it("Big Dog registers the $toggle magic", () => {
    const Alpine = createMockAlpine();
    togglePlugin()(Alpine as never);
    assert.ok(Alpine.magics.toggle);
  });
});

describe("toggle variants — upgrade compatibility", () => {
  it("common Puppy usage keeps working on Doggo", () => {
    const puppy = createPuppyToggle(false);
    puppy.toggle();

    const doggo = createDoggoToggle({
      states: { on: true, off: false },
      initial: puppy.value,
    });

    doggo.toggle();
    expect(doggo.value).toBe(false);
    doggo.set(true);
    expect(doggo.value).toBe(true);
  });

  it("common Doggo usage keeps working on Big Dog", () => {
    const doggo = createDoggoToggle({
      states: { on: "enabled", off: "disabled", indeterminate: "mixed" },
      initial: "mixed",
    });
    doggo.set("disabled");
    doggo.toggle();

    const bigDog = createToggle({
      states: { on: "enabled", off: "disabled", indeterminate: "mixed" },
      initial: doggo.value,
    });

    expect(bigDog.value).toBe("enabled");
    bigDog.set("disabled");
    expect(bigDog.toggle()).toBe("enabled");
  });
});
