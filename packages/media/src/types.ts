/**
 * Public type contracts for `@ailuracode/alpine-media`.
 *
 * Per `.cursor/rules/formatting.mdc`, every public type
 * lives in a `types.ts` module so consumers can import them without pulling
 * the implementation. The shape IS the contract — renaming a field or
 * changing a variant is a breaking change.
 *
 * The media package models the viewport snapshot (`width` / `height` /
 * `breakpoint`) plus a small set of browser media features. The `Name`
 * parameter preserves literal interval names when consumers pass
 * `as const` arrays through {@link mediaIntervals}.
 */
import type { Alpine, PluginCallback, SingletonScope, Unsubscribe } from "@ailuracode/alpine-core";
import type { Alpine as AlpineBase } from "alpinejs";

/** Re-exported so consumers can grab every media type from one path. */
export type { Unsubscribe };

/** Single breakpoint definition — `name` matches `width <= maxWidth`. */
export interface MediaInterval<Name extends string = string> {
  readonly name: Name;
  readonly maxWidth: number;
}

/** Capability reports from `(prefers-contrast: ...)`. */
export type PrefersContrast = "no-preference" | "more" | "less" | "custom";

/** OS color scheme from `(prefers-color-scheme: dark)`. */
export type PrefersColorScheme = "light" | "dark";

/** Primary input hover capability from `(hover: hover)`. */
export type HoverCapability = "none" | "hover";

/** Primary pointing device from `(pointer: ...)`. */
export type PointerCapability = "none" | "coarse" | "fine";

/** Viewport orientation from `(orientation: portrait)`. */
export type Orientation = "portrait" | "landscape";

/**
 * Snapshot of the viewport — the trio that drives responsive layouts.
 * `breakpoint` is the name of the matched {@link MediaInterval}.
 */
export interface MediaSnapshot<Name extends string = string> {
  readonly width: number;
  readonly height: number;
  readonly breakpoint: Name;
}

/**
 * Discriminator for the {@link MediaEvents.change} payload.
 *
 * - `'initialization'` — first emit right after the controller mounts.
 * - `'viewport'` — `resize` event or `matchMedia` change detected.
 * - `'user'` — explicit call to {@link MediaManager.refresh}.
 *
 * Mirrors the pattern used by `@ailuracode/alpine-theme` — a single
 * `change` event with a structured detail and a `source` field. Adding
 * a new variant is a breaking change for consumers branching on
 * `detail.source`.
 */
export type MediaChangeSource = "initialization" | "viewport" | "user";

/**
 * Structured payload delivered on every viewport transition.
 *
 * `previous` is `null` on the initialization emit; on every subsequent
 * emit it carries the previous {@link MediaSnapshot}. Consumers that
 * only care about the current state can ignore `previous` and read
 * `detail.current`.
 */
export interface MediaChangeDetail<Name extends string = string> {
  readonly current: MediaSnapshot<Name>;
  readonly previous: MediaSnapshot<Name> | null;
  readonly source: MediaChangeSource;
}

/**
 * Options accepted by {@link createMedia} and {@link mediaPlugin}.
 *
 * Mirrors the package's public surface today — `intervals` is the only
 * knob the controller exposes. Reserved fields (`id`, `debounceMs`)
 * are documented up-front so future cross-cutting config has a stable
 * seat.
 */
export interface CreateMediaOptions<Name extends string = string> {
  /**
   * Breakpoint intervals sorted by `maxWidth` ascending. The first
   * interval whose `maxWidth >= width` wins. Defaults to
   * {@link DEFAULT_MEDIA_INTERVALS} (`mobile` ≤ 767, `desktop` otherwise).
   *
   * For full literal type inference of `Name`, pass the array with
   * `as const` and forward it through {@link mediaIntervals}.
   */
  readonly intervals?: readonly MediaInterval<Name>[];
  /**
   * Stable identifier exposed via {@link MediaController.id}. Defaults
   * to an auto-generated id (`media-<n>`).
   */
  readonly id?: string;
  /**
   * Debounce window for `resize`-driven width / height refreshes.
   * Defaults to `100` ms — the same value the package shipped before
   * the controller rewrite.
   */
  readonly debounceMs?: number;
  /**
   * Singleton scope for this controller. Defaults to the active
   * `document`, an ambient `runWithSingletonScope()` context, or —
   * in SSR — must be provided explicitly as a plain object.
   */
  readonly scope?: SingletonScope;
  /**
   * `$store.media` store key the Alpine plugin registers under.
   * Defaults to {@link DEFAULT_MEDIA_STORE_KEY}. Set when the host
   * already owns a `media` store or another toolkit plugin would
   * collide on that name — the rename avoids the collision without
   * touching the controller.
   */
  readonly storeKey?: string;
}

/** Default `$store.media` key registered by {@link mediaPlugin}. */
export const DEFAULT_MEDIA_STORE_KEY = "media";

/**
 * Public, framework-agnostic manager returned by {@link createMedia}.
 *
 * The manager exposes the mutable viewport / feature state plus the
 * `refresh*` commands and a typed `on('change', listener)` event bus.
 * Standalone consumers (Blade / vanilla TS / SSR) use this surface
 * directly; Alpine consumers go through `$store.media` / `$media`,
 * which proxy every method to the manager.
 */
