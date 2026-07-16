/**
 * Breakpoint observer — wraps the `matchMedia` API for SSR-safe
 * observation of a CSS media query.
 *
 * The browser-API access goes through `safeMatchMedia` from
 * `@ailuracode/alpine-core` so the SSR contract stays uniform with
 * the rest of the toolkit. SSR / Node callers (or runtimes where
 * `matchMedia` is missing) get a no-op cleanup so the manager can
 * wire teardown uniformly through `BaseController.registerCleanup`.
 *
 * The listener is invoked with the raw `MediaQueryListEvent` so
 * callers can read `event.matches` plus any future fields without
 * needing a separate callback signature.
 */

import type { Unsubscribe } from "@ailuracode/alpine-core";
import { createMediaQueryListener } from "@ailuracode/alpine-ui";

/**
 * Subscribes to changes of a CSS media query. Returns a cleanup
 * function that detaches the listener.
 *
 * Returns a no-op cleanup when the runtime has no `matchMedia` so
 * the manager can wire teardown uniformly.
 */
export function observeBreakpoint(
  query: string,
  listener: (event: MediaQueryListEvent) => void
): Unsubscribe {
  return createMediaQueryListener(query, listener);
}
