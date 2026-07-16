/**
 * Pure helpers for resolving breakpoints and reading media snapshots.
 *
 * Kept side-effect free so the controller constructor and tests can
 * call them without touching `window` / `document` / `matchMedia`.
 *
 * Lives at the package root (rather than under `internal/`) because
 * `resolveMediaBreakpoint` is part of the documented public surface —
 * SSR consumers call it directly to build viewport snapshots without
 * booting the controller.
 */

import { ToolkitError } from "./core-deps.js";
import type { MediaInterval, MediaSnapshot } from "./types";
import { DEFAULT_MEDIA_INTERVALS, SSR_MEDIA_DEFAULTS } from "./types";

/**
 * Resolves which interval a width falls into (smallest-first priority).
 * Iterates intervals in order; the first whose `maxWidth >= width` wins.
 *
 * Falls back to the last interval's name when nothing matches — this
 * matches the historical behavior of the package: the last interval
 * always has `maxWidth: Infinity`, so every width lands somewhere.
 *
 * Exported so consumers can call it without booting the controller
 * (SSR snapshots, test fixtures, custom intervals in userland).
 */
export function resolveMediaBreakpoint<Name extends string>(
  width: number,
  intervals: readonly MediaInterval<Name>[]
): Name {
  for (const interval of intervals) {
    if (width <= interval.maxWidth) {
      return interval.name;
    }
  }
  // Last-interval fallback. Indexing on a non-empty array is safe
  // because `createMedia()` validates `intervals.length > 0` and
  // defaults to `DEFAULT_MEDIA_INTERVALS` when the consumer passes
  // `undefined`.
  const last = intervals[intervals.length - 1];
  if (last === undefined) {
    throw new ToolkitError(
      "resolveMediaBreakpoint: intervals array is empty",
      "TOOLKIT_INVALID_ARGUMENT"
    );
  }
  return last.name;
}

/**
 * Resolves the active breakpoint from a list of matchMedia queries
 * — one per interval except the trailing fallback. Mirrors the
 * historical `resolveBreakpointFromQueries` helper from
 * `@ailuracode/alpine-media@0.1.x` so the controller can lean on
 * the browser's own breakpoint signal rather than re-deriving it
 * from `window.innerWidth` (which can disagree with `matchMedia`
 * during browser zoom or DPR rounding).
 */
export function resolveBreakpointFromQueries<Name extends string>(
  queries: readonly { readonly interval: MediaInterval<Name>; readonly media: MediaQueryList }[],
  fallback: Name
): Name {
  for (const q of queries) {
    if (q.media.matches) {
      return q.interval.name;
    }
  }
  return fallback;
}

/**
 * Reads a width / height / breakpoint snapshot from the runtime.
 *
 * Returns SSR-safe defaults when `window` is undefined (Node,
 * web worker, etc.). The function does NOT read media features —
 * those go through the controller's `matchMedia` reads and the
 * `feature-queries` module.
 */
export function readMediaSnapshot<Name extends string>(
  intervals: readonly MediaInterval<Name>[]
): MediaSnapshot<Name> {
  const win = typeof window !== "undefined" ? window : null;
  const width = win ? win.innerWidth : SSR_MEDIA_DEFAULTS.width;
  const height = win ? win.innerHeight : SSR_MEDIA_DEFAULTS.height;

  return {
    width,
    height,
    breakpoint: resolveMediaBreakpoint<Name>(width, intervals),
  };
}

/**
 * Coerces the consumer-supplied `intervals` option into a usable
 * array. Centralizes the `?? DEFAULT_MEDIA_INTERVALS` default so
 * the controller and the plugin's literal-type narrowing stay in
 * sync. The cast is required because the default is concrete
 * (`"mobile" | "desktop"`) while the consumer may pass a richer
 * literal union; the controller re-narrows via the explicit `Name`
 * parameter.
 */
export function resolveIntervals<Name extends string>(
  intervals: readonly MediaInterval<Name>[] | undefined
): readonly MediaInterval<Name>[] {
  if (intervals === undefined) {
    return DEFAULT_MEDIA_INTERVALS as unknown as readonly MediaInterval<Name>[];
  }
  if (intervals.length === 0) {
    throw new ToolkitError(
      "createMedia: `intervals` must contain at least one entry",
      "TOOLKIT_INVALID_ARGUMENT"
    );
  }
  return intervals;
}
