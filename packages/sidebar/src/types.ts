/**
 * Public type contracts for `@ailuracode/alpine-sidebar` v2.0.
 *
 * Per `.cursor/rules/formatting.mdc`, every public type
 * lives in a `types.ts` module so consumers can import them without pulling
 * the implementation. The shape IS the contract — changes
 * to a field name or type are breaking changes.
 *
 * The sidebar package models a single boolean state machine (`visible`)
 * exposed through a headless {@link SidebarController} that composes
 * {@link ToggleController} from `@ailuracode/alpine-toggle`. The
 * plugin adapter (`sidebarPlugin`) wires the controller into
 * `$store.sidebar` and `$sidebar` magic.
 */

import type { Alpine, PluginCallback, Unsubscribe } from "@ailuracode/alpine-core";
import type { ScrollStore } from "@ailuracode/alpine-scroll";
import type { Alpine as AlpineBase } from "alpinejs";

/** Re-exported so consumers can grab the unsubscribe helper from one path. */
export type { Unsubscribe };

/**
 * Discriminator for the `change` event payload.
 *
 * - `'user'` — direct invocation of `show()`, `hide()`, or `toggle()`.
 * - `'breakpoint'` — `MediaQueryList` change fired by the breakpoint observer.
 * - `'escape'` — `keydown` on `Escape` while the sidebar is visible.
 * - `'reset'` — `controller.reset()` call.
 * - `'initialization'` — first emit right after `mount()`, scheduled on a
 *   microtask so consumers can subscribe synchronously.
 * - `'storage'` — cross-tab sync via the storage adapter's `subscribe`
 *   hook. Additive in v2.1.0 — no existing consumer code breaks.
 *
 * Public: changing a member is a breaking change for anyone branching
 * on `detail.source`.
 */
export type SidebarChangeSource =
  | "user"
  | "breakpoint"
  | "escape"
  | "reset"
  | "initialization"
  | "storage";

/**
 * Action the controller takes when the configured breakpoint media
 * query stops matching.
 *
 * - `'hide'` — auto-hide the sidebar (the v1 default behaviour).
 * - `'keep'` — keep `visible` unchanged; only update `matchesBreakpoint`
 *   so consumers can decide what to do via the `change` event.
 */
export type SidebarOnMismatch = "hide" | "keep";

/**
 * Configuration for the optional responsive breakpoint observer.
 *
 * `query` is a CSS media-query string (e.g. `'(min-width: 1024px)'`).
 * `onMismatch` controls the auto-hide semantics when the query stops
 * matching.
 */
export interface SidebarBreakpointOption {
  readonly query: string;
  readonly onMismatch: SidebarOnMismatch;
}

/**
 * Detail payload of the `change` event.
 *
 * `previous` is `null` on the `initialization` event and a full snapshot
 * on every subsequent transition. `event` is present only when
 * `source` is `'escape'` (`KeyboardEvent`) or `'breakpoint'`
 * (`MediaQueryListEvent`) so consumers can read the raw event without
 * subscribing to the controller's side effects directly.
 */
export interface SidebarChangeDetail {
  readonly visible: boolean;
  readonly matchesBreakpoint: boolean;
  readonly source: SidebarChangeSource;
  readonly previous: { readonly visible: boolean; readonly matchesBreakpoint: boolean } | null;
  readonly event?: KeyboardEvent | MediaQueryListEvent;
}

/**
 * Options accepted by {@link createSidebar} and `sidebarPlugin`.
 *
 * The shape is intentionally narrow — every field is optional and
 * has a sensible default. The legacy v1 `onShow` / `onHide` callbacks
 * were removed in v2.0; consumers that need them should subscribe to
 * `controller.on('change', detail => …)` instead.
 */
