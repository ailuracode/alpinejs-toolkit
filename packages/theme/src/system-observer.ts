/**
 * System theme observer — wraps the `prefers-color-scheme` media query.
 *
 * Responsibilities:
 * 1. Read the current OS preference (SSR-safe).
 * 2. Subscribe to `change` events so the manager can react when the
 *    user flips the OS dark-mode toggle.
 * 3. Return a cleanup function the manager wires through its
 *    destroy() lifecycle.
 *
 * The browser-API access goes through `safeMatchMedia` from
 * `@ailuracode/alpine-core` so the SSR contract stays uniform with the
 * rest of the toolkit. SSR / Node callers (or runtimes where
 * `matchMedia` is missing) get a no-op cleanup.
 *
 * Lives at the package root (rather than under `internal/`) because
 * `readSystemTheme()` is part of the documented public surface —
 * SSR consumers call it to seed the manager before boot.
 */

import type { Unsubscribe } from "./core-deps.js";
import { safeMatchMedia } from "./core-deps.js";
import type { ResolvedTheme } from "./types";

/** Stable media query string — kept in one place so tests can target it. */
export const PREFERS_COLOR_SCHEME_DARK_QUERY = "(prefers-color-scheme: dark)";

/** Reads the current OS preference. Returns `'light'` on the server / when the API is missing. */
export function readSystemTheme(): ResolvedTheme {
  const media = safeMatchMedia(PREFERS_COLOR_SCHEME_DARK_QUERY);
  if (!media) {
    return "light";
  }
  return media.matches ? "dark" : "light";
}

/**
 * Subscribes to OS preference changes. Returns a cleanup function.
 * The callback is invoked with the new `ResolvedTheme` value.
 *
 * Returns a no-op cleanup when the runtime has no `matchMedia` so the
 * manager can wire teardown uniformly.
 */
export function createSystemObserver(listener: (next: ResolvedTheme) => void): Unsubscribe {
  const systemMedia = safeMatchMedia(PREFERS_COLOR_SCHEME_DARK_QUERY);

  if (!systemMedia) {
    return () => undefined;
  }

  let active = true;
  const onChange = (event: MediaQueryListEvent): void => {
    if (!active) {
      return;
    }
    listener(event.matches ? "dark" : "light");
  };

  systemMedia.addEventListener("change", onChange);

  return () => {
    if (!active) {
      return;
    }
    active = false;
    systemMedia.removeEventListener("change", onChange);
  };
}
