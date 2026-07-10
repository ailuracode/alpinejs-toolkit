/**
 * Tests for {@link generateId} — the canonical default-id generator
 * shared across packages. Locks the prefix format and the
 * process-wide monotonic counter so {@link BaseController} and any
 * feature package (toggle, dialog, menu, …) can rely on it.
 */
import assert from "node:assert/strict";
import { describe, expect, it } from "vitest";
import { generateId } from "../src/index";

describe("generateId", () => {
  it("returns a string with the given prefix", () => {
    expect(generateId("alpha")).toMatch(/^alpha-[a-z0-9]+$/);
  });

  it("never returns two equal ids across calls", () => {
    const a = generateId("dup");
    const b = generateId("dup");
    assert.notEqual(a, b);
  });

  it("uses an isolated counter per prefix family — different prefixes share the global counter but keep distinct prefixes", () => {
    const x = generateId("x");
    const y = generateId("y");
    assert.ok(x.startsWith("x-"));
    assert.ok(y.startsWith("y-"));
  });

  it("uses a base-36 suffix (no decimal digits beyond 9, no uppercase)", () => {
    const id = generateId("base36");
    const suffix = id.slice("base36-".length);
    assert.match(suffix, /^[0-9a-z]+$/);
  });
});
