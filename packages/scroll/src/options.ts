/**
 * Option normalization helpers for `@ailuracode/alpine-scroll` v1.0.0.
 *
 * Centralised so every entry point (controller, plugin) feeds the
 * same configuration shape into the implementation. The normalized
 * shape is `readonly` — collaborators consume it without defensive
 * copies.
 */

import type { ScrollOptions } from "./types";

/**
 * Fully-populated controller configuration. Defaults applied at the
 * boundary; the controller never has to branch on `undefined`.
 */
export interface NormalizedScrollOptions {
  readonly id: string;
  readonly defaultBehavior: "auto" | "instant" | "smooth";
  readonly respectReducedMotion: boolean;
  readonly reserveScrollbarGap: boolean;
  readonly target: Element | string | null;
}

/**
 * Default values applied when an option is omitted. Kept in one place
 * so the test suite can pin the surface.
 */
export const DEFAULT_SCROLL_OPTIONS: NormalizedScrollOptions = {
  id: "",
  defaultBehavior: "smooth",
  respectReducedMotion: true,
  reserveScrollbarGap: true,
  target: null,
};

/**
 * Returns the normalized configuration with defaults applied. Pure
 * function — no side effects, safe to call from the controller's
 * constructor.
 */
export function normalizeScrollOptions(options: ScrollOptions = {}): NormalizedScrollOptions {
  return {
    id: options.id ?? DEFAULT_SCROLL_OPTIONS.id,
    defaultBehavior: options.defaultBehavior ?? DEFAULT_SCROLL_OPTIONS.defaultBehavior,
    respectReducedMotion:
      options.respectReducedMotion ?? DEFAULT_SCROLL_OPTIONS.respectReducedMotion,
    reserveScrollbarGap: options.reserveScrollbarGap ?? DEFAULT_SCROLL_OPTIONS.reserveScrollbarGap,
    target: options.target ?? DEFAULT_SCROLL_OPTIONS.target,
  };
}
