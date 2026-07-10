/**
 * SSR-safe `matchMedia` subscription helper.
 *
 * Centralises the read-subscribe-cleanup dance every feature
 * package in `@ailuracode/alpinejs-toolkit` would otherwise
 * re-implement:
 *
 * - Browser-API access goes through a local SSR guard so consumers
 *   do not need any Alpine runtime package installed.
 * - SSR / Node callers (or runtimes where `matchMedia` is missing)
 *   get a no-op `Unsubscribe` so the caller can wire teardown
 *   uniformly through `BaseController.registerCleanup`.
 * - The cleanup is idempotent — calling it more than once is
 *   safe. The internal `active` flag short-circuits a second
 *   `removeEventListener` so a re-entrant destroy path cannot
 *   throw.
 *
 * The listener is invoked with the raw `MediaQueryListEvent` so
 * callers can read `event.matches` plus any future fields without
 * needing a separate callback signature.
 */

import { safeMatchMedia } from "../internal/browser";
import type { Unsubscribe } from "../types";

/**
 * Subscribes to changes of a CSS media query. Returns an
 * idempotent `Unsubscribe` that detaches the listener.
 *
 * Returns a no-op unsubscribe when the runtime has no
 * `matchMedia` so the caller can wire teardown uniformly.
 *
 * @param query - CSS media-query string (e.g.
 *   `'(min-width: 1024px)'`).
 * @param listener - Invoked with the raw `MediaQueryListEvent`
 *   on every match flip.
 */
export function createMediaQueryListener(
  query: string,
  listener: (event: MediaQueryListEvent) => void
): Unsubscribe {
  const media = safeMatchMedia(query);

  if (!media) {
    return () => undefined;
  }

  let active = true;
  const onChange = (event: MediaQueryListEvent): void => {
    if (!active) {
      return;
    }
    listener(event);
  };

  media.addEventListener("change", onChange);

  return () => {
    if (!active) {
      return;
    }
    active = false;
    media.removeEventListener("change", onChange);
  };
}
