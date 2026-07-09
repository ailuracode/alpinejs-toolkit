/**
 * Public error surface for `@ailuracode/alpine-overlay`.
 *
 * Every user-recoverable failure throws an {@link OverlayError}.
 * The `code` field is the stable handle consumers branch on — do
 * not localize or rewrite code strings; the message is for humans.
 */

/** Stable error codes. Consumers branch on `err.code`. */
export type OverlayErrorCode =
  /** `register()` / `configure()` invoked before `configure()`. */
  | "OVERLAY_NOT_CONFIGURED"
  /** `plugin` or `id` is empty / non-string. */
  | "INVALID_PLUGIN_ID"
  /** `configure()` re-invoked with options that conflict with the live stack. */
  | "INVALID_OPTIONS"
  /** Reserved for the `bringToFront` API in v2 — never thrown by v1. */
  | "ALREADY_REGISTERED";

/**
 * Thrown by {@link OverlayController} for user-recoverable failures.
 * Extends the built-in `Error` (the toolkit's `ToolkitError` is not
 * yet part of the published core surface — mirror style once
 * `alpine-core` exports it).
 */
export class OverlayError extends Error {
  readonly code: OverlayErrorCode;
  readonly cause?: unknown;
  constructor(message: string, code: OverlayErrorCode, cause?: unknown) {
    super(message);
    this.name = "OverlayError";
    this.code = code;
    if (cause !== undefined) {
      this.cause = cause;
    }
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Type guard for `unknown → OverlayErrorCode`. */
export function isOverlayErrorCode(code: unknown): code is OverlayErrorCode {
  return (
    code === "OVERLAY_NOT_CONFIGURED" ||
    code === "INVALID_PLUGIN_ID" ||
    code === "INVALID_OPTIONS" ||
    code === "ALREADY_REGISTERED"
  );
}