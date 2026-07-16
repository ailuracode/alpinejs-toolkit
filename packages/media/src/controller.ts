/**
 * Media controller — the framework-agnostic core of
 * `@ailuracode/alpine-media`.
 *
 * Owns the viewport snapshot (`width` / `height` / `breakpoint`),
 * every browser media feature (`prefersReducedMotion`,
 * `prefersContrast`, `prefersColorScheme`, `hover`, `pointer`,
 * `orientation`), and the touch / pointer snapshot
 * (`maxTouchPoints`, `isTouch`, `isCoarse`, `isFine`, `canHover`).
 *
 * Responsibilities:
 *
 * 1. **State** — public mutable fields exposed through
 *    {@link MediaManager}. The manager surface is the source of truth;
 *    the Alpine `$store.media` object is a thin reactive mirror.
 * 2. **Subscriptions** — `matchMedia` change events per breakpoint
 *    and feature, plus a debounced `resize` listener for `width` /
 *    `height`. Cleanups are tracked in `#subscriptions` so
 *    `destroy()` is idempotent and exhaustive.
 * 3. **Events** — typed `on('change', listener)` from the inherited
 *    bus. Emits on every viewport transition
 *    (initialization / viewport / user) with the structured detail
 *    payload (`current` / `previous` / `source`).
 * 4. **Lifecycle** — `destroy()` is idempotent; the
 *    `BaseController` parent guards the lifecycle phase.
 *
 * Construction rules (per
 * `.cursor/rules/new-package.mdc`):
 *
 * - The constructor MUST NOT access `window` / `document` /
 *   `matchMedia`. The controller seeds itself with
 *   {@link SSR_MEDIA_DEFAULTS} when `safeWindow()` is `null`.
 * - `mount()` is the place where DOM listeners and matchMedia
 *   subscriptions are wired — keeping the constructor pure makes the
 *   package SSR-safe and testable without `window`.
 *
 * Performance contract:
 *
 * - Every `MediaQueryList` the controller needs is allocated ONCE
 *   during `mount()` and stashed in `#featureCache`. Hot-path reads
 *   (resize, `refresh()`, change events) consult the cache — no
 *   `window.matchMedia(...)` call happens after the first mount.
 * - The window reference is cached in `#win` so per-method `typeof
 *   window` checks are gone.
 * - A `matchMedia` change event reads ONLY the feature that fired,
 *   not the full six — saves five `MediaQueryList.matches` reads on
 *   every user-driven change.
 *
 * Why composition over inheritance: the controller already extends
 * `BaseController` for `on` / `off` / `phase` / lifecycle. The state
 * is plain fields (no toggles, no derived state machines) so no
 * composition with the toggle controller is needed — `MediaController`
 * is a leaf in the toolkit's hierarchy.
 */

import {
  BaseController,
  createSingleton,
  generateId,
  releaseSingleton,
  ToolkitError,
  type Unsubscribe,
} from "@ailuracode/alpine-core";
import {
  resolveBreakpointFromQueries,
  resolveIntervals,
  resolveMediaBreakpoint,
} from "./breakpoint";
import type { MediaEvents } from "./events";
import { createMatchMediaWatcher } from "./internal/match-media";
import {
  buildCachedFeatureMedia,
  buildMediaFeatureQueries,
  type CachedFeatureMedia,
  type MediaFeatureQuery,
  type MediaFeatureValue,
  readTouchSnapshot,
} from "./internal/queries";
import type {
  CreateMediaOptions,
  HoverCapability,
  MediaChangeDetail,
  MediaChangeSource,
  MediaInterval,
  MediaManager,
  MediaSnapshot,
  Orientation,
  PointerCapability,
  PrefersColorScheme,
  PrefersContrast,
} from "./types";
import { DEFAULT_MEDIA_DEBOUNCE_MS, SSR_MEDIA_DEFAULTS } from "./types";

