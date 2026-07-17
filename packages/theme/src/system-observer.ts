import { createMediaQueryListener } from "@ailuracode/alpine-ui";
import type { ResolvedTheme } from "./types";

const PREFERS_COLOR_SCHEME_DARK_QUERY = "(prefers-color-scheme: dark)";

export function readSystemTheme(): ResolvedTheme {
  if (typeof globalThis.window === "undefined") {
    return "light";
  }
  const media = globalThis.window.matchMedia(PREFERS_COLOR_SCHEME_DARK_QUERY);
  return media.matches ? "dark" : "light";
}

export function createSystemObserver(listener: (next: ResolvedTheme) => void): () => void {
  return createMediaQueryListener(PREFERS_COLOR_SCHEME_DARK_QUERY, (event) => {
    listener(event.matches ? "dark" : "light");
  });
}
