/**
 * Alpine `$persist` integration for the sidebar `visible` boolean.
 *
 * The package ships two helpers:
 *
 * 1. `persistSidebarVisible(Alpine, options?)` — wraps
 *    `Alpine.store('sidebar').visible` with `Alpine.$persist(...).as(key)`.
 *    Returns `true` on success; `false` (with `console.warn`) if
 *    `@alpinejs/persist` is not loaded or the store isn't registered.
 *    Never throws in the default mode — `strict: true` opts into
 *    `ToolkitError` for production code that wants hard failure.
 *
 * 2. `withSidebarVisiblePersist(store, options?)` — returns a
 *    `{ get visible, set visible }` proxy the consumer wires into
 *    `$store.sidebar` (typically when constructing the store by
 *    hand). Mutating the proxy delegates to the bound store's
 *    `visible` field.
 *
 * Mutual-exclusion check lives in the controller constructor
 * (T7) — not here. The helpers are pure utilities; the controller is
 * the single point of policy that decides whether `storage` and
 * `$persist` are allowed to coexist.
 */

import { ToolkitError } from "@ailuracode/alpine-core";
import {
  DEFAULT_SIDEBAR_STORAGE_KEY,
  type PersistSidebarVisibleOptions,
  type SidebarAlpineLike,
} from "../../types";

/**
 * Shape of the proxy returned by `withSidebarVisiblePersist`.
 *
 * The proxy is built with an object literal getter/setter so the
 * consumer reads `proxy.visible` and writes `proxy.visible = v`.
 * `readonly: false` because the setter MUST mutate the bound store
 * (it does NOT persist — the proxy is a pure facade).
 */
export interface SidebarVisibleProxy {
  visible: boolean;
}

/**
 * Wires `Alpine.$persist` into `Alpine.store('sidebar').visible`.
 *
 * The helper is best-effort. It DOES NOT throw when `@alpinejs/persist`
 * is not loaded — it logs a warning and returns `false` so callers
 * can decide whether to fall back to a different persistence
 * strategy. `options.strict === true` swaps the warning for a
 * `ToolkitError` for production code that wants hard failure.
 *
 * The persisted key is `${options.key ?? DEFAULT_SIDEBAR_STORAGE_KEY}`
 * so consumers can co-locate the sidebar state with the rest of
 * their `@alpinejs/persist` keys.
 */
export function persistSidebarVisible(
  Alpine: SidebarAlpineLike,
  options: PersistSidebarVisibleOptions = {}
): boolean {
  if (typeof Alpine.$persist !== "function") {
    const message = "[alpine-sidebar] @alpinejs/persist plugin not detected; $persist helper is a no-op";
    if (options.strict === true) {
      throw new ToolkitError(message, "TOOLKIT_NOT_SUPPORTED");
    }
    console.warn(message);
    return false;
  }

  const store = Alpine.store("sidebar") as { visible?: unknown } | undefined;
  if (!store || typeof store !== "object") {
    const message = "[alpine-sidebar] register sidebarPlugin(...) before calling persistSidebarVisible()";
    if (options.strict === true) {
      throw new ToolkitError(message, "TOOLKIT_INVALID_STATE");
    }
    console.warn(message);
    return false;
  }

  // Coerce the current `visible` to a boolean. Falls back to `false`
  // when the field is missing or not a boolean — matches the
  // controller's `initial: false` default.
  const seed = typeof store.visible === "boolean" ? store.visible : false;
  const key = options.key ?? DEFAULT_SIDEBAR_STORAGE_KEY;
  const persisted = (Alpine.$persist as (...args: unknown[]) => unknown)(seed) as {
    as: (k: string) => unknown;
  };
  store.visible = persisted.as(key);
  return true;
}

/**
 * Returns a `{ get visible, set visible }` proxy that delegates
 * reads and writes to the bound store's `visible` field. Useful
 * when the consumer wants to wire `$store.sidebar` manually
 * (e.g. when using `Alpine.data(...)` to construct a non-Alpine
 * store) without giving up the typed getter/setter ergonomics.
 *
 * The proxy is a PURE facade — it does NOT auto-persist. Consumers
 * that want persistence should also call `persistSidebarVisible`
 * (or wire a `SidebarStorage` adapter via `createSidebar({ storage })`).
 */
export function withSidebarVisiblePersist(
  store: { visible: boolean },
  // `options` is accepted for API symmetry with
  // `persistSidebarVisible`; the proxy itself never reads it. The
  // parameter is reserved for a future release that will forward
  // the key to a `Alpine.$persist` chain on the proxy's setter.
  _options: PersistSidebarVisibleOptions = {}
): SidebarVisibleProxy {
  return {
    get visible() {
      return store.visible;
    },
    set visible(v: boolean) {
      store.visible = v;
    },
  };
}
