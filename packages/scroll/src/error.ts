/**
 * Public error type for `@ailuracode/alpine-scroll` v1.0.0.
 *
 * Extends the toolkit's `ToolkitError` so consumers can branch on
 * `error.code` (string literal) without `instanceof` checks across
 * the dependency graph. `ToolkitError`'s `code` field is a closed
 * union of generic toolkit codes; this module introduces the
 * scroll-specific codes by extending the class and casting the
 * `code` to the toolkit's union at construction time.
 *
 * v1.0.0 stable codes:
 *
 * - `'SCROLL_NOT_BROWSER'` — construction / first call ran under
 *   SSR (no `window` / `document`).
 * - `'SCROLL_NOT_MOUNTED'` — public command invoked before
 *   `mount()` or after `destroy()`.
 * - `'SCROLL_CONTROLLER_DESTROYED'` — public command invoked on a
 *   destroyed controller.
 * - `'SCROLL_LOCK_INVALID_REASON'` — `lockWithHandle` was called
 *   with a non-string reason.
 * - `'SCROLL_LOCK_HANDLE_NOT_FOUND'` — `unlock(handle)` was called
 *   with a handle that doesn't exist.
 *
 * Cross-cutting toolkit codes (`'CONTROLLER_DESTROYED'` from the
 * base controller) are reused — see {@link ScrollError.code} note.
 */

import { ToolkitError, type ToolkitErrorCode } from "./core-deps.js";

/**
 * Stable, scroll-specific error codes. Runtime guard at the bottom
 * of this file (`isScrollErrorCode`) keeps the union honest.
 */
export type ScrollErrorCode =
  | "SCROLL_NOT_BROWSER"
  | "SCROLL_NOT_MOUNTED"
  | "SCROLL_CONTROLLER_DESTROYED"
  | "SCROLL_LOCK_INVALID_REASON"
  | "SCROLL_LOCK_HANDLE_NOT_FOUND";

/**
 * Runtime guard — `true` when `value` is one of the stable
 * `ScrollErrorCode` literals.
 *
 * Use this in factories / adapters that need to validate a `code`
 * before throwing. The closed union is enforced at the call site.
 */
export function isScrollErrorCode(value: unknown): value is ScrollErrorCode {
  return (
    value === "SCROLL_NOT_BROWSER" ||
    value === "SCROLL_NOT_MOUNTED" ||
    value === "SCROLL_CONTROLLER_DESTROYED" ||
    value === "SCROLL_LOCK_INVALID_REASON" ||
    value === "SCROLL_LOCK_HANDLE_NOT_FOUND"
  );
}

/**
 * Public error type for `@ailuracode/alpine-scroll`. Extends
 * {@link ToolkitError} so consumers can rely on the toolkit's
 * `instanceof` and `error.code` discrimination patterns.
 *
 * Construction casts the `ScrollErrorCode` literal to
 * `ToolkitErrorCode` because `ToolkitError`'s union is closed. The
 * cast is centralised here — every other module imports the typed
 * `ScrollError` instead of repeating the assertion.
 */
export class ScrollError extends ToolkitError {
  constructor(message: string, code: ScrollErrorCode, cause?: unknown) {
    super(message, code as unknown as ToolkitErrorCode, cause);
    this.name = "ScrollError";
  }
}
