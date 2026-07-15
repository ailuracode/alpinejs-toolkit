import assert from "node:assert/strict";
import { describe, it } from "vitest";
import {
  buildStateCycle,
  resolveNextCycle,
  resolveToggleTarget,
} from "../src/internal/transitions.js";
import {
  hasIndeterminateState,
  isConfiguredState,
  resolveInitial,
} from "../src/internal/validation.js";

describe("toggle transition helpers", () => {
  it("builds frozen binary and ternary cycles", () => {
    const binary = buildStateCycle({ on: "on", off: "off" });
    const ternary = buildStateCycle({ on: "on", off: "off", indeterminate: "unknown" });

    assert.deepEqual(binary, ["on", "off"]);
    assert.deepEqual(ternary, ["on", "off", "unknown"]);
    assert.equal(Object.isFrozen(binary), true);
    assert.equal(Object.isFrozen(ternary), true);
  });

  it("resolves binary toggle targets and skips indeterminate", () => {
    const states = { on: "on", off: "off", indeterminate: "unknown" } as const;

    assert.equal(resolveToggleTarget("on", states, true), "off");
    assert.equal(resolveToggleTarget("off", states, true), "on");
    assert.equal(resolveToggleTarget("unknown", states, true), "on");
  });

  it("resolves the next cycle value", () => {
    const cycle = buildStateCycle({ on: "on", off: "off", indeterminate: "unknown" });

    assert.equal(resolveNextCycle("on", cycle), "off");
    assert.equal(resolveNextCycle("off", cycle), "unknown");
    assert.equal(resolveNextCycle("unknown", cycle), "on");
  });
});

describe("toggle validation helpers", () => {
  it("detects configured states and indeterminate support", () => {
    const binary = { on: "on", off: "off" } as const;
    const ternary = { ...binary, indeterminate: "unknown" } as const;

    assert.equal(hasIndeterminateState(binary), false);
    assert.equal(hasIndeterminateState(ternary), true);
    assert.equal(isConfiguredState(ternary, "unknown"), true);
    assert.equal(isConfiguredState(ternary, "missing"), false);
  });

  it("uses an explicit initial state or the configured default", () => {
    assert.equal(resolveInitial({ on: "on", off: "off" }, undefined), "on");
    assert.equal(
      resolveInitial({ on: "on", off: "off", indeterminate: "unknown" }, undefined),
      "unknown"
    );
    assert.equal(resolveInitial({ on: "on", off: "off" }, "off"), "off");
  });
});
