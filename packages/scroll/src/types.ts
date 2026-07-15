/**
 * Public type contracts for `@ailuracode/alpine-scroll` v1.0.0.
 *
 * Per `.cursor/rules/new-package.mdc`, every public type
 * lives in a `types.ts` module so consumers can import them without
 * pulling the implementation. The shape IS the contract — renaming a
 * field or changing a variant is a breaking change.
 *
 * The scroll package models five concerns under one headless controller:
 *
 * 1. **Scroll position tracking** — `ScrollState` exposes the live
 *    snapshot (`x`, `y`, `direction`, `atTop`, `atBottom`, `progress`).
 * 2. **Body / scroll lock** — handle-based, ordered stack via
 *    `lockWithHandle` / `unlock(handle)`. Lock reason flows through
 *    `ScrollLockChangeDetail.reason`.
 * 3. **Section observer** — IntersectionObserver-backed visibility
 *    tracker that fires `section` events.
 * 4. **Navigation** — programmatic scroll with reduced-motion gate.
 * 5. **Plugin integration** — `scrollPlugin(options)` wires the
 *    controller into `$store.scroll` and the `$scroll` magic.
 */

import type { Alpine, PluginCallback, SingletonScope, Unsubscribe } from "@ailuracode/alpine-core";
import type { Alpine as AlpineBase } from "alpinejs";

/** Re-exported so consumers can grab the unsubscribe helper from one path. */
export type { Unsubscribe };

/* -------------------------------------------------------------------------- */
/*                              Scroll state model                           */
/* -------------------------------------------------------------------------- */

/** Vertical scroll direction. `'none'` covers the resting state. */
export type ScrollDirection = "up" | "down" | "none";

/** Horizontal scroll behavior passed to the native `ScrollToOptions`. */
export type ScrollBehavior = "auto" | "instant" | "smooth";

/** Lock axes — `'y'` (vertical only, default) or `'both'`. */
export type ScrollLockAxis = "y" | "both";

/**
 * Source discriminator for the `change` event payload. Tracks who
 * caused a state transition so listeners can branch without
 * inspecting raw event references.
 *
 * - `'user'` — direct invocation of `by` / `toTop` / `toBottom` /
 *   `toElement` / `scrollIntoView`.
 * - `'navigation'` — programmatic scroll (`to(target)`).
 * - `'lock'` — scroll lock applied or fully released.
 * - `'section'` — section activation flip.
 * - `'reset'` — `controller.reset()` call.
 * - `'initialization'` — first emit right after `mount()`, scheduled
 *   on a microtask so consumers can subscribe synchronously.
 */
export type ScrollChangeSource =
  | "user"
  | "navigation"
  | "lock"
  | "section"
  | "reset"
  | "initialization";

/**
 * Live scroll state. Fields are mutable on the controller's internal
 * copy; the controller's `state` getter returns a frozen snapshot so
 * external consumers cannot mutate the live state.
 */
export interface ScrollState {
  x: number;
  y: number;
  direction: ScrollDirection;
  atTop: boolean;
  atBottom: boolean;
  progress: number;
  locked: boolean;
  lockCount: number;
  activeSection: string | null;
  visibleSections: readonly string[];
}

/* -------------------------------------------------------------------------- */
/*                                Scroll options                             */
/* -------------------------------------------------------------------------- */

/**
 * Activation mode for the section observer. `'first-visible'` picks
 * the topmost section currently in the viewport; `'nearest'` picks the
 * section whose centre is closest to the viewport centre.
 */
export type ScrollSectionMode = "first-visible" | "nearest";

/** Options passed to {@link ScrollController.registerSection}. */
export interface ScrollSectionOptions {
  /** Activation mode. Default: `'first-visible'`. */
  readonly mode?: ScrollSectionMode;
  /**
   * Optional IntersectionObserver `rootMargin`. Forwarded verbatim.
   * Default: `'0px 0px -50% 0px'` (half-viewport from the top).
   */
  readonly rootMargin?: string;
}

/** Default `$store` key registered by {@link scrollPlugin}. */
export const DEFAULT_SCROLL_STORE_KEY = "scroll";

/** Default `$scroll` magic key registered by {@link scrollPlugin}. */
export const DEFAULT_SCROLL_MAGIC_KEY = "scroll";

/** Options accepted by `ScrollController` and `ScrollPlugin.init()`. */
export interface ScrollOptions {
  /** Stable identifier exposed via `controller.id`. Default: auto. */
  readonly id?: string;
  /** Initial scroll behavior for navigation commands. Default: `'smooth'`. */
  readonly defaultBehavior?: ScrollBehavior;
  /** Respect `prefers-reduced-motion`. Default: `true`. */
  readonly respectReducedMotion?: boolean;
  /** Reserve `--ailura-scrollbar-gap` on lock. Default: `true`. */
  readonly reserveScrollbarGap?: boolean;
  /**
   * Element to apply the scrollbar-gap compensation to. When the
   * lock is acquired, the element's `padding-right` is set to the
   * measured scrollbar width so the layout does not jump when the
   * body's scrollbar disappears. The original padding is restored
   * on unlock.
   *
   * Accepts either an `Element` reference or a CSS selector string
   * (resolved once via `document.querySelector`). Pass `null` to
   * disable automatic compensation — the `--ailura-scrollbar-gap`
   * CSS variable is still set on `<html>` so consumers can wire it
   * manually.
   *
   * Default: `null` (CSS variable only, no automatic padding).
   */
  readonly target?: Element | string | null;
  /**
   * Singleton scope for this controller. Defaults to the active
   * `document`, an ambient `runWithSingletonScope()` context, or —
   * in SSR — must be provided explicitly via
   * `createSingletonScope()`.
   */
  readonly scope?: SingletonScope;
  /**
   * `$store` key the Alpine plugin registers under. Defaults to
   * {@link DEFAULT_SCROLL_STORE_KEY}. Set when the host already owns
   * a `scroll` store or another toolkit plugin would collide on that
   * name — the rename avoids the collision without touching the
   * controller. Ignored by the standalone `createScroll` factory.
   */
  readonly storeKey?: string;
  /**
   * `$scroll` magic key the Alpine plugin registers under. Defaults
   * to {@link DEFAULT_SCROLL_MAGIC_KEY}, or to `storeKey` when that
   * is renamed (the magic follows the store so consumers only rename
   * one). Ignored by the standalone factory.
   */
  readonly magicKey?: string;
}

/* -------------------------------------------------------------------------- */
/*                              Event detail shapes                          */
/* -------------------------------------------------------------------------- */

/**
 * Detail payload of the `change` event. `previous` is `null` on the
 * `initialization` event and a full snapshot on every subsequent
 * transition. `reason` is the caller-supplied string from
 * `by(reason)`, `toTop(reason)`, etc.
 */
export interface ScrollChangeDetail {
  readonly state: ScrollState;
  readonly previous: ScrollState | null;
  readonly source: ScrollChangeSource;
  readonly reason?: string;
}

/**
 * Detail payload of the `lock` event (canonical name).
 *
 * `reason` flows through from the caller-supplied string in
 * `lockWithHandle(reason)` so consumers can debug who locked the page
 * without subscribing to every lock acquisition.
 */
export interface ScrollLockChangeDetail {
  readonly locked: boolean;
  readonly count: number;
  readonly reason: string;
  readonly handle: string | null;
}

/**
 * @deprecated Use {@link ScrollLockChangeDetail}. Kept as an alias for
 * v0.x consumers that subscribed to the `lock` event with the
 * previous type name.
 */
export type ScrollLockDetail = ScrollLockChangeDetail;

/** Detail payload of the `section` event. */
export interface ScrollSectionChangeDetail {
  readonly active: string | null;
  readonly previous: string | null;
  readonly visible: readonly string[];
  readonly reason?: string;
}

/** Detail payload of the `scroll` event (raw position change). */
export interface ScrollPositionDetail {
  readonly x: number;
  readonly y: number;
  readonly direction: ScrollDirection;
  readonly progress: number;
}

/** Detail payload of the `reach` event (edge reached). */
export interface ScrollReachDetail {
  readonly edge: "top" | "bottom";
  readonly y: number;
}

/** Detail payload of the `navigation` event. */
export interface ScrollNavigationDetail {
  readonly from: number;
  readonly to: number;
  readonly behavior: ScrollBehavior;
  readonly reason?: string;
}

/** Options for {@link ScrollController.scrollIntoView}. */
export interface ScrollIntoViewOptions {
  /** Vertical scroll behavior. Default: `controller`'s `defaultBehavior`. */
  readonly behavior?: ScrollBehavior;
  /**
   * Move focus to the element after scrolling. Default: `false` —
   * matches the native `Element.scrollIntoView()` semantics; consumers
   * that want the focus side-effect must opt in explicitly.
   */
  readonly focus?: boolean;
}

/** Options accepted by `ScrollController.scrollIntoView` overload. */
export interface ScrollIntoViewAbsoluteOptions extends ScrollIntoViewOptions {
  /** Horizontal target. */
  readonly x: number;
  /** Vertical target. */
  readonly y: number;
}

