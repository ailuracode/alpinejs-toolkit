import {
  createMatchMediaWatcher,
  readTouchCapabilities,
  safeMatchMedia,
} from "@ailuracode/alpine-core";
import type AlpineType from "alpinejs";

// ── Types ──────────────────────────────────────────────────────────

export interface MediaInterval<Name extends string = string> {
  readonly name: Name;
  readonly maxWidth: number;
}

export interface MediaPluginOptions<Name extends string = string> {
  /** Intervals sorted by maxWidth ascending. Smallest-first check priority. */
  intervals?: readonly MediaInterval<Name>[];
}

export type PrefersContrast = "no-preference" | "more" | "less" | "custom";
export type PrefersColorScheme = "light" | "dark";
export type HoverCapability = "none" | "hover";
export type PointerCapability = "none" | "coarse" | "fine";
export type Orientation = "portrait" | "landscape";

export interface MediaStore<Name extends string = string> {
  width: number;
  height: number;
  breakpoint: Name;
  readonly intervals: readonly MediaInterval<Name>[];
  readonly isMobile: boolean;
  readonly isTablet: boolean;
  readonly isDesktop: boolean;
  prefersReducedMotion: boolean;
  prefersContrast: PrefersContrast;
  prefersColorScheme: PrefersColorScheme;
  hover: HoverCapability;
  pointer: PointerCapability;
  orientation: Orientation;
  maxTouchPoints: number;
  readonly isTouch: boolean;
  readonly isCoarse: boolean;
  readonly isFine: boolean;
  readonly canHover: boolean;
  is(name: Name): boolean;
  refresh(): boolean;
  refreshWidth(): boolean;
  refreshHeight(): boolean;
}

export type MediaSnapshot<Name extends string = string> = {
  readonly width: number;
  readonly height: number;
  readonly breakpoint: Name;
};

// ── Defaults ───────────────────────────────────────────────────────

export const DEFAULT_MEDIA_INTERVALS: readonly [MediaInterval<"mobile">, MediaInterval<"desktop">] =
  [
    { name: "mobile", maxWidth: 767 },
    { name: "desktop", maxWidth: Number.POSITIVE_INFINITY },
  ] as const;

export const SSR_MEDIA_DEFAULTS = {
  width: 0,
  height: 0,
  prefersReducedMotion: false,
  prefersContrast: "no-preference" as PrefersContrast,
  prefersColorScheme: "light" as PrefersColorScheme,
  hover: "none" as HoverCapability,
  pointer: "fine" as PointerCapability,
  orientation: "portrait" as Orientation,
  maxTouchPoints: 0,
} as const;

// ── Helpers ────────────────────────────────────────────────────────

/** Asserts literal types on an intervals array for const inference. */
export function mediaIntervals<const T extends readonly MediaInterval[]>(intervals: T): T {
  return intervals;
}

/**
 * Resolves which interval a width falls into (smallest-first priority).
 * Iterates intervals in order; the first whose `maxWidth >= width` wins.
 */
export function resolveMediaBreakpoint<Name extends string>(
  width: number,
  intervals: readonly MediaInterval<Name>[]
): Name {
  for (const interval of intervals) {
    if (width <= interval.maxWidth) {
      return interval.name;
    }
  }
  return intervals[intervals.length - 1]?.name;
}

/** Reads a width-based media snapshot (useful for SSR or testing). */
export function readMediaSnapshot<Name extends string = string>(
  intervals: readonly MediaInterval<Name>[] = DEFAULT_MEDIA_INTERVALS as unknown as readonly MediaInterval<Name>[]
): MediaSnapshot<Name> {
  const width = typeof window !== "undefined" ? window.innerWidth : SSR_MEDIA_DEFAULTS.width;
  const height = typeof window !== "undefined" ? window.innerHeight : SSR_MEDIA_DEFAULTS.height;

  return {
    width,
    height,
    breakpoint: resolveMediaBreakpoint(width, intervals),
  };
}

// ── Internal helpers ───────────────────────────────────────────────

type IntervalQuery<Name extends string> = {
  interval: MediaInterval<Name>;
  media: MediaQueryList;
};

type MediaFeatureKey =
  | "prefersReducedMotion"
  | "prefersContrast"
  | "prefersColorScheme"
  | "hover"
  | "pointer"
  | "orientation";

type MediaFeatureQuery = {
  key: MediaFeatureKey;
  media: MediaQueryList;
  read(): MediaStore[MediaFeatureKey];
};

function readPrefersContrast(): PrefersContrast {
  if (safeMatchMedia("(prefers-contrast: more)")?.matches) {
    return "more";
  }
  if (safeMatchMedia("(prefers-contrast: less)")?.matches) {
    return "less";
  }
  if (safeMatchMedia("(prefers-contrast: custom)")?.matches) {
    return "custom";
  }
  return "no-preference";
}