/** Pair of (subscription target, value reader) for one breakpoint. */
interface BreakpointQuery<Name extends string> {
  readonly interval: MediaInterval<Name>;
  readonly media: MediaQueryList;
}

/**
 * Stable registry key for the singleton media controller. Like
 * `theme`, the `options.id` and `options.intervals` are NOT part
 * of the key — the document's viewport is unique by definition,
 * so two `createMedia()` calls describe the same singleton. Tests
 * should call `clearSingleton(MEDIA_SINGLETON_KEY)` (or
 * `clearAllSingletons()`) to reset between cases.
 *
 * Exported from `./plugin` so consumers and tests can target the
 * slot directly without re-typing the string.
 */
export const MEDIA_SINGLETON_KEY = "@ailuracode/alpine-media/default";

/**
 * Public entrypoint — builds and mounts a fully-initialized
 * {@link MediaController}. The constructor stays pure; the factory
 * wires the `mount()` step.
 *
 * Singleton guarantee: at most one live `MediaController` per
 * document. Repeated calls return the existing instance; the
 * controller's `destroy()` releases the slot so the next call
 * builds a fresh one. Direct `new MediaController(...)` is still
 * supported for tests and advanced consumers — only the
 * `createMedia()` factory enforces uniqueness.
 */
export function createMedia<Name extends string>(
  options: CreateMediaOptions<Name> = {}
): MediaController<Name> {
  const { scope, ...factoryOptions } = options;
  return createSingleton(
    MEDIA_SINGLETON_KEY,
    () => {
      const controller = new MediaController<Name>(factoryOptions);
      controller.mount();
      return controller;
    },
    { scope }
  );
}

/**
 * Headless controller for `@ailuracode/alpine-media`.
 *
 * Public surface mirrors {@link MediaManager}; the class itself adds
 * the `id` / `isDestroyed` accessors and the internal subscription
 * wiring that backs every observable.
 */
