/**
 * Tests for the `error.ts` module — fills the coverage gap the
 * verify report flagged (`isOverlayErrorCode` had 0 tests; the
 * `ALREADY_REGISTERED` code is reserved for v2 but is part of the
 * public type union, so it must be exercised).
 *
 * Goal: push `error.ts` statements coverage above the 90%
 * architecture target. The module has no side effects, so the
 * tests just construct / branch through every code path.
 */

import { describe, expect, it } from "vitest";
import { isOverlayErrorCode, OverlayError } from "../src/error.js";
import type { OverlayErrorCode } from "../src/error.js";

const ALL_CODES: OverlayErrorCode[] = [
  "OVERLAY_NOT_CONFIGURED",
  "INVALID_PLUGIN_ID",
  "INVALID_OPTIONS",
  "ALREADY_REGISTERED",
];

describe("isOverlayErrorCode", () => {
  it("returns true for every declared code", () => {
    for (const code of ALL_CODES) {
      expect(isOverlayErrorCode(code)).toBe(true);
    }
  });

  it("returns false for an unknown string", () => {
    expect(isOverlayErrorCode("BOGUS_CODE")).toBe(false);
    expect(isOverlayErrorCode("overlay_not_configured")).toBe(false); // case matters
    expect(isOverlayErrorCode("")).toBe(false);
  });

  it("returns false for null / undefined (defensive)", () => {
    expect(isOverlayErrorCode(null)).toBe(false);
    expect(isOverlayErrorCode(undefined)).toBe(false);
  });

  it("returns false for non-string primitives", () => {
    expect(isOverlayErrorCode(123)).toBe(false);
    expect(isOverlayErrorCode(0)).toBe(false);
    expect(isOverlayErrorCode(true)).toBe(false);
    expect(isOverlayErrorCode(false)).toBe(false);
  });

  it("returns false for object / array / symbol inputs", () => {
    expect(isOverlayErrorCode({})).toBe(false);
    expect(isOverlayErrorCode({ code: "OVERLAY_NOT_CONFIGURED" })).toBe(false); // shape check, not duck-type
    expect(isOverlayErrorCode([])).toBe(false);
    expect(isOverlayErrorCode(Symbol("OVERLAY_NOT_CONFIGURED"))).toBe(false);
    expect(isOverlayErrorCode(() => "OVERLAY_NOT_CONFIGURED")).toBe(false);
  });
});

describe("OverlayError", () => {
  it("exposes the supplied message and code on the instance", () => {
    const err = new OverlayError("boom", "INVALID_PLUGIN_ID");
    expect(err.message).toBe("boom");
    expect(err.code).toBe("INVALID_PLUGIN_ID");
  });

  it("sets `name` to 'OverlayError' for readable stack traces", () => {
    const err = new OverlayError("boom", "INVALID_PLUGIN_ID");
    expect(err.name).toBe("OverlayError");
  });

  it("is an instanceof the built-in `Error`", () => {
    const err = new OverlayError("boom", "INVALID_PLUGIN_ID");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(OverlayError);
  });

  it("captures a stack trace (Error parent behavior)", () => {
    const err = new OverlayError("boom", "INVALID_PLUGIN_ID");
    expect(typeof err.stack).toBe("string");
    expect((err.stack ?? "").length).toBeGreaterThan(0);
  });

  it("carries an optional `cause` when supplied", () => {
    const cause = { reason: "underlying" };
    const err = new OverlayError("boom", "INVALID_OPTIONS", cause);
    expect(err.cause).toBe(cause);
  });

  it("omits `cause` when not supplied (falsy guard)", () => {
    const err = new OverlayError("boom", "OVERLAY_NOT_CONFIGURED");
    expect(err.cause).toBeUndefined();
  });

  it("wires the prototype through `new.target.prototype` (Error wrap quirk)", () => {
    // The constructor calls `Object.setPrototypeOf(this, new.target.prototype)`
    // — without this, `err instanceof OverlayError` would fail when the
    // instance is constructed via a prototype-bound sub-class.
    const err = new OverlayError("boom", "ALREADY_REGISTERED");
    expect(Object.getPrototypeOf(err)).toBe(OverlayError.prototype);
  });
});

describe("every OverlayErrorCode carries a non-empty default message", () => {
  // The four codes correspond to the four throw sites in the
  // controller (plus the v2 reserved branch). Each one MUST accept a
  // non-empty message string — verify the constructor does not
  // reject them.
  it.each(ALL_CODES)("accepts a non-empty message for code '%s'", (code) => {
    const err = new OverlayError(`default message for ${code}`, code);
    expect(err.message.length).toBeGreaterThan(0);
    expect(err.code).toBe(code);
  });
});