export interface CreateSidebarOptions {
  /**
   * Stable identifier exposed via `controller.id`. Defaults to an
   * auto-generated id (`sidebar-<n>`). Useful in tests or when
   * multiple sidebar plugins co-exist in one runtime.
   */
  readonly id?: string;
  /** Close sidebar on `Escape` key. Default: `true`. */
  readonly closeOnEscape?: boolean;
  /**
   * Whether an overlay should be rendered when the sidebar is visible.
   * Default: `true`. Affects the `hasOverlay` getter on
   * {@link SidebarStore} only — the plugin does NOT add DOM markup.
   */
  readonly closeOnOverlayClick?: boolean;
  /**
   * Responsive breakpoint configuration. When provided, the controller
   * tracks the media query via `safeMatchMedia` and re-emits `change`
   * with `source: 'breakpoint'` on every flip. Set `onMismatch: 'hide'`
   * to preserve the v1 auto-hide behaviour; `'keep'` updates
   * `matchesBreakpoint` only.
   */
  readonly breakpoint?: SidebarBreakpointOption;
  /**
   * Initial visibility. Default: `false`. Hydration from a
   * {@link SidebarStorage} adapter (when provided) takes precedence
   * over this option — `storage` reflects the user's persisted intent.
   *
   * Renamed from `initialVisible` in v2.1.0.
   */
  readonly initial?: boolean;
  /**
   * Persistence adapter. When provided, the controller hydrates
   * `visible` from `storage.get()` on `mount()` and writes
   * `storage.set(visible)` after every `source: 'user'` transition.
   * Cross-tab sync via `storage.subscribe?.()` emits
   * `source: 'storage'` on incoming events. Echo detection prevents
   * same-tab feedback loops.
   *
   * When omitted, the sidebar behaves as a pure in-memory state
   * machine (the v2.0 default).
   */
  readonly storage?: SidebarStorage;
  /**
   * Convenience shortcut for `storage: createLocalStorageSidebarStorage({ key })`.
   * Ignored when `storage` is also provided — the explicit adapter wins.
   */
  readonly persistKey?: string;
  /**
   * Pass the `@ailuracode/alpine-scroll` store (the
   * `Alpine.store("scroll")` instance) so the sidebar can manage
   * body scroll lock internally on user-driven visibility
   * transitions. When provided:
   *
   * - `show()` / `toggle()` from user input call
   *   `scroll.lock("sidebar")` and stash the handle.
   * - The matching hide calls `scroll.unlock(handle)`.
   * - `destroy()` releases the held handle so the page does not
   *   stay locked when the sidebar is torn down without an
   *   explicit hide.
   *
   * Lock / unlock fire ONLY on `source: 'user'` transitions.
   * Escape, breakpoint, reset, storage, and initialization
   * changes do NOT touch the lock — the page stays locked until
   * the user closes the menu (or the sidebar is destroyed).
   *
   * `@ailuracode/alpine-scroll` is an optional peer dep — install
   * it (and call `scrollPlugin(...)` before `sidebarPlugin(...)`)
   * only when this option is used. The package itself stays
   * agnostic of any specific scroll primitive; consumers that do
   * not pass `scroll` see no lock side effects.
   *
   * ```ts
   * Alpine.plugin(scrollPlugin());
   * Alpine.plugin(
   *   sidebarPlugin({
   *     scroll: Alpine.store("scroll"),
   *   }),
   * );
   * ```
   */
  readonly scroll?: ScrollStore;
  /**
   * Generic visibility side-effect callback. Fires synchronously
   * after every `change` event emit, regardless of `source`, with
   * the freshly resolved `visible` value. The callback receives the
   * full source discriminator so consumers can branch on
   * `'user' | 'escape' | 'breakpoint' | 'reset' | 'initialization' | 'storage'`.
   *
   * Use this for DOM side effects the plugin must stay agnostic of
   * — toggling a `data-sidebar` attribute, setting
   * `scrollbar-gutter: stable`, moving focus into the panel,
   * announcing the new state to assistive tech, etc. The plugin
   * itself never touches the DOM, mirroring the CSS-framework
   * agnostic contract shared with `theme` / `scroll`.
   *
   * The callback runs AFTER the `change` event has been emitted
   * and AFTER the internal `scroll` lock transition (if any), so
   * the controller's internal state and any lock side effects are
   * already in their target shape by the time the callback runs.
   */
  readonly onVisibilityChange?: (visible: boolean, source: SidebarChangeSource) => void;
}

/** Default `localStorage` key used by {@link createLocalStorageSidebarStorage}. */
export const DEFAULT_SIDEBAR_STORAGE_KEY = "sidebar-visible";

/**
 * Persistence adapter contract. Mirrors `ThemeStorage` from
 * `@ailuracode/alpine-theme` with `boolean` instead of `ThemePreference`.
 * Parsing / validation happens inside the adapter so the controller
 * never sees raw strings.
 */
