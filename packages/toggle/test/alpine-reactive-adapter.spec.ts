/**
 * Alpine.reactive adapter tests — plain shells mirror controller state.
 */

import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import { ToggleController } from "../src/controller.js";
import {
  type AlpineReactiveHost,
  bridgeBooleanToggleToAlpine,
  bridgeDoggoToggleToAlpine,
  bridgeToggleControllerToAlpine,
} from "../src/internal/alpine-reactive-adapter.js";
import { createDoggoToggle } from "../src/variants/doggo/controller.js";
import { createPuppyToggle } from "../src/variants/puppy/controller.js";

function createTrackingAlpine(): AlpineReactiveHost & { snapshots: object[] } {
  const snapshots: object[] = [];
  return {
    snapshots,
    reactive<T extends object>(value: T): T {
      snapshots.push(value);
      return value;
    },
  };
}

describe("bridgeBooleanToggleToAlpine", () => {
  it("builds a plain reactive shell, not the controller instance", () => {
    const Alpine = createTrackingAlpine();
    const controller = createPuppyToggle(false);
    const shell = bridgeBooleanToggleToAlpine(Alpine, controller);

    assert.notEqual(shell, controller);
    assert.equal(Alpine.snapshots.length, 1);
    expect(shell.value).toBe(false);
  });

  it("mirrors value after toggle()", () => {
    const Alpine = createTrackingAlpine();
    const shell = bridgeBooleanToggleToAlpine(Alpine, createPuppyToggle(false));

    shell.toggle();
    expect(shell.value).toBe(true);
  });
});

describe("bridgeDoggoToggleToAlpine", () => {
  it("mirrors value after commands and onChange", () => {
    const Alpine = createTrackingAlpine();
    const controller = createDoggoToggle({ states: { on: "on", off: "off" }, initial: "on" });
    const shell = bridgeDoggoToggleToAlpine(Alpine, controller);

    shell.set("off");
    expect(shell.value).toBe("off");
    shell.toggle();
    expect(shell.value).toBe("on");
  });
});

describe("bridgeToggleControllerToAlpine", () => {
  it("builds a plain reactive shell, not the controller instance", () => {
    const Alpine = createTrackingAlpine();
    const controller = new ToggleController({ states: { on: "on", off: "off" } });
    controller.mount();
    const shell = bridgeToggleControllerToAlpine(Alpine, controller);

    assert.notEqual(shell, controller);
    assert.equal(Alpine.snapshots.length, 1);
    expect(shell.value).toBe("on");
  });

  it("mirrors value after toggle()", () => {
    const Alpine = createTrackingAlpine();
    const controller = new ToggleController({
      states: { on: "yes", off: "no" },
      initial: "no",
    });
    controller.mount();
    const shell = bridgeToggleControllerToAlpine(Alpine, controller);

    shell.toggle();
    expect(shell.value).toBe("yes");
  });

  it("mirrors the initialization change event", async () => {
    const Alpine = createTrackingAlpine();
    const controller = new ToggleController({
      states: { on: "yes", off: "no" },
      initial: "no",
    });
    controller.mount();
    const shell = bridgeToggleControllerToAlpine(Alpine, controller);

    expect(shell.value).toBe("no");
    await Promise.resolve();
    expect(shell.value).toBe("no");
  });
});
