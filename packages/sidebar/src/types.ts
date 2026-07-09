/**
 * Public type contracts for `@ailuracode/alpine-sidebar` v2.0.
 *
 * Per `.agents/instructions/typescript.instructions.md`, every public type
 * lives in a `types.ts` module so consumers can import them without pulling
 * the implementation. The shape IS the contract — renaming a field or
 * changing a variant is a breaking change.
 *
 * The sidebar package models a single boolean state machine (`visible`)
 * exposed through a headless {@link SidebarController} that composes
 * {@link ToggleController} from `@ailuracode/alpine-toggle`. The
 * plugin adapter (`sidebarPlugin`) wires the controller into
 * `$store.sidebar` and `$sidebar` magic.
 */

import type { Alpine, PluginCallback, Unsubscribe } from "@ailuracode/alpine-core";
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
 *
 * Public: changing a member is a breaking change for anyone branching
 * on `detail.source`.
 */
export type SidebarChangeSource = "user" | "breakpoint" | "escape" | "reset" | "initialization";

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
  /** Initial visibility. Default: `false`. */
  readonly initialVisible?: boolean;
}

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
