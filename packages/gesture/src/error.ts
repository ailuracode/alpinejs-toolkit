/**
 * Public error type for `@ailuracode/alpine-gesture`.
 */

import { ToolkitError, type ToolkitErrorCode } from "./core-deps.js";

export type GestureErrorCode =
  | "GESTURE_NOT_BROWSER"
  | "GESTURE_NOT_MOUNTED"
  | "GESTURE_CONTROLLER_DESTROYED"
  | "GESTURE_NO_ELEMENT";

/**
 * Type guard for {@link GestureErrorCode}. Not part of the public
 * surface — kept here so unit tests can validate error narrowing.
 */
export function isGestureErrorCode(value: unknown): value is GestureErrorCode {
  return (
    typeof value === "string" &&
    (value === "GESTURE_NOT_BROWSER" ||
      value === "GESTURE_NOT_MOUNTED" ||
      value === "GESTURE_CONTROLLER_DESTROYED" ||
      value === "GESTURE_NO_ELEMENT")
  );
}

export class GestureError extends ToolkitError {
  constructor(message: string, code: GestureErrorCode, cause?: unknown) {
    super(message, code as unknown as ToolkitErrorCode, cause);
    this.name = "GestureError";
  }
}
