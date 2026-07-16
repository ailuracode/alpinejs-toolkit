export const isBrowser = (): boolean =>
  typeof globalThis.window !== "undefined" && typeof globalThis.document !== "undefined";

export const safeWindow = (): Window | null =>
  typeof globalThis.window !== "undefined" ? globalThis.window : null;

export const safeDocument = (): Document | null =>
  typeof globalThis.document !== "undefined" ? globalThis.document : null;

export const safeMatchMedia = (query: string): MediaQueryList | null => {
  if (typeof globalThis.window === "undefined") {
    return null;
  }
  const win = globalThis.window;
  return typeof win.matchMedia === "function" ? win.matchMedia(query) : null;
};