/** Navigation options accepted by `by`, `toTop`, `toBottom`, etc. */
export interface ScrollNavigationOptions {
  /** Vertical scroll behavior. Default: `controller`'s `defaultBehavior`. */
  readonly behavior?: ScrollBehavior;
}

/* -------------------------------------------------------------------------- */
/*                              Lock helpers                                  */
/* -------------------------------------------------------------------------- */

/** Reason supplied to `ScrollController.lockWithHandle(reason)`. */
export type ScrollLockReason = string;

/* -------------------------------------------------------------------------- */
/*                              Plugin contracts                             */
/* -------------------------------------------------------------------------- */

/**
 * Alpine-facing store surface. The integration fills it from a
 * {@link ScrollController}; reads delegate to the controller's
 * getters and mutations go through the controller's semantic commands.
 *
 * Fields are mutable because Alpine's reactive proxy intercepts the
 * writes — consumers in templates still see them as effectively
 * read-only because Alpine.data / $store proxies mask mutation.
 */
export interface ScrollStore {
  x: number;
  y: number;
  direction: ScrollDirection;
  atTop: boolean;
  atBottom: boolean;
  progress: number;
  locked: boolean;
  lockCount: number;
  activeSection: string | null;
  visibleSections: readonly string[];
  /** Scroll the page to the absolute target. */
  scrollIntoView(target: { x: number; y: number }): void;
  /** Scroll the page by a delta. */
  by(delta: { x?: number; y?: number }): void;
  /** Scroll to top. */
  toTop(): void;
  /** Scroll to bottom. */
  toBottom(): void;
  /** Lock the page (no-op unless `lockWithHandle` flow is used). */
  lock(reason?: string): string;
  /** Release a previously acquired lock handle. */
  unlock(handle: string): void;
  /** Release every lock currently held. */
  unlockAll(): void;
}

/**
 * Public, framework-agnostic surface returned by the controller.
 * Mirrors the `SidebarManager` pattern from
 * `@ailuracode/alpine-sidebar`.
 *
 * `on()` is inherited from `BaseController<ScrollEvents>` (not
 * redeclared here) so the typed overloads flow automatically.
 */
export interface ScrollManager {
  readonly id: string;
  readonly state: ScrollState;
  readonly isLocked: boolean;
  readonly isAtTop: boolean;
  readonly isAtBottom: boolean;
  readonly direction: ScrollDirection;
  readonly progress: number;
  readonly activeSection: string | null;
  readonly visibleSections: readonly string[];
  readonly lockHandles: readonly string[];
  mount(): void;
  destroy(): void;
  reset(): void;
  lockWithHandle(reason: string): string;
  unlock(handle: string): void;
  unlockAll(): void;
  registerSection(id: string, options?: ScrollSectionOptions): void;
  unregisterSection(id: string): void;
  scrollIntoView(target: Element | { x: number; y: number }, options?: ScrollIntoViewOptions): void;
  by(delta: { x?: number; y?: number }, reason?: string): void;
  toTop(reason?: string): void;
  toBottom(reason?: string): void;
  toElement(element: Element, options?: ScrollIntoViewOptions): void;
}

/** Listener registered by `Alpine.magic('scroll')` after mount. */
export type ScrollMagicListener = (detail: ScrollChangeDetail) => void;

/* -------------------------------------------------------------------------- */
/*                              Plugin contracts                             */
/* -------------------------------------------------------------------------- */

/**
 * Typed view of `Alpine` the scroll plugin uses internally.
 *
 * Built from the toolkit's {@link Alpine} generic with the `scroll`
 * store / magic mapped to its concrete {@link ScrollStore} shape. A
 * real `Alpine` runtime is assignable to `ScrollAlpine` without a
 * cast because the toolkit's `Alpine<Stores>` only adds overloads.
 *
 * The `cleanup?` member mirrors `SidebarAlpine` / `LangAlpine`: older
 * Alpine versions do not expose `cleanup`, so the integration guards
 * every call with a `typeof === "function"` check.
 */
export type ScrollAlpine = Alpine<{ scroll: ScrollStore }> & {
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
 * assignable to `Base.PluginCallback`. That lets `scrollPlugin(...)`
 * drop straight into `Alpine.plugin(...)` without a cast. The plugin
 * narrows the runtime instance to {@link ScrollAlpine} inside the
 * function body for typed access to the `"scroll"` store / magic.
 */
export type ScrollPluginCallback = PluginCallback<AlpineBase>;
