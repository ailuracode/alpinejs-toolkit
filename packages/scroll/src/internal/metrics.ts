/**
 * Pure scroll-metrics helpers — direction, snapshot, progress.
 *
 * SSR-safe via `safeWindow()` / `safeDocument()`. The functions read
 * the live viewport values; consumers that need a snapshot use
 * {@link readScrollSnapshot}. Direction / metrics computation lives
 * in pure functions (`computeScrollDirection`, `computeScrollMetrics`)
 * so the contract is fully testable without a DOM.
 */

import { isBrowser, safeDocument, safeWindow } from "../core-deps.js";
import type { ScrollDirection } from "../types";

/** Vertical scroll direction constants. Re-exported as a frozen tuple. */
export const SCROLL_DIRECTIONS: readonly ScrollDirection[] = ["up", "down", "none"] as const;

/** Native `ScrollBehavior` literals. */
export const SCROLL_BEHAVIORS: readonly ["auto", "instant", "smooth"] = [
  "auto",
  "instant",
  "smooth",
] as const;

/** Lock axes. */
export const SCROLL_LOCK_AXES: readonly ["y", "both"] = ["y", "both"] as const;

/**
 * Resolves the direction from previous and current vertical offsets.
 * `currentY === previousY` returns `'none'` so consumers can branch
 * on `direction === 'none'` without separate equality checks.
 */
export function computeScrollDirection(previousY: number, currentY: number): ScrollDirection {
  if (currentY > previousY) {
    return "down";
  }
  if (currentY < previousY) {
    return "up";
  }
  return "none";
}

/** Inputs to {@link computeScrollMetrics}. */
export interface ScrollMetricsInput {
  readonly x: number;
  readonly y: number;
  readonly previousY: number;
  readonly scrollHeight: number;
  readonly innerHeight: number;
}

/** Output of {@link computeScrollMetrics}. */
export interface ScrollMetrics {
  readonly x: number;
  readonly y: number;
  readonly direction: ScrollDirection;
  readonly atTop: boolean;
  readonly atBottom: boolean;
  readonly progress: number;
}

/**
 * Pure scroll-metrics computation. `maxY = max(scrollHeight -
 * innerHeight, 0)` so the `atBottom` check works correctly when the
 * page is shorter than the viewport.
 *
 * `progress` is clamped to `[0, 100]` so contract-holders never see
 * values outside the documented range. Overshoot happens when:
 *
 * - macOS/iOS rubber-band scroll pushes `scrollY` past
 *   `scrollHeight - innerHeight` momentarily.
 * - Late layout shifts shrink `scrollHeight` after the snapshot was
 *   taken, leaving `scrollY` beyond the new max.
 * - Subpixel rounding on `scrollHeight` / `innerHeight` (floats)
 *   drifts `maxY` below the integer `scrollY`.
 *
 * `atBottom` already absorbs the same drift with a 1px tolerance;
 * progress gets the same treatment in `Math.min(100, …)`.
 */
export function computeScrollMetrics(input: ScrollMetricsInput): ScrollMetrics {
  const maxY = Math.max(input.scrollHeight - input.innerHeight, 0);
  const rawProgress = maxY > 0 ? (input.y / maxY) * 100 : 0;
  return {
    x: input.x,
    y: input.y,
    direction: computeScrollDirection(input.previousY, input.y),
    atTop: input.y <= 0,
    atBottom: input.y >= maxY - 1,
    progress: Math.min(100, Math.max(0, Math.round(rawProgress))),
  };
}

/**
 * Reads the current scroll snapshot from the viewport. SSR-safe:
 * returns a zeroed snapshot when `window` is unavailable.
 */
export function readScrollSnapshot(previousY = 0): ScrollMetrics {
  if (!isBrowser()) {
    return computeScrollMetrics({
      x: 0,
      y: 0,
      previousY,
      scrollHeight: 0,
      innerHeight: 0,
    });
  }
  const win = safeWindow();
  const doc = safeDocument();
  if (!(win && doc)) {
    return computeScrollMetrics({
      x: 0,
      y: 0,
      previousY,
      scrollHeight: 0,
      innerHeight: 0,
    });
  }
  return computeScrollMetrics({
    x: win.scrollX,
    y: win.scrollY,
    previousY,
    scrollHeight: doc.documentElement.scrollHeight,
    innerHeight: win.innerHeight,
  });
}

/** Scroll options passthrough — used by navigation helpers. */
export function scrollOptionsPassthrough<T extends object>(options: T | undefined): T | undefined {
  return options;
}