export interface MediaManager<Name extends string = string> {
  /** Current `window.innerWidth` (or {@link SSR_MEDIA_DEFAULTS.width} on SSR). */
  width: number;
  /** Current `window.innerHeight` (or {@link SSR_MEDIA_DEFAULTS.height} on SSR). */
  height: number;
  /** Current breakpoint name from the configured intervals. */
  breakpoint: Name;
  /** The configured intervals array. */
  readonly intervals: readonly MediaInterval<Name>[];
  /** `(prefers-reduced-motion: reduce)`. */
  prefersReducedMotion: boolean;
  /** `(prefers-contrast: ...)`. */
  prefersContrast: PrefersContrast;
  /** `(prefers-color-scheme: dark)`. */
  prefersColorScheme: PrefersColorScheme;
  /** `(hover: hover)`. */
  hover: HoverCapability;
  /** `(pointer: ...)`. */
  pointer: PointerCapability;
  /** `(orientation: portrait)`. */
  orientation: Orientation;
  /** `navigator.maxTouchPoints`. */
  maxTouchPoints: number;
  /** Shorthand for `pointer === 'coarse'` or `maxTouchPoints > 0` or `ontouchstart`. */
  readonly isTouch: boolean;
  /** Shorthand for `pointer === 'coarse'`. */
  readonly isCoarse: boolean;
  /** Shorthand for `pointer === 'fine'`. */
  readonly isFine: boolean;
  /** Shorthand for `hover === 'hover'`. */
  readonly canHover: boolean;
  /** Read-only snapshot of the viewport. */
  snapshot(): MediaSnapshot<Name>;
  /**
   * Refresh every observable — width, height, breakpoint, and media
   * features. Returns `true` when any value changed.
   */
  refresh(): boolean;
  /** Refresh `width` only. Returns `true` when the value changed. */
  refreshWidth(): boolean;
  /** Refresh `height` only. Returns `true` when the value changed. */
  refreshHeight(): boolean;
  /**
   * Subscribes to viewport transitions. Detail payload carries
   * `current`, `previous`, and `source`. Returns an unsubscribe function.
   */
  on(event: "change", listener: (detail: MediaChangeDetail<Name>) => void): Unsubscribe;
  /** Tears down listeners, watchers, and timers. Idempotent. */
  destroy(): void;
}

/**
 * Alpine-facing store surface. The plugin fills it from a manager and
 * Alpine wraps it in `reactive()` so template bindings update on
 * every change. Every command forwards to the manager — the store is
 * a thin reactive mirror, not a state holder.
 */
export interface MediaStore<Name extends string = string> extends MediaManager<Name> {
  /** Stable identifier inherited from the controller. */
  readonly id: string;
  /** Whether the controller has been torn down. */
  readonly isDestroyed: boolean;
}

/**
 * Typed view of `Alpine` the media plugin uses internally.
 *
 * Built from the toolkit's {@link Alpine} generic with the `media`
 * store mapped to its concrete {@link MediaStore} shape. A real
 * `Alpine` runtime is assignable to `MediaAlpine` without a cast
 * because the toolkit's `Alpine<Stores>` only ADDS overloads.
 *
 * The `cleanup?` member is Alpine-specific (older versions don't
 * expose it) and is layered on as an intersection so the integration
 * can guard every call with a `typeof === "function"` check.
 */
export type MediaAlpine = Alpine<{ media: MediaStore }> & {
  /**
   * Forwarded through Alpine's cleanup mechanism when available.
   * Older Alpine versions don't expose `cleanup`; the integration
   * guards every call with a `typeof === "function"` check.
   */
  cleanup?(callback: () => void): void;
};

/**
 * `Alpine.plugin()` callback signature.
 *
 * Typed against the base {@link AlpineBase} via the toolkit's
 * {@link PluginCallback} generic, which keeps this alias structurally
 * assignable to `Base.PluginCallback`. `mediaPlugin(...)` drops
 * straight into `Alpine.plugin(...)` without a cast. The plugin
 * narrows the runtime instance to {@link MediaAlpine} inside the
 * function body for typed access to the `"media"` store / magic.
 */
export type MediaPluginCallback = PluginCallback<AlpineBase>;

/** Default breakpoint intervals shipped with the package. */
export const DEFAULT_MEDIA_INTERVALS: readonly [MediaInterval<"mobile">, MediaInterval<"desktop">] =
  [
    { name: "mobile", maxWidth: 767 },
    { name: "desktop", maxWidth: Number.POSITIVE_INFINITY },
  ] as const;

/** Default debounce window (ms) for `resize`-driven width/height refresh. */
export const DEFAULT_MEDIA_DEBOUNCE_MS = 100;

/**
 * SSR-safe defaults — every observable's value when `window` /
 * `matchMedia` / `navigator` are unavailable.
 *
 * The shape mirrors the relevant slice of {@link MediaManager} so
 * {@link MediaController} can seed itself with a single
 * `Object.freeze({ ...SSR_MEDIA_DEFAULTS })` call on construction.
 */
export const SSR_MEDIA_DEFAULTS = {
  width: 0,
  height: 0,
  prefersReducedMotion: false,
  prefersContrast: "no-preference",
  prefersColorScheme: "light",
  hover: "none",
  pointer: "fine",
  orientation: "portrait",
  maxTouchPoints: 0,
} as const;
