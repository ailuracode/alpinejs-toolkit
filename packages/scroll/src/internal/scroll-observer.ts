/**
 * rAF-batched global scroll listener.
 *
 * Wraps `window.addEventListener('scroll', ...)` with a
 * `requestAnimationFrame` debounce so high-frequency scroll events
 * coalesce into a single emit per frame. This matches the pattern
 * other toolkit packages use (`@ailuracode/alpine-media`,
 * `@ailuracode/alpine-sidebar`).
 *
 * SSR-safe: when `window` is unavailable the factory returns a no-op
 * cleanup so the controller can wire teardown uniformly through
 * `BaseController.registerCleanup`.
 *
 * Listener invocations go through `safeNotify()` so a misbehaving
 * subscriber cannot crash the rAF loop.
 */

import { isBrowser, safeWindow } from "@ailuracode/alpine-core/browser";
import type { Unsubscribe } from "@ailuracode/alpine-core/types";
import { safeNotify } from "./util";

export interface ScrollObserverOptions {
  /** Emit a `scroll` event on every rAF tick after the position changes. */
  readonly onPosition?: (detail: { x: number; y: number }) => void;
  /**
   * Emit a `reach` event when the viewport edge (`top` / `bottom`)
   * transitions. `previousY` / `previousAtTop` / `previousAtBottom`
   * are provided so consumers can detect the edge flip.
   */
  readonly onReach?: (detail: { edge: "top" | "bottom"; y: number }) => void;
}

/**
 * Subscribes to scroll events. Returns a cleanup function that
 * detaches the listener and cancels any pending rAF.
 */
export function attachScrollObserver(options: ScrollObserverOptions = {}): Unsubscribe {
  if (!isBrowser()) {
    return () => undefined;
  }
  const win = safeWindow();
  if (!win) {
    return () => undefined;
  }

  let active = true;
  let ticking = false;
  let _lastX = win.scrollX;
  let lastY = win.scrollY;
  let lastAtTop = lastY <= 0;
  let lastAtBottom = false;

  const computeAtBottom = (): boolean => {
    const doc = win.document;
    const maxY = Math.max(doc.documentElement.scrollHeight - win.innerHeight, 0);
    return lastY >= maxY - 1;
  };

  const flush = (): void => {
    ticking = false;
    if (!active) {
      return;
    }
    const x = win.scrollX;
    const y = win.scrollY;
    const atTop = y <= 0;
    const atBottom =
      y >= Math.max(win.document.documentElement.scrollHeight - win.innerHeight, 0) - 1;
    // Always emit on a scroll event — the `ticking` rAF guard
    // already debounces, and consumers may want to observe every
    // scroll event regardless of position change.
    if (options.onPosition) {
      safeNotify(options.onPosition, { x, y });
    }
    if (options.onReach) {
      if (atTop && !lastAtTop) {
        safeNotify(options.onReach, { edge: "top", y });
      }
      if (atBottom && !lastAtBottom) {
        safeNotify(options.onReach, { edge: "bottom", y });
      }
    }
    _lastX = x;
    lastY = y;
    lastAtTop = atTop;
    lastAtBottom = atBottom || computeAtBottom();
  };

  const onScroll = (): void => {
    if (!active || ticking) {
      return;
    }
    ticking = true;
    const raf =
      typeof win.requestAnimationFrame === "function"
        ? win.requestAnimationFrame.bind(win)
        : (cb: FrameRequestCallback): number => {
            // Fallback when rAF is unavailable (older DOM runtimes, Node).
            return setTimeout(() => cb(performance.now()), 16) as unknown as number;
          };
    raf(() => flush());
  };

  win.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    if (!active) {
      return;
    }
    active = false;
    win.removeEventListener("scroll", onScroll);
  };
}
