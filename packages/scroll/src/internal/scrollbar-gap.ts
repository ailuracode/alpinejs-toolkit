/**
 * Scrollbar-gap compensation — preserves layout when a scroll lock
 * would otherwise shift content by the scrollbar width.
 *
 * Implements the classic "compensate for the disappearing scrollbar"
 * pattern: read the current scrollbar width, set it on
 * `--ailura-scrollbar-gap` on `<html>`, and clear the CSS variable
 * when the lock is released. Pure DOM reads + writes; never touches
 * controllers or stores directly.
 *
 * v1.0.0 public surface:
 *
 * - {@link clearScrollbarGap} (canonical name) — clears the CSS
 *   variable + any inline `padding-right` we set.
 * - {@link resetScrollbarGapCache} — deprecated alias for
 *   {@link clearScrollbarGap}; kept so v0.x consumers don't break.
 */

import { isBrowser, safeDocument } from "../core-deps.js";

/** CSS variable name registered by `@ailuracode/alpine-scroll`. */
export const SCROLLBAR_GAP_VAR = "--ailura-scrollbar-gap";

/** Width reserved via inline `padding-right` to balance the lock. */
const COMPENSATION_PADDING = "padding-right";

/**
 * Cached scrollbar width. Computed once per `applyScrollbarGap()`
 * call; reused on subsequent calls so we don't re-read
 * `window.innerWidth` on every lock acquisition.
 */
let cachedScrollbarWidth: number | null = null;

/**
 * Measures the current scrollbar width. Returns `0` under SSR or
 * when the document has no measurable scrollbar (e.g. a fixed-width
 * container).
 */
export function measureScrollbarWidth(): number {
  if (!isBrowser()) {
    return 0;
  }
  const doc = safeDocument();
  if (!doc) {
    return 0;
  }
  const win = doc.defaultView;
  if (!win) {
    return 0;
  }
  const outer = doc.createElement("div");
  outer.style.visibility = "hidden";
  outer.style.position = "absolute";
  outer.style.top = "-9999px";
  outer.style.width = "100px";
  outer.style.height = "100px";
  outer.style.overflow = "scroll";
  doc.body.appendChild(outer);
  const inner = outer.offsetWidth - outer.clientWidth;
  doc.body.removeChild(outer);
  cachedScrollbarWidth = inner > 0 ? inner : 0;
  return cachedScrollbarWidth;
}

/**
 * Applies the scrollbar-gap compensation to `<html>`. Idempotent —
 * repeated calls reset the variable to the same value. Returns the
 * measured width so callers can build the `padding-right` style.
 */
export function applyScrollbarGap(): number {
  if (!isBrowser()) {
    return 0;
  }
  const doc = safeDocument();
  if (!doc) {
    return 0;
  }
  const width = measureScrollbarWidth();
  doc.documentElement.style.setProperty(SCROLLBAR_GAP_VAR, `${width}px`);
  return width;
}

/**
 * Clears the `--ailura-scrollbar-gap` CSS variable and any inline
 * `padding-right` set by {@link applyScrollbarGap}. Idempotent.
 */
export function clearScrollbarGap(): void {
  if (!isBrowser()) {
    return;
  }
  const doc = safeDocument();
  if (!doc) {
    return;
  }
  doc.documentElement.style.removeProperty(SCROLLBAR_GAP_VAR);
  // Drop any padding-right that may have been applied — both our
  // own compensation and any v0.x leftover.
  doc.body.style.removeProperty(COMPENSATION_PADDING);
}

/**
 * @deprecated Use {@link clearScrollbarGap}. Kept as an alias for
 * v0.x consumers that called the function under its old name.
 */
export function resetScrollbarGapCache(): void {
  clearScrollbarGap();
}

/** Resets the cached scrollbar width. Tests only. */
export function __resetScrollbarGapCacheForTests(): void {
  cachedScrollbarWidth = null;
}
