/**
 * Media-feature query factories for `@ailuracode/alpine-media`.
 *
 * Each `MediaFeatureQuery` bundles a `MediaQueryList` (the thing we
 * subscribe to for change events) with a `read()` function (the
 * one-shot value reader used during `refresh()` and initial sync).
 *
 * Why bundle them: a single `read()` can fan out to multiple
 * `matchMedia` queries (e.g. `prefers-contrast` probes three
 * variants), but we only need to subscribe to ONE representative
 * query for change events. Keeping the pair together makes the
 * "subscribe vs read" asymmetry explicit per feature.
 *
 * Performance contract: `buildCachedFeatureMedia(win)` allocates the
 * 10 `MediaQueryList` objects exactly ONCE during `mount()`. The
 * returned cache is captured by closure in every `read()` so feature
 * snapshots never re-invoke `window.matchMedia(...)`. A single
 * `refresh()` walks the cached references — no realloc.
 */

import type { Orientation, PointerCapability, PrefersColorScheme, PrefersContrast } from "../types";
import { SSR_MEDIA_DEFAULTS } from "../types";
import type { TouchCapabilities } from "./touch-capabilities";

/** Feature key — discriminator for the controller's refresh loop. */
export type MediaFeatureKey =
  | "prefersReducedMotion"
  | "prefersContrast"
  | "prefersColorScheme"
  | "hover"
  | "pointer"
  | "orientation";

/** Pair of (subscription target, value reader) for one feature. */
export interface MediaFeatureQuery {
  readonly key: MediaFeatureKey;
  readonly media: MediaQueryList;
  /** Reads the current value through the cached {@link CachedFeatureMedia}. */
  read(): MediaFeatureValue;
}

/** Per-feature value union. Each entry maps 1:1 to a {@link MediaFeatureKey}. */
export type MediaFeatureValue =
  | { readonly key: "prefersReducedMotion"; readonly value: boolean }
  | { readonly key: "prefersContrast"; readonly value: PrefersContrast }
  | { readonly key: "prefersColorScheme"; readonly value: PrefersColorScheme }
  | { readonly key: "hover"; readonly value: "none" | "hover" }
  | { readonly key: "pointer"; readonly value: PointerCapability }
  | { readonly key: "orientation"; readonly value: Orientation };

/**
 * Pre-allocated `MediaQueryList` cache. Allocated ONCE per mount; the
 * `read()` closures below capture it so feature snapshots do NOT call
 * `window.matchMedia(...)` again.
 *
 * The `pointer` and `prefersContrast` features probe multiple variants;
 * the controller subscribes to the FIRST variant (`pointer: coarse` /
 * `prefers-contrast: more`) and lets the reader fall through to the
 * others.
 */
export interface CachedFeatureMedia {
  readonly prefersReducedMotion: MediaQueryList;
  readonly prefersContrastMore: MediaQueryList;
  readonly prefersContrastLess: MediaQueryList;
  readonly prefersContrastCustom: MediaQueryList;
  readonly prefersColorScheme: MediaQueryList;
  readonly hover: MediaQueryList;
  readonly pointerCoarse: MediaQueryList;
  readonly pointerFine: MediaQueryList;
  readonly pointerNone: MediaQueryList;
  readonly orientation: MediaQueryList;
}

export function buildCachedFeatureMedia(win: Window): CachedFeatureMedia {
  return {
    prefersReducedMotion: win.matchMedia("(prefers-reduced-motion: reduce)"),
    prefersContrastMore: win.matchMedia("(prefers-contrast: more)"),
    prefersContrastLess: win.matchMedia("(prefers-contrast: less)"),
    prefersContrastCustom: win.matchMedia("(prefers-contrast: custom)"),
    prefersColorScheme: win.matchMedia("(prefers-color-scheme: dark)"),
    hover: win.matchMedia("(hover: hover)"),
    pointerCoarse: win.matchMedia("(pointer: coarse)"),
    pointerFine: win.matchMedia("(pointer: fine)"),
    pointerNone: win.matchMedia("(pointer: none)"),
    orientation: win.matchMedia("(orientation: portrait)"),
  };
}

function readPrefersContrastFromCache(c: CachedFeatureMedia): PrefersContrast {
  if (c.prefersContrastMore.matches) {
    return "more";
  }
  if (c.prefersContrastLess.matches) {
    return "less";
  }
  if (c.prefersContrastCustom.matches) {
    return "custom";
  }
  return "no-preference";
}

function readPointerFromCache(c: CachedFeatureMedia): PointerCapability {
  if (c.pointerCoarse.matches) {
    return "coarse";
  }
  if (c.pointerFine.matches) {
    return "fine";
  }
  if (c.pointerNone.matches) {
    return "none";
  }
  return SSR_MEDIA_DEFAULTS.pointer;
}

/**
 * Builds the feature-query list. The returned array is built once
 * during `mount()` and re-used on every `refresh()` / change event —
 * the readers capture the {@link CachedFeatureMedia} by closure, so
 * no `matchMedia` call ever happens on the hot path.
 */
export function buildMediaFeatureQueries(cache: CachedFeatureMedia): MediaFeatureQuery[] {
  return [
    {
      key: "prefersReducedMotion",
      media: cache.prefersReducedMotion,
      read: () => ({ key: "prefersReducedMotion", value: cache.prefersReducedMotion.matches }),
    },
    {
      key: "prefersContrast",
      media: cache.prefersContrastMore,
      read: () => ({ key: "prefersContrast", value: readPrefersContrastFromCache(cache) }),
    },
    {
      key: "prefersColorScheme",
      media: cache.prefersColorScheme,
      read: () => ({
        key: "prefersColorScheme",
        value: cache.prefersColorScheme.matches ? "dark" : "light",
      }),
    },
    {
      key: "hover",
      media: cache.hover,
      read: () => ({ key: "hover", value: cache.hover.matches ? "hover" : "none" }),
    },
    {
      key: "pointer",
      media: cache.pointerCoarse,
      read: () => ({ key: "pointer", value: readPointerFromCache(cache) }),
    },
    {
      key: "orientation",
      media: cache.orientation,
      read: () => ({
        key: "orientation",
        value: cache.orientation.matches ? "portrait" : "landscape",
      }),
    },
  ];
}

/**
 * One-shot snapshot of touch / pointer capabilities. Pulls the three
 * media queries from the cached list instead of re-resolving them via
 * `safeMatchMedia` — keeps the refresh path allocation-free after the
 * initial mount.
 *
 * Pass `cache = null` (and `win = null`) under SSR to fall back to
 * the {@link SSR_MEDIA_DEFAULTS} seed.
 */
export function readTouchSnapshot(
  cache: CachedFeatureMedia | null,
  win: Window | null
): TouchCapabilities & { readonly key: "touch" } {
  const coarse = cache?.pointerCoarse.matches ?? false;
  const fine = cache?.pointerFine.matches ?? false;
  const canHover = cache?.hover.matches ?? false;
  const maxTouchPoints = typeof navigator !== "undefined" ? navigator.maxTouchPoints || 0 : 0;
  const hasTouchEvents = win !== null && "ontouchstart" in win;

  return {
    key: "touch",
    maxTouchPoints,
    isTouch: coarse || maxTouchPoints > 0 || hasTouchEvents,
    isCoarse: coarse,
    isFine: fine,
    canHover,
  };
}
