/**
 * Browser environment detection — used by feature packages to gate DOM access
 * behind SSR-safe checks. Prefer these helpers over `typeof window` so the
 * SSR contract is uniform across every package in this monorepo.
 */

import { typeIs, valueIf } from "./core/utils";

/** Returns `true` when the current runtime exposes `window` and `document`. */
export const isBrowser = () => {
  return !(typeIs(window, "undefined") || typeIs(document, "undefined"));
};

/** Returns `window` if available, otherwise `null`. */
export const safeWindow = () => {
  return valueIf(!typeIs(window, "undefined"), window);
};

/** Returns `document` if available, otherwise `null`. */
export const safeDocument = () => {
  return valueIf(!typeIs(document, "undefined"), document);
};

/** Returns `window.matchMedia(query)` or `null` when `window` (or the `matchMedia` API) is unavailable. */
export function safeMatchMedia(query: string): MediaQueryList | null {
  const win = safeWindow();

  if (!win) {
    return null;
  }

  // Some runtimes (older jsdom, embedded webviews, server-side polyfills)
  // expose `window` without `matchMedia`. Treat that as "browser, but the
  // API isn't there" and return `null` so consumers can degrade gracefully.
  if (!win.matchMedia) {
    return null;
  }

  return win.matchMedia(query);
}
