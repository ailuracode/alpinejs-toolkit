import { describe, expect, it } from "vitest";
import { GestureError, isGestureErrorCode } from "../src/error";

describe("GestureError", () => {
  it("creates an error with code", () => {
    const error = new GestureError("test message", "GESTURE_NOT_BROWSER");
    expect(error.message).toBe("test message");
    expect(error.code).toBe("GESTURE_NOT_BROWSER");
    expect(error.name).toBe("GestureError");
  });

  it("creates an error with cause", () => {
    const cause = new Error("original");
    const error = new GestureError("test", "GESTURE_CONTROLLER_DESTROYED", cause);
    expect(error.cause).toBe(cause);
  });
});

describe("isGestureErrorCode", () => {
  it("returns true for valid codes", () => {
    expect(isGestureErrorCode("GESTURE_NOT_BROWSER")).toBe(true);
    expect(isGestureErrorCode("GESTURE_NOT_MOUNTED")).toBe(true);
    expect(isGestureErrorCode("GESTURE_CONTROLLER_DESTROYED")).toBe(true);
    expect(isGestureErrorCode("GESTURE_NO_ELEMENT")).toBe(true);
  });

  it("returns false for invalid codes", () => {
    expect(isGestureErrorCode("UNKNOWN")).toBe(false);
    expect(isGestureErrorCode(42)).toBe(false);
    expect(isGestureErrorCode(null)).toBe(false);
  });
});
