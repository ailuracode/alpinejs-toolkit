/**
 * Public type contracts for `@ailuracode/alpine-overlay`.
 *
 * These shapes are the single source of truth for the package's
 * public surface. They are imported by both the controller and the
 * Alpine adapter; do NOT inline duplicate shapes in either module.
 */

import type { SingletonScope } from "@ailuracode/alpine-core";
import type { Unsubscribe } from "@ailuracode/alpine-ui";

/**
 * Options accepted by {@link OverlayController.configure} and the
 * `overlayPlugin()` factory.
 *
 * `root` may be a string selector (`"#overlay-root"`), an existing
 * `HTMLElement`, or `null` (default — lazy-create on first
 * non-null call). `baseZIndex` defaults to `1000`, `step` to `10`.
 * The default `step` of `10` leaves a ten-unit gap between
 * consecutive slots so a temporary overlay cannot z-fight a
 * permanent one.
 */
export interface OverlayOptions {
  /**
   * Portal root selector or element. `null` (the default) defers
   * creation until the controller has a `Document` to append to.
   */
  readonly root?: HTMLElement | string | null;
  /** First z-index slot. Default `1000`. */
  readonly baseZIndex?: number;
  /** Gap between consecutive slots. Default `10`. */
  readonly step?: number;
  /**
   * Singleton scope for this controller. Defaults to the active
   * `document`, an ambient `runWithSingletonScope()` context, or —
   * in SSR — must be provided explicitly as a plain object.
   */
  readonly scope?: SingletonScope;
  /**
   * `$store.overlay` store key the Alpine plugin registers under.
   * Defaults to {@link DEFAULT_OVERLAY_STORE_KEY}. Set when the host
   * already owns an `overlay` store or another toolkit plugin would
   * collide on that name — the rename avoids the collision without
   * touching the controller.
   */
  readonly storeKey?: string;
}

/** Default `$store.overlay` key registered by {@link overlayPlugin}. */
export const DEFAULT_OVERLAY_STORE_KEY = "overlay";

/** Normalized, fully-resolved options. */
export interface NormalizedOverlayOptions {
  readonly root: HTMLElement | string | null;
  readonly baseZIndex: number;
  readonly step: number;
}

/**
 * Reactive snapshot of the overlay controller state. The reactive
 * proxy Alpine consumers read is shaped like this — every field
 * is readonly at the type level even though the underlying
 * reactive layer allows writes.
 */
export interface OverlayState {
  /** Portal root container, or `null` when SSR / not yet created. */
  readonly root: HTMLElement | null;
  /** Open overlays, ordered by z-index ascending (top of stack last). */
  readonly stack: readonly OverlayStackEntry[];
  /** Convenience accessor — always equals `stack.length`. */
  readonly count: number;
  /** First slot. */
  readonly baseZIndex: number;
  /** Slot gap. */
  readonly step: number;
}

/** One open overlay. */
export interface OverlayStackEntry {
  /** Owning plugin — `'dialog'`, `'menu'`, `'tooltip'`, user-defined. */
  readonly plugin: string;
  /** Instance id (unique within `plugin`). */
  readonly id: string;
  /** Allocated z-index. */
  readonly zIndex: number;
  /** `Date.now()` at registration time. */
  readonly openedAt: number;
}

/**
 * Detail emitted on `controller.on('change', listener)` and on
 * `$store.overlay.on('change', listener)`.
 */
export interface OverlayChangeDetail {
  /** What triggered the change. */
  readonly action: "register" | "unregister";
  /** Snapshot of the stack AFTER the transition. */
  readonly stack: readonly OverlayStackEntry[];
  /** Set when `action === 'register'`. */
  readonly added?: OverlayStackEntry;
  /** Set when `action === 'unregister'`. */
  readonly removed?: OverlayStackEntry;
}

/**
 * Strongly-typed event map for {@link OverlayController}. Mirrors
 * the convention used by `BaseController` consumers — event names
 * are keys, payloads are the detail type.
 */
export interface OverlayEvents extends Record<string, unknown> {
  change: OverlayChangeDetail;
}

export type OverlayChangeListener = (detail: OverlayChangeDetail) => void;

/**
 * Reactive shape installed at `$store.overlay`. The runtime
 * treats every field as writable so Alpine's reactive proxy can
 * push controller transitions into the store; the `readonly`
 * annotations on {@link OverlayState} describe the public
 * contract, not the proxy's setters.
 */
export interface OverlayStore
  extends Omit<OverlayState, "stack" | "root" | "count" | "baseZIndex" | "step"> {
  stack: OverlayStackEntry[];
  root: HTMLElement | null;
  count: number;
  baseZIndex: number;
  step: number;
  configure(options: OverlayOptions): void;
  /** Allocate a slot. Idempotent — repeat calls return the same `zIndex`. */
  register(plugin: string, id: string): number;
  /** Release a slot. Silent no-op when the pair is unknown. */
  unregister(plugin: string, id: string): void;
  zIndexOf(plugin: string, id: string): number;
  isOpen(plugin: string, id: string): boolean;
  on(event: "change", listener: OverlayChangeListener): Unsubscribe;
}

/**
 * Facade exposed at `$overlay`. Read-only fields are getters;
 * methods delegate to the same store the magic's siblings read.
 */
export interface OverlayMagicFacade {
  readonly stack: readonly OverlayStackEntry[];
  readonly count: number;
  readonly root: HTMLElement | null;
  readonly baseZIndex: number;
  readonly step: number;
  configure(options: OverlayOptions): void;
  register(plugin: string, id: string): number;
  unregister(plugin: string, id: string): void;
  zIndexOf(plugin: string, id: string): number;
  isOpen(plugin: string, id: string): boolean;
  on(event: "change", listener: OverlayChangeListener): Unsubscribe;
}

/** Alpine instance augmented with the overlay store. */
export interface OverlayAlpine {
  store(name: "overlay", value?: OverlayStore): OverlayStore;
  magic(name: "overlay", factory: () => OverlayMagicFacade): void;
}

/** Shorthand for the Alpine.js plugin callback signature. */
export type OverlayPluginCallback = (alpine: OverlayAlpine) => void;
