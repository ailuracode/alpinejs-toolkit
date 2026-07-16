/**
 * Navigation helpers — to / by / toTop / toBottom / scrollIntoView.
 *
 * Centralised so the controller's public surface stays thin and
 * every command shares the same reduced-motion gate, focus
 * behaviour, and reason propagation.
 *
 * SSR-safe: every entry point checks `isBrowser()` and returns
 * early when `window` is unavailable. The controller's `mount()`
 * is the SSR boundary — these helpers do not gate on lifecycle
 * themselves.
 */

import { isBrowser, safeWindow } from "@ailuracode/alpine-core/browser";
import type {
  ScrollBehavior,
  ScrollIntoViewAbsoluteOptions,
  ScrollIntoViewOptions,
} from "../types";
import { prefersReducedMotion } from "./util";

/**
 * Resolves the active `ScrollBehavior` honoring the
 * `prefers-reduced-motion` media query when the controller opts in.
 *
 * - `respectReducedMotion: true` (default) — replace `smooth` with
 *   `'instant'` when the user has reduced-motion enabled.
 * - `respectReducedMotion: false` — pass the behavior through.
 */
export function resolveScrollBehavior(
  behavior: ScrollBehavior | undefined,
  defaultBehavior: ScrollBehavior,
  respectReducedMotion: boolean
): ScrollBehavior {
  const requested = behavior ?? defaultBehavior;
  if (!respectReducedMotion) {
    return requested;
  }
  if (requested === "smooth" && prefersReducedMotion()) {
    return "instant";
  }
  return requested;
}

/** `true` when the supplied `reason` looks like a keyboard event name. */
export function isKeyboardReason(reason: string | undefined): boolean {
  if (!reason) {
    return false;
  }
  const lowered = reason.toLowerCase();
  return lowered === "keyboard" || lowered === "key" || lowered.startsWith("key:");
}

/**
 * Scrolls to the absolute target. When `behavior` is `'smooth'` AND
 * reduced-motion is honored, the call is downgraded to `'instant'`.
 */
export function scrollToCoordinates(
  options: ScrollIntoViewAbsoluteOptions,
  respectReducedMotion: boolean
): void {
  if (!isBrowser()) {
    return;
  }
  const win = safeWindow();
  if (!win) {
    return;
  }
  const behavior = resolveScrollBehavior(options.behavior, "smooth", respectReducedMotion);
  win.scrollTo({
    top: options.y,
    left: options.x,
    behavior,
  });
}

/** Scrolls the page by `delta`. */
export function scrollByDelta(
  delta: { x?: number; y?: number },
  behavior: ScrollBehavior | undefined,
  respectReducedMotion: boolean
): void {
  if (!isBrowser()) {
    return;
  }
  const win = safeWindow();
  if (!win) {
    return;
  }
  const resolved = resolveScrollBehavior(behavior, "smooth", respectReducedMotion);
  win.scrollBy({
    top: delta.y ?? 0,
    left: delta.x ?? 0,
    behavior: resolved,
  });
}

/**
 * Scrolls the page to the top. Behavior honours reduced-motion;
 * the controller's `defaultBehavior` provides the fallback.
 */
export function scrollToTop(
  behavior: ScrollBehavior | undefined,
  defaultBehavior: ScrollBehavior,
  respectReducedMotion: boolean
): void {
  if (!isBrowser()) {
    return;
  }
  const win = safeWindow();
  if (!win) {
    return;
  }
  const resolved = resolveScrollBehavior(behavior, defaultBehavior, respectReducedMotion);
  win.scrollTo({ top: 0, left: 0, behavior: resolved });
}

/**
 * Scrolls the page to the bottom. Reads `documentElement.scrollHeight`
 * to support long pages without requiring a `target` argument.
 */
export function scrollToBottom(
  behavior: ScrollBehavior | undefined,
  defaultBehavior: ScrollBehavior,
  respectReducedMotion: boolean
): void {
  if (!isBrowser()) {
    return;
  }
  const win = safeWindow();
  if (!win) {
    return;
  }
  const resolved = resolveScrollBehavior(behavior, defaultBehavior, respectReducedMotion);
  const doc = win.document;
  win.scrollTo({
    top: doc.documentElement.scrollHeight,
    left: 0,
    behavior: resolved,
  });
}

/**
 * Scrolls the page so `element` is in view. Honors the `focus`
 * option: when `true`, moves keyboard focus to the element after
 * the scroll completes (mimics native `scrollIntoView({ block: … })`
 * + manual focus, but isolated to the toolkit).
 */
export function scrollIntoViewElement(
  element: Element,
  options: ScrollIntoViewOptions | undefined,
  respectReducedMotion: boolean
): void {
  if (!isBrowser()) {
    return;
  }
  const win = safeWindow();
  if (!win) {
    return;
  }
  const behavior = resolveScrollBehavior(options?.behavior, "smooth", respectReducedMotion);
  if (
    typeof (element as Element & { scrollIntoView?: (opts?: object) => void }).scrollIntoView ===
    "function"
  ) {
    (element as Element & { scrollIntoView: (opts?: object) => void }).scrollIntoView({
      behavior,
      block: "start",
      inline: "nearest",
    });
  } else {
    // Defensive fallback for DOM runtimes or environments that lack
    // Element.scrollIntoView — just scroll to the element's
    // bounding-rect top.
    const rect = element.getBoundingClientRect();
    win.scrollTo({
      top: win.scrollY + rect.top,
      left: win.scrollX + rect.left,
      behavior,
    });
  }
  if (options?.focus && typeof (element as Element & { focus?: () => void }).focus === "function") {
    try {
      (element as Element & { focus: () => void }).focus();
    } catch {
      // Some elements (without tabindex) throw on focus(). Absorb.
    }
  }
}
