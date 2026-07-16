/**
 * Media-query subscription helper used by `@ailuracode/alpine-media`.
 *
 * Lives under `internal/` because no other package in this monorepo
 * needs a cross-package `matchMedia` watcher — `theme` uses
 * `safeMatchMedia` for one-shot reads, and the rest of the toolkit
 * does not subscribe to media queries. Keeping this here keeps
 * `@ailuracode/alpine-core`'s public surface limited to genuinely
 * reusable primitives (`safeDocument`, `safeWindow`,
 * `safeMatchMedia`, ...).
 *
 * Subscribes with `addEventListener('change')` and falls back to the
 * legacy `addListener` API. Returns an unsubscribe function (no-op
 * when the runtime does not expose `window.matchMedia`).
 */

import { safeMatchMedia } from "@ailuracode/alpine-core/browser";

export function createMatchMediaWatcher(
  queryOrList: string | MediaQueryList,
  callback: () => void
): () => void {
  const media = typeof queryOrList === "string" ? safeMatchMedia(queryOrList) : queryOrList;

  if (!media) {
    return () => undefined;
  }

  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", callback);
    return () => media.removeEventListener("change", callback);
  }

  media.addListener(callback);
  return () => media.removeListener(callback);
}
