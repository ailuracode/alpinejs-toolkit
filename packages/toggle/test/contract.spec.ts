import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { createDoggoToggle } from "../src/doggo.js";
import { createToggle } from "../src/plugin.js";
import { createPuppyToggle } from "../src/puppy.js";

interface BaseToggle<T> {
  readonly value: T;
  set(value: T): void;
  toggle(): T;
}

type ToggleFactory = (initial?: boolean) => BaseToggle<boolean>;

function runContractSuite(label: string, factory: ToggleFactory): void {
  describe(`${label} common contract`, () => {
    it("resolves and exposes the supplied initial value", () => {
      const toggle = factory(false);

      assert.equal(toggle.value, false);
    });

    it("sets valid values and treats the current value idempotently", () => {
      const toggle = factory(false);

      toggle.set(true);
      assert.equal(toggle.value, true);
      toggle.set(true);
      assert.equal(toggle.value, true);
    });

    it("toggles binary state and returns the new value", () => {
      const toggle = factory(false);

      assert.equal(toggle.toggle(), true);
      assert.equal(toggle.value, true);
      assert.equal(toggle.toggle(), false);
    });
  });
}

runContractSuite("Puppy", (initial = false) => createPuppyToggle(initial));
runContractSuite("Doggo", (initial = false) =>
  createDoggoToggle({ states: { on: true, off: false }, initial })
);
runContractSuite("Big Dog", (initial = false) =>
  createToggle({ states: { on: true, off: false }, initial })
);
