/**
 * Generic helpers shared across the scroll package's internal modules.
 *
 * Pure functions only — these never read `window`, `document`, or any
 * other browser global. Modules that need browser access go through
 * the SSR-safe helpers in `@ailuracode/alpine-core` (`isBrowser`,
 * `safeWindow`, `safeDocument`, `safeMatchMedia`).
 */

import { isBrowser, safeMatchMedia, safeWindow } from "@ailuracode/alpine-core";

/**
 * Invokes a listener inside a try/catch so a misbehaving consumer
 * cannot crash the rAF loop, IntersectionObserver callback, or lock
 * subscriber. Errors are absorbed silently — the toolkit's contract
 * is that listener failures never tear down the controller.
 */
export function safeNotify<T>(listener: (detail: T) => void, detail: T): void {
  try {
    listener(detail);
  } catch {
    // Best-effort notification: listener throws are absorbed.
  }
}

/**
 * Returns `true` when the runtime exposes both `window` and `document`
 * AND the `matchMedia` API. Mirrors the SSR contract documented in
 * `@ailuracode/alpine-core`'s `isBrowser()` but adds the matchMedia
 * probe for plugins that gate on `prefers-reduced-motion`.
 */
export function isBrowserWithMedia(): boolean {
  if (!isBrowser()) {
    return false;
  }
  return safeMatchMedia("(prefers-reduced-motion: reduce)") !== null;
}

/**
 * Reads `prefers-reduced-motion`. Returns `false` under SSR or when
 * the API is unavailable so the controller can gate reduced-motion
 * fall-throughs uniformly.
 */
export function prefersReducedMotion(): boolean {
  if (!isBrowserWithMedia()) {
    return false;
  }
  const media = safeMatchMedia("(prefers-reduced-motion: reduce)");
  return media?.matches ?? false;
}

/**
 * Resolves a CSS selector to a single element via `document.querySelector`.
 * Returns `null` when the runtime has no `document` (SSR) or when the
 * selector matches nothing.
 */
export function querySelectorOrNull(selector: string): Element | null {
  if (!isBrowser()) {
    return null;
  }
  try {
    const win = safeWindow();
    return win?.document.querySelector(selector) ?? null;
  } catch {
    // Invalid selectors / disconnected documents throw — absorb.
    return null;
  }
}

/**
 * Generates a unique lock handle. Pure — no global state. Format
 * matches the toolkit's `generateId('controller')` pattern but with
 * a `lock-` prefix so log lines distinguish lock handles from
 * controller ids.
 */
let lockCounter = 0;
export function generateLockHandle(prefix = "lock"): string {
  lockCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${lockCounter.toString(36)}`;
}

/** Resets the lock-handle counter. Tests only. */
export function __resetLockHandleCounterForTests(): void {
  lockCounter = 0;
}