export class MediaController<Name extends string = string>
  extends BaseController<MediaEvents<Name>>
  implements MediaManager<Name>
{
  readonly #intervals: readonly MediaInterval<Name>[];
  readonly #fallbackBreakpoint: Name;
  readonly #debounceMs: number;

  /**
   * Pre-allocated `MediaQueryList` cache. `null` until `mount()` runs
   * the first time. The matchMedia subscriptions and the per-feature
   * `read()` closures capture the same object, so a single refresh
   * walks cached references — never `window.matchMedia(...)` again.
   */
  #featureCache: CachedFeatureMedia | null = null;

  /** Feature query list — one per observable. `null` until `mount()`. */
  #featureQueries: MediaFeatureQuery[] | null = null;

  /**
   * Per-interval matchMedia queries. `null` until `mount()` builds
   * them. Lazy because the constructor is forbidden from touching
   * `window` (SSR safety + testability).
   */
  #breakpointQueries: BreakpointQuery<Name>[] | null = null;

  /** Cached `window` reference. `null` under SSR / before mount. */
  #win: Window | null = null;

  #width: number = SSR_MEDIA_DEFAULTS.width;
  #height: number = SSR_MEDIA_DEFAULTS.height;
  #breakpoint: Name;

  #prefersReducedMotion: boolean = SSR_MEDIA_DEFAULTS.prefersReducedMotion;
  #prefersContrast: PrefersContrast = SSR_MEDIA_DEFAULTS.prefersContrast;
  #prefersColorScheme: PrefersColorScheme = SSR_MEDIA_DEFAULTS.prefersColorScheme;
  #hover: HoverCapability = SSR_MEDIA_DEFAULTS.hover;
  #pointer: PointerCapability = SSR_MEDIA_DEFAULTS.pointer;
  #orientation: Orientation = SSR_MEDIA_DEFAULTS.orientation;
  #maxTouchPoints: number = SSR_MEDIA_DEFAULTS.maxTouchPoints;

  /**
   * Last snapshot captured before the most recent emit. Lets the
   * controller report `previous` on every non-initial change. `null`
   * until the init microtask fires (mirrors the toggle pattern).
   */
  #previousSnapshot: MediaSnapshot<Name> | null = null;

  /** Pending `resize` timer handle. Cleared on every refresh and on destroy. */
  #viewportTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Active `matchMedia` cleanups, indexed by the underlying query
   * string. Keyed so duplicate listeners (e.g. from a re-mount) are
   * deduped. Cleared on destroy.
   */
  #subscriptions: Map<string, Unsubscribe> = new Map();

  constructor(options: CreateMediaOptions<Name>) {
    super(options.id ?? generateId("media"));
    this.#intervals = resolveIntervals<Name>(options.intervals);
    this.#debounceMs = options.debounceMs ?? DEFAULT_MEDIA_DEBOUNCE_MS;

    // The constructor is SSR-safe — no `window` / `matchMedia` access.
    // The last interval must exist; the validator below rejects empty
    // arrays before reaching this point.
    const lastInterval = this.#intervals[this.#intervals.length - 1];
    if (lastInterval === undefined) {
      throw new ToolkitError(
        "createMedia: `intervals` must contain at least one entry",
        "TOOLKIT_INVALID_ARGUMENT"
      );
    }
    this.#fallbackBreakpoint = lastInterval.name;

    // Seed `breakpoint` from the SSR-safe `width` default so reads
    // are deterministic before `mount()` runs the real sync.
    this.#breakpoint = resolveMediaBreakpoint<Name>(this.#width, this.#intervals);
  }

  // ── Public state surface ────────────────────────────────────────

  get width(): number {
    return this.#width;
  }

  get height(): number {
    return this.#height;
  }

  get breakpoint(): Name {
    return this.#breakpoint;
  }

  get intervals(): readonly MediaInterval<Name>[] {
    return this.#intervals;
  }

  get prefersReducedMotion(): boolean {
    return this.#prefersReducedMotion;
  }

  get prefersContrast(): PrefersContrast {
    return this.#prefersContrast;
  }

  get prefersColorScheme(): PrefersColorScheme {
    return this.#prefersColorScheme;
  }

  get hover(): HoverCapability {
    return this.#hover;
  }

  get pointer(): PointerCapability {
    return this.#pointer;
  }

  get orientation(): Orientation {
    return this.#orientation;
  }

  get maxTouchPoints(): number {
    return this.#maxTouchPoints;
  }

  get isTouch(): boolean {
    return this.#resolveIsTouch();
  }

  get isCoarse(): boolean {
    return this.#pointer === "coarse";
  }

  get isFine(): boolean {
    return this.#pointer === "fine";
  }

  get canHover(): boolean {
    return this.#hover === "hover";
  }

  snapshot(): MediaSnapshot<Name> {
    return {
      width: this.#width,
      height: this.#height,
      breakpoint: this.#breakpoint,
    };
  }

  // ── Public commands ─────────────────────────────────────────────

  refresh(): boolean {
    if (this.isDestroyed) {
      return false;
    }
    const previousBreakpoint = this.#breakpoint;
    const widthChanged = this.refreshWidth();
    const heightChanged = this.refreshHeight();
    this.#recomputeBreakpoint();
    const breakpointChanged = this.#breakpoint !== previousBreakpoint;
    const featuresChanged = this.#syncFeatures();

    const changed = widthChanged || heightChanged || breakpointChanged || featuresChanged;
    if (changed) {
      this.#emitViewportChange("user");
    }
    return changed;
  }

  refreshWidth(): boolean {
    if (!this.#win) {
      return false;
    }
    const next = this.#win.innerWidth;
    if (this.#width === next) {
      return false;
    }
    this.#width = next;
    return true;
  }

  refreshHeight(): boolean {
    if (!this.#win) {
      return false;
    }
    const next = this.#win.innerHeight;
    if (this.#height === next) {
      return false;
    }
    this.#height = next;
    return true;
  }

  // ── Lifecycle ───────────────────────────────────────────────────

  /**
   * Wires every DOM listener (`resize`, per-interval `matchMedia`,
   * per-feature `matchMedia`). Idempotent — re-mounting is a no-op
   * because `BaseController` guards the phase.
   *
   * Under SSR (`window === undefined`) the controller transitions
   * straight to `mounted` and skips the DOM wiring — the public
   * getters still return the SSR-safe defaults.
   */
  override mount(): void {
    if (this.isMounted) {
      return;
    }
    const win = typeof window !== "undefined" ? window : null;
    super.mount();
    if (!win) {
      return;
    }
    this.#win = win;
    this.#init();
  }

  /**
   * Tears down every subscription and cancels the pending viewport
   * timer. Idempotent — `BaseController.destroy()` guards the phase.
   *
   * Also releases the singleton slot so the next `createMedia()`
   * call builds a fresh controller.
   */
  override destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    if (this.#viewportTimer !== null) {
      clearTimeout(this.#viewportTimer);
      this.#viewportTimer = null;
    }
    for (const cleanup of this.#subscriptions.values()) {
      cleanup();
    }
    this.#subscriptions.clear();
    this.#featureCache = null;
    this.#featureQueries = null;
    this.#breakpointQueries = null;
    this.#win = null;
    super.destroy();
    releaseSingleton(MEDIA_SINGLETON_KEY, this);
  }

  // ── Initialization ──────────────────────────────────────────────

  /**
   * Predictable init order:
   *
   * 1. Seed width / height / breakpoint / maxTouchPoints from the
   *    current viewport (or SSR defaults).
   * 2. Subscribe to every interval `matchMedia` query.
   * 3. Subscribe to every feature `matchMedia` query.
   * 4. Register the debounced `resize` listener.
   * 5. Schedule the `initialization` emit on a microtask so
   *    consumers can subscribe synchronously after
   *    `createMedia(...)` returns and still receive the initial
   *    state.
   */
  #init(): void {
    const win = this.#win;
    if (!win) {
      return;
    }
    const cache = buildCachedFeatureMedia(win);
    this.#featureCache = cache;
    this.#featureQueries = buildMediaFeatureQueries(cache);
    this.#breakpointQueries = this.#buildBreakpointQueries(win);

    this.#seedFromViewport();
    this.#recomputeBreakpoint();
    this.#seedFeatures();

    for (const query of this.#breakpointQueries) {
      this.#subscriptions.set(
        query.media.media,
        createMatchMediaWatcher(query.media, () => this.#handleBreakpointChange())
      );
    }

    for (const feature of this.#featureQueries) {
      this.#subscriptions.set(
        feature.media.media,
        createMatchMediaWatcher(feature.media, () => this.#handleFeatureChange(feature))
      );
    }

    const onResize = (): void => this.#handleResize();
    win.addEventListener("resize", onResize, { passive: true });
    this.#subscriptions.set("__resize__", () => {
      win.removeEventListener("resize", onResize);
    });

    queueMicrotask(() => {
      if (this.isDestroyed) {
        return;
      }
      this.#emitViewportChange("initialization");
    });
  }

  /**
   * Builds the breakpoint matchMedia query list. Excludes the
   * trailing "infinite" interval — its query is meaningless and
   * it acts as the fallback when no smaller interval matches.
   *
   * The query list is built once during `mount()` (intervals are
   * immutable). Re-creating per refresh would force a fresh
   * `matchMedia` call on every layout, which is wasteful.
   */
  #buildBreakpointQueries(win: Window): BreakpointQuery<Name>[] {
    // Drop the last interval (the Infinity fallback) — its query
    // would never match. `slice(0, -1)` is safe because
    // `resolveIntervals` rejects empty arrays.
    const finiteIntervals = this.#intervals.slice(0, -1);
    return finiteIntervals.map((interval) => ({
      interval,
      media: win.matchMedia(`(max-width: ${interval.maxWidth}px)`),
    }));
  }

  // ── Private sync helpers ────────────────────────────────────────

  /**
   * Reads width / height / maxTouchPoints from the runtime. Called
   * once during `mount()` to seed the controller; does NOT touch
   * `breakpoint` (that comes from `#recomputeBreakpoint` after the
   * matchMedia queries are subscribed).
   */
  #seedFromViewport(): void {
    const win = this.#win;
    this.#width = win ? win.innerWidth : SSR_MEDIA_DEFAULTS.width;
    this.#height = win ? win.innerHeight : SSR_MEDIA_DEFAULTS.height;
    const touch = readTouchSnapshot(this.#featureCache, win);
    this.#maxTouchPoints = touch.maxTouchPoints;
  }

  /**
   * One-shot feature sync during `mount()`. Iterates every
   * {@link MediaFeatureQuery} and copies the read value into the
   * matching private field. Does NOT emit.
   */
  #seedFeatures(): void {
    const queries = this.#featureQueries;
    if (!queries) {
      return;
    }
    for (const feature of queries) {
      this.#applyFeature(feature.read());
    }
  }

  /**
   * Refresh-time feature sync. Returns `true` when at least one
   * feature changed; the caller emits a single `change` event for
   * all feature changes (matching the historical behavior where
   * `refresh()` returns one boolean).
   *
   * The `previous !== next.value` short-circuit is the only check —
   * the reader does NOT re-invoke `window.matchMedia(...)` because
   * the closure captured the cached `MediaQueryList` references at
   * mount time.
   */
  #syncFeatures(): boolean {
    const queries = this.#featureQueries;
    if (!queries) {
      return false;
    }
    let changed = false;
    for (const feature of queries) {
      const next = feature.read();
      if (this.#featureValue(feature.key) !== next.value) {
        this.#applyFeature(next);
        changed = true;
      }
    }
    const touch = readTouchSnapshot(this.#featureCache, this.#win);
    if (touch.maxTouchPoints !== this.#maxTouchPoints) {
      this.#maxTouchPoints = touch.maxTouchPoints;
      changed = true;
    }
    return changed;
  }

  /**
   * Maps {@link MediaFeatureKey} to the current private field
   * value. Used by `#syncFeatures` to detect per-feature changes
   * without re-reading every getter.
   */
  #featureValue(key: MediaFeatureQuery["key"]): MediaFeatureValue["value"] {
    switch (key) {
      case "prefersReducedMotion":
        return this.#prefersReducedMotion;
      case "prefersContrast":
        return this.#prefersContrast;
      case "prefersColorScheme":
        return this.#prefersColorScheme;
      case "hover":
        return this.#hover;
      case "pointer":
        return this.#pointer;
      case "orientation":
        return this.#orientation;
    }
  }

  /**
   * Writes a {@link MediaFeatureValue} into the matching private
   * field. The `MediaFeatureValue` is a discriminated union so the
   * compiler verifies every key lands in the right slot.
   */
  #applyFeature(value: MediaFeatureValue): void {
    switch (value.key) {
      case "prefersReducedMotion":
        this.#prefersReducedMotion = value.value;
        return;
      case "prefersContrast":
        this.#prefersContrast = value.value;
        return;
      case "prefersColorScheme":
        this.#prefersColorScheme = value.value;
        return;
      case "hover":
        this.#hover = value.value;
        return;
      case "pointer":
        this.#pointer = value.value;
        return;
      case "orientation":
        this.#orientation = value.value;
        return;
    }
  }

  /**
   * Touch heuristic — coarse pointer, `navigator.maxTouchPoints > 0`,
   * or `ontouchstart` on `window`. Matches the legacy definition;
   * the public `isTouch` getter and the SSR initialization share the
   * same source via the cached media list.
   */
  #resolveIsTouch(): boolean {
    const cache = this.#featureCache;
    const win = this.#win;
    const coarse = cache?.pointerCoarse.matches ?? false;
    const maxTouchPoints = typeof navigator !== "undefined" ? navigator.maxTouchPoints || 0 : 0;
    const hasTouchEvents = win !== null && "ontouchstart" in win;
    return coarse || maxTouchPoints > 0 || hasTouchEvents;
  }

  /**
   * Recomputes `breakpoint` from the live matchMedia queries.
   *
   * Iterates `#breakpointQueries` in declaration order and returns
   * the first interval whose `(max-width: Xpx)` query matches.
   * Falls back to `#fallbackBreakpoint` (the trailing "infinite"
   * interval) when nothing matches. The query-based path matches
   * what the browser reports — `innerWidth` can disagree with
   * `matchMedia` during browser zoom or DPR rounding, so this is
   * the authoritative source for breakpoint resolution.
   */
  #recomputeBreakpoint(): void {
    if (!this.#breakpointQueries) {
      this.#breakpoint = resolveMediaBreakpoint<Name>(this.#width, this.#intervals);
      return;
    }
    this.#breakpoint = resolveBreakpointFromQueries<Name>(
      this.#breakpointQueries,
      this.#fallbackBreakpoint
    );
  }

  // ── Event sources ───────────────────────────────────────────────

  /**
   * Resize handler — debounced. We compare against the cached
   * `width` / `height` and emit a single `change` event only when
   * at least one value moved. `matchMedia` change events arrive in
   * parallel but are idempotent — the `previous` snapshot makes
   * the listener see no transition.
   */
  #handleResize(): void {
    if (this.isDestroyed) {
      return;
    }
    if (this.#viewportTimer !== null) {
      clearTimeout(this.#viewportTimer);
    }
    this.#viewportTimer = setTimeout(() => {
      this.#viewportTimer = null;
      const previous = this.#breakpoint;
      const widthChanged = this.refreshWidth();
      const heightChanged = this.refreshHeight();
      this.#recomputeBreakpoint();
      const breakpointChanged = this.#breakpoint !== previous;
      if (widthChanged || heightChanged || breakpointChanged) {
        this.#emitViewportChange("viewport");
      }
    }, this.#debounceMs);
  }

  /**
   * `matchMedia` change for a breakpoint query. Re-evaluates every
   * query in order because the active breakpoint is the FIRST
   * matching one — flipping one can shift the active one without
   * the firing query's match state changing (e.g. shrinking across
   * two thresholds).
   */
  #handleBreakpointChange(): void {
    if (this.isDestroyed) {
      return;
    }
    const previous = this.#breakpoint;
    this.#recomputeBreakpoint();
    if (this.#breakpoint !== previous) {
      this.#emitViewportChange("viewport");
    }
  }

  /**
   * `matchMedia` change for a feature query. Reads ONLY the feature
   * that fired — the closure captured the cache at mount time, so
   * one `MediaQueryList.matches` read is enough. Cascading effects
   * across features (e.g. a `prefers-color-scheme` flip that does
   * NOT change `pointer`) are NOT double-counted because we never
   * re-read them.
   */
  #handleFeatureChange(fired: MediaFeatureQuery): void {
    if (this.isDestroyed) {
      return;
    }
    const next = fired.read();
    if (this.#featureValue(fired.key) !== next.value) {
      this.#applyFeature(next);
      this.#emitViewportChange("viewport");
    }
  }

  // ── Emitter ────────────────────────────────────────────────────

  /**
   * Captures the previous snapshot, builds the detail payload, and
   * emits through the inherited bus. Tracks `previous` so the next
   * call sees the snapshot we're about to publish.
   */
  #emitViewportChange(source: MediaChangeSource): void {
    if (this.isDestroyed) {
      return;
    }
    const current = this.snapshot();
    const previous = source === "initialization" ? null : this.#previousSnapshot;
    const detail: MediaChangeDetail<Name> = { current, previous, source };
    this.#previousSnapshot = current;
    this.emit("change", detail);
  }
}
