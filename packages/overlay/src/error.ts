/**
 * Public error surface for `@ailuracode/alpine-overlay`.
 *
 * Every user-recoverable failure throws an {@link OverlayError}.
 * The `code` field is the stable handle consumers branch on — do
 * not localize or rewrite code strings; the message is for humans.
 *
 * The class extends the toolkit's {@link ToolkitError} so consumers
 * can rely on the toolkit's `instanceof` and `error.code`
 * discrimination patterns. `ToolkitError`'s union is closed; the
 * overlay-specific codes are introduced by extending the class and
 * casting the `code` to `ToolkitErrorCode` at construction time
 * (centralized here so callers stay typed).
 *
 * Mirror pattern: `packages/scroll/src/error.ts`.
 */

import { ToolkitError, type ToolkitErrorCode } from "@ailuracode/alpine-core/controller";

/**
 * Stable, overlay-specific error codes.
 *
 * - `OVERLAY_NOT_CONFIGURED` — register/configure invoked after
 *   destroy, or before configure.
 * - `INVALID_PLUGIN_ID` — `plugin` or `id` is empty / non-string.
 * - `INVALID_OPTIONS` — `configure()` re-invoked with options that
 *   conflict with the live stack.
 * - `ALREADY_REGISTERED` — reserved for `bringToFront` in v2.
 */
export type OverlayErrorCode =
  | "OVERLAY_NOT_CONFIGURED"
  | "INVALID_PLUGIN_ID"
  | "INVALID_OPTIONS"
  | "ALREADY_REGISTERED";

/**
 * Runtime guard — `true` when `value` is one of the stable
 * `OverlayErrorCode` literals.
 */
export function isOverlayErrorCode(value: unknown): value is OverlayErrorCode {
  return (
    value === "OVERLAY_NOT_CONFIGURED" ||
    value === "INVALID_PLUGIN_ID" ||
    value === "INVALID_OPTIONS" ||
    value === "ALREADY_REGISTERED"
  );
}

/**
 * Public error type for `@ailuracode/alpine-overlay`. Extends
 * {@link ToolkitError} so consumers can rely on the toolkit's
 * `instanceof` and `error.code` discrimination patterns.
 *
 * Construction casts the `OverlayErrorCode` literal to
 * `ToolkitErrorCode` because `ToolkitError`'s union is closed. The
 * cast is centralised here — every other module imports the typed
 * `OverlayError` instead of repeating the assertion.
 */
export class OverlayError extends ToolkitError {
  constructor(message: string, code: OverlayErrorCode, cause?: unknown) {
    super(message, code as unknown as ToolkitErrorCode, cause);
    this.name = "OverlayError";
  }
}
