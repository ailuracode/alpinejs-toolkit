/**
 * Options normalization for `@ailuracode/alpine-overlay`.
 *
 * `normalizeOverlayOptions()` is the single source of truth for
 * defaults. Every code path that accepts user input runs through
 * it, so callers can rely on `baseZIndex` and `step` always being
 * numbers.
 */

import type { NormalizedOverlayOptions, OverlayOptions } from "./types.js";

/** Default initial z-index slot. */
export const DEFAULT_BASE_Z_INDEX = 1000;
/** Default gap between consecutive slots. */
export const DEFAULT_STEP = 10;

/** Snapshot of defaults — frozen so consumers cannot mutate it. */
export const DEFAULT_OVERLAY_OPTIONS = Object.freeze({
  baseZIndex: DEFAULT_BASE_Z_INDEX,
  step: DEFAULT_STEP,
});

/**
 * Resolves {@link OverlayOptions} into a fully-populated
 * {@link NormalizedOverlayOptions}. Throws when `baseZIndex` or
 * `step` is negative, non-finite, or — for `step` — zero.
 */
export function normalizeOverlayOptions(options: OverlayOptions = {}): NormalizedOverlayOptions {
  const baseZIndex = options.baseZIndex ?? DEFAULT_BASE_Z_INDEX;
  const step = options.step ?? DEFAULT_STEP;

  if (!Number.isFinite(baseZIndex) || baseZIndex < 0) {
    throw new OverlayOptionError(
      `Overlay baseZIndex must be a non-negative finite number. Got ${String(baseZIndex)}.`,
      "INVALID_OPTIONS"
    );
  }

  if (!Number.isFinite(step) || step <= 0) {
    throw new OverlayOptionError(
      `Overlay step must be a positive finite number. Got ${String(step)}.`,
      "INVALID_OPTIONS"
    );
  }

  return {
    root: options.root ?? null,
    baseZIndex,
    step,
  };
}

/**
 * Local-only validation error. The public {@link OverlayError} in
 * `./error.ts` extends this — keeping the option error local lets
 * the rest of the package throw with one stable type while still
 * exposing a dedicated code for option validation.
 */
class OverlayOptionError extends Error {
  readonly code: "INVALID_OPTIONS";
  constructor(message: string, code: "INVALID_OPTIONS") {
    super(message);
    this.name = "OverlayOptionError";
    this.code = code;
  }
}
