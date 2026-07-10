/** Returns `document` when available, otherwise `null`. */
export function safeDocument(): Document | null {
  return typeof document === "undefined" ? null : document;
}

/** Returns `matchMedia(query)` when available, otherwise `null`. */
export function safeMatchMedia(query: string): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }

  return window.matchMedia(query);
}