export interface SidebarStorage {
  /** Reads the persisted boolean. Returns `null` when nothing / invalid value stored. */
  get(): boolean | null;
  /** Persists `value`. No-op when the API is unavailable. */
  set(value: boolean): void;
  /** Removes the persisted value. */
  remove(): void;
  /**
   * Optional subscription hook. The controller calls this when the
   * adapter supports cross-instance change notifications (cross-tab,
   * in-memory observers). Returns an `Unsubscribe` function — a no-op
   * is fine when the runtime cannot subscribe.
   *
   * The listener receives `null` when the adapter's underlying store
   * is cleared (another tab called `removeItem`, the in-memory
   * adapter's `remove()` ran). The controller treats `null` as a
   * "fall back to the configured `initial`" signal and emits
   * `change` with `source: 'storage'`.
   */
  subscribe?(listener: (next: boolean | null) => void): Unsubscribe;
}

/** Options accepted by {@link createLocalStorageSidebarStorage}. */
export interface LocalStorageSidebarStorageOptions {
  /** `localStorage` key. Default: {@link DEFAULT_SIDEBAR_STORAGE_KEY}. */
  readonly key?: string;
  /**
   * Subscribe to cross-tab `storage` events. Default: `true`.
   * Consumers needing no cross-tab sync can disable it to skip the
   * `window.addEventListener('storage', ...)` registration.
   */
  readonly crossTab?: boolean;
}

/** Options accepted by {@link persistSidebarVisible} and {@link withSidebarVisiblePersist}. */
export interface PersistSidebarVisibleOptions {
  /** Storage key passed to `Alpine.$persist`. Default: {@link DEFAULT_SIDEBAR_STORAGE_KEY}. */
  readonly key?: string;
  /**
   * When `true`, the helper throws `ToolkitError` instead of
   * on missing plugin or store. Default: `false`.
   */
  readonly strict?: boolean;
}

/**
 * Type-level Alpine contract for the `$persist` helpers. The toolkit's
 * `Alpine` generic already exposes `store(name)`; this adds the
 * optional `$persist` member with a permissive signature so helpers
 * can be used with both the real Alpine runtime and lightweight mocks.
 */
export type SidebarAlpineLike = {
  $persist?: (...args: unknown[]) => unknown;
  store(name: string): unknown;
};

/**
 * Alpine-facing store surface. The integration fills it from a
 * {@link SidebarController}; reads delegate to the controller's
 * getters and mutations go through the controller's semantic
 * commands.
 */
export interface SidebarStore {
  visible: boolean;
  matchesBreakpoint: boolean;
  readonly isVisible: boolean;
  readonly hasOverlay: boolean;
  show(): void;
  hide(): void;
  toggle(): void;
}

/**
 * Public, framework-agnostic surface returned by {@link createSidebar}
 * and every call inside the Alpine plugin adapter.
 */
export interface SidebarManager {
  readonly id: string;
  readonly visible: boolean;
  readonly isVisible: boolean;
  readonly hasOverlay: boolean;
  readonly matchesBreakpoint: boolean;
  show(): void;
  hide(): void;
  toggle(): void;
  reset(): void;
  on(event: "change", listener: (detail: SidebarChangeDetail) => void): Unsubscribe;
  /** Tears down listeners and releases references. Idempotent. */
  destroy(): void;
}

/**
 * Typed view of `Alpine` the sidebar plugin uses internally.
 *
 * Built from the toolkit's {@link Alpine} generic with the `sidebar`
 * store mapped to its concrete {@link SidebarStore} shape. That gives
 * `alpine.store("sidebar")` a return type of `SidebarStore` without
 * any manual overload declarations — every other name still goes
 * through the generic `Alpine.store` inherited from the base.
 *
 * The `cleanup?` member is Alpine-specific (older versions don't
 * expose it) and is layered on as an intersection so the integration
 * can guard every call with a `typeof === "function"` check.
 */
export type SidebarAlpine = Alpine<{ sidebar: SidebarStore }> & {
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
 * assignable to `Base.PluginCallback`. That lets `sidebarPlugin(...)`
 * drop straight into `Alpine.plugin(...)` without a cast. The plugin
 * narrows the runtime instance to {@link SidebarAlpine} inside the
 * function body for typed access to the `"sidebar"` store / magic.
 */
export type SidebarPluginCallback = PluginCallback<AlpineBase>;
