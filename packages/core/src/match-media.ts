/** Returns `window.matchMedia(query)` or `null` when `window` is unavailable. */
export function safeMatchMedia(query: string): MediaQueryList | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.matchMedia(query);
}

/**
 * Subscribes to a media query with `addEventListener('change')` and legacy `addListener` fallback.
 * Returns an unsubscribe function (no-op when `window` is unavailable).
 */
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

/**
 * Subscribes to multiple media queries with a shared callback.
 * Returns a function that removes every listener.
 */
export function watchMatchMedia(queries: readonly string[], callback: () => void): () => void {
  const unsubs = queries.map((query) => createMatchMediaWatcher(query, callback));

  return () => {
    for (const unsubscribe of unsubs) {
      unsubscribe();
    }
  };
}