function readPrefersColorScheme(): PrefersColorScheme {
  return safeMatchMedia("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
}

function readHoverCapability(): HoverCapability {
  return safeMatchMedia("(hover: hover)")?.matches ? "hover" : "none";
}

function readPointerCapability(): PointerCapability {
  if (safeMatchMedia("(pointer: coarse)")?.matches) {
    return "coarse";
  }
  if (safeMatchMedia("(pointer: fine)")?.matches) {
    return "fine";
  }
  if (safeMatchMedia("(pointer: none)")?.matches) {
    return "none";
  }
  return SSR_MEDIA_DEFAULTS.pointer;
}

function readOrientation(): Orientation {
  return safeMatchMedia("(orientation: portrait)")?.matches ? "portrait" : "landscape";
}

function readMaxTouchPoints(): number {
  return typeof navigator !== "undefined"
    ? navigator.maxTouchPoints || 0
    : SSR_MEDIA_DEFAULTS.maxTouchPoints;
}

function resolveIsTouch(pointer: PointerCapability, maxTouchPoints: number): boolean {
  return (
    pointer === "coarse" ||
    maxTouchPoints > 0 ||
    (typeof window !== "undefined" && "ontouchstart" in window)
  );
}

function createMediaFeatureQueries(): MediaFeatureQuery[] {
  if (typeof window === "undefined") {
    return [];
  }

  const contrastQueries = ["more", "less", "custom"].map((value) =>
    window.matchMedia(`(prefers-contrast: ${value})`)
  );

  return [
    {
      key: "prefersReducedMotion",
      media: window.matchMedia("(prefers-reduced-motion: reduce)"),
      read: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    },
    {
      key: "prefersContrast",
      media: contrastQueries[0],
      read: readPrefersContrast,
    },
    {
      key: "prefersColorScheme",
      media: window.matchMedia("(prefers-color-scheme: dark)"),
      read: readPrefersColorScheme,
    },
    {
      key: "hover",
      media: window.matchMedia("(hover: hover)"),
      read: readHoverCapability,
    },
    {
      key: "pointer",
      media: window.matchMedia("(pointer: coarse)"),
      read: readPointerCapability,
    },
    {
      key: "orientation",
      media: window.matchMedia("(orientation: portrait)"),
      read: readOrientation,
    },
    ...contrastQueries.slice(1).map((media) => ({
      key: "prefersContrast" as const,
      media,
      read: readPrefersContrast,
    })),
  ];
}

function createQueries<Name extends string>(
  intervals: readonly MediaInterval<Name>[]
): IntervalQuery<Name>[] {
  if (typeof window === "undefined") {
    return [];
  }

  return intervals.slice(0, -1).map((interval) => ({
    interval,
    media: window.matchMedia(`(max-width: ${interval.maxWidth}px)`),
  }));
}

function resolveBreakpointFromQueries<Name extends string>(
  queries: IntervalQuery<Name>[],
  fallback: Name
): Name {
  for (const q of queries) {
    if (q.media.matches) {
      return q.interval.name;
    }
  }
  return fallback;
}

function assignIfChanged<T>(current: T, next: T, assign: (value: T) => void): boolean {
  if (current === next) {
    return false;
  }

  assign(next);
  return true;
}

function syncMediaFeatures(store: MediaStore, featureQueries: MediaFeatureQuery[]): boolean {
  let changed = false;

  for (const feature of featureQueries) {
    const nextValue = feature.read();
    if (store[feature.key] !== nextValue) {
      (store[feature.key] as MediaStore[MediaFeatureKey]) = nextValue;
      changed = true;
    }
  }

  const nextMaxTouchPoints = readMaxTouchPoints();
  if (store.maxTouchPoints !== nextMaxTouchPoints) {
    store.maxTouchPoints = nextMaxTouchPoints;
    changed = true;
  }

  return changed;
}

const VIEWPORT_DEBOUNCE_MS = 100;

// ── Plugin (factory) ───────────────────────────────────────────────

/**
 * Creates the media plugin from a set of intervals.
 *
 * When you pass `intervals` with `as const`, the interval names are
 * preserved as literal types for full type inference.
 *
 * @example
 * ```ts
 * Alpine.plugin(media({
 *   intervals: [
 *     { name: "mobile",  maxWidth: 767 },
 *     { name: "desktop", maxWidth: Number.POSITIVE_INFINITY },
 *   ] as const,
 * }));
 * ```
 */
export default function mediaPlugin<
  const Intervals extends readonly MediaInterval[] = typeof DEFAULT_MEDIA_INTERVALS,
>(options: { intervals?: Intervals } = {}): AlpineType.PluginCallback {
  type Name = Intervals[number]["name"];

  const intervals: readonly MediaInterval<Name>[] = (options.intervals ??
    DEFAULT_MEDIA_INTERVALS) as unknown as readonly MediaInterval<Name>[];

  return function registerMedia(Alpine) {
    const queries = createQueries(intervals);
    const featureQueries = createMediaFeatureQueries();
    const fallbackName = intervals[intervals.length - 1].name;
    const snapshot = readMediaSnapshot(intervals);
    const touchSnapshot = readTouchCapabilities();
    const cleanupFns: Array<() => void> = [];
    let viewportTimer: ReturnType<typeof setTimeout> | null = null;

    const mediaStore: MediaStore<Name> = {
      width: snapshot.width,
      height: snapshot.height,
      breakpoint: resolveBreakpointFromQueries(queries, fallbackName),
      intervals,

      is(name: Name) {
        return this.breakpoint === name;
      },

      get isMobile() {
        return this.is("mobile" as Name);
      },

      get isTablet() {
        return this.is("tablet" as Name);
      },

      get isDesktop() {
        return this.is("desktop" as Name);
      },

      prefersReducedMotion:
        typeof window === "undefined"
          ? SSR_MEDIA_DEFAULTS.prefersReducedMotion
          : window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      prefersContrast:
        typeof window === "undefined" ? SSR_MEDIA_DEFAULTS.prefersContrast : readPrefersContrast(),
      prefersColorScheme:
        typeof window === "undefined"
          ? SSR_MEDIA_DEFAULTS.prefersColorScheme
          : readPrefersColorScheme(),
      hover: typeof window === "undefined" ? SSR_MEDIA_DEFAULTS.hover : readHoverCapability(),
      pointer: typeof window === "undefined" ? SSR_MEDIA_DEFAULTS.pointer : readPointerCapability(),
      orientation:
        typeof window === "undefined" ? SSR_MEDIA_DEFAULTS.orientation : readOrientation(),
      maxTouchPoints: touchSnapshot.maxTouchPoints,

      get isTouch() {
        return resolveIsTouch(this.pointer, this.maxTouchPoints);
      },

      get isCoarse() {
        return this.pointer === "coarse";
      },

      get isFine() {
        return this.pointer === "fine";
      },

      get canHover() {
        return this.hover === "hover";
      },

      refresh() {
        let changed = false;
        const newBreakpoint = resolveBreakpointFromQueries(queries, fallbackName);
        const newWidth = typeof window !== "undefined" ? window.innerWidth : this.width;
        const newHeight = typeof window !== "undefined" ? window.innerHeight : this.height;

        changed =
          assignIfChanged(this.breakpoint, newBreakpoint, (value) => {
            this.breakpoint = value;
          }) || changed;
        changed =
          assignIfChanged(this.width, newWidth, (value) => {
            this.width = value;
          }) || changed;
        changed =
          assignIfChanged(this.height, newHeight, (value) => {
            this.height = value;
          }) || changed;

        return syncMediaFeatures(this, featureQueries) || changed;
      },

      refreshWidth() {
        if (typeof window === "undefined") {
          return false;
        }

        const newWidth = window.innerWidth;
        if (this.width !== newWidth) {
          this.width = newWidth;
          return true;
        }
        return false;
      },

      refreshHeight() {
        if (typeof window === "undefined") {
          return false;
        }

        const newHeight = window.innerHeight;
        if (this.height !== newHeight) {
          this.height = newHeight;
          return true;
        }
        return false;
      },
    };

    Alpine.store("media", mediaStore);
    Alpine.magic("media", () => Alpine.store("media"));

    const media = Alpine.store("media") as MediaStore<Name>;

    function refreshBreakpoint() {
      media.refresh();
    }

    function refreshViewport() {
      clearTimeout(viewportTimer ?? undefined);
      viewportTimer = setTimeout(() => {
        viewportTimer = null;
        media.refreshWidth();
        media.refreshHeight();
      }, VIEWPORT_DEBOUNCE_MS);
    }

    function bindListeners() {
      unbindListeners();

      for (const q of queries) {
        cleanupFns.push(createMatchMediaWatcher(q.media, refreshBreakpoint));
      }

      for (const feature of featureQueries) {
        cleanupFns.push(createMatchMediaWatcher(feature.media, refreshBreakpoint));
      }

      if (typeof window !== "undefined") {
        window.addEventListener("resize", refreshViewport, { passive: true });
        cleanupFns.push(() => window.removeEventListener("resize", refreshViewport));
      }
    }

    function unbindListeners() {
      clearTimeout(viewportTimer ?? undefined);
      viewportTimer = null;

      for (const cleanup of cleanupFns.splice(0)) {
        cleanup();
      }
    }

    bindListeners();
    media.refresh();
  };
}

/**
 * Creates a typed accessor for the media store, preserving literal
 * interval names from your intervals array.
 */
export function createMediaAccessor<const Intervals extends readonly MediaInterval[]>(
  _intervals: Intervals
): (alpine: AlpineType.Alpine) => MediaStore<Intervals[number]["name"]> {
  return (alpine) => alpine.store("media") as unknown as MediaStore<Intervals[number]["name"]>;
}

declare global {
  namespace Alpine {
    interface Stores {
      media: MediaStore;
    }
  }
}
