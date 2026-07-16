/**
 * `localStorage`-backed storage adapter for the sidebar `visible`
 * boolean.
 *
 * - Reads go through `window.localStorage` (no-op under SSR).
 * - Writes are wrapped in try/catch so Safari private mode /
 *   `SecurityError` failures degrade silently.
 * - `subscribe()` wires the cross-browser `storage` event so other
 *   tabs' updates flow into the local manager. Pass
 *   `crossTab: false` to skip the listener registration entirely.
 *
 * The cross-tab event delivers `newValue: null` when the key was
 * removed in the other tab; the adapter forwards that to the
 * listener as `null` so the manager can distinguish a clear from a
 * regular write.
 *
 * Invalid stored values (anything other than the literal string
 * `"true"` / `"false"`) come back as `null` so the manager falls
 * back to its configured `initial` — never to a coerced boolean.
 */

import type { Unsubscribe } from "../../core-deps.js";
import { safeWindow } from "../../core-deps.js";
import {
  DEFAULT_SIDEBAR_STORAGE_KEY,
  type LocalStorageSidebarStorageOptions,
  type SidebarStorage,
} from "../../types";
import { isBooleanString } from "../validation";

/**
 * Reads `key` from `window.localStorage`. Returns `null` on SSR,
 * storage errors, or invalid values. The default `key` is the one
 * the adapter was constructed with — this helper does NOT fall back
 * to {@link DEFAULT_SIDEBAR_STORAGE_KEY}.
 */
function readLocalStorage(key: string): boolean | null {
  const win = safeWindow();
  if (!win) {
    return null;
  }
  try {
    const raw = win.localStorage.getItem(key);
    if (raw === null) {
      return null;
    }
    // Invalid values come back as `null` so the manager falls back
    // to its configured `initial` — never to a coerced boolean.
    return isBooleanString(raw) ? raw === "true" : null;
  } catch {
    return null;
  }
}

/** Writes `value` to `window.localStorage`. Best-effort — never throws. */
function writeLocalStorage(key: string, value: boolean): void {
  const win = safeWindow();
  if (!win) {
    return;
  }
  try {
    win.localStorage.setItem(key, value ? "true" : "false");
  } catch {
    // SecurityError (Safari private mode), quota exceeded, etc.
    // Persistence is best-effort — fail silently so the UI keeps working.
  }
}

/** Removes `key` from `window.localStorage`. Best-effort — never throws. */
function removeLocalStorage(key: string): void {
  const win = safeWindow();
  if (!win) {
    return;
  }
  try {
    win.localStorage.removeItem(key);
  } catch {
    // Same rationale as `set`.
  }
}

/**
 * Subscribes to cross-tab `storage` events for `key`. Returns a no-op
 * cleanup under SSR or when `crossTab === false`. Filters out events
 * for unrelated keys and values that are not valid booleans, so a
 * different feature sharing a key prefix cannot poison this manager.
 *
 * Forwards `null` when the key was removed in the other tab so the
 * listener can distinguish a clear from a write.
 */
function subscribeLocalStorage(key: string, listener: (next: boolean | null) => void): Unsubscribe {
  const win = safeWindow();
  if (!win) {
    return () => undefined;
  }
  const onStorage = (event: StorageEvent): void => {
    if (event.key !== key) {
      return;
    }
    if (event.newValue === null) {
      listener(null);
      return;
    }
    if (isBooleanString(event.newValue)) {
      listener(event.newValue === "true");
    }
  };
  win.addEventListener("storage", onStorage);
  return () => {
    win.removeEventListener("storage", onStorage);
  };
}

/**
 * Builds a {@link SidebarStorage} backed by `window.localStorage`.
 *
 * @param options.key - `localStorage` key. Default:
 *   {@link DEFAULT_SIDEBAR_STORAGE_KEY}.
 * @param options.crossTab - Subscribe to cross-tab `storage` events.
 *   Default: `true`. Set `false` to skip the `window.addEventListener`
 *   registration.
 */
export function createLocalStorageSidebarStorage(
  options: LocalStorageSidebarStorageOptions = {}
): SidebarStorage {
  const key = options.key ?? DEFAULT_SIDEBAR_STORAGE_KEY;
  const crossTab = options.crossTab !== false;

  return {
    get: () => readLocalStorage(key),
    set: (value) => writeLocalStorage(key, value),
    remove: () => removeLocalStorage(key),
    subscribe: crossTab
      ? (listener) => subscribeLocalStorage(key, listener)
      : () => () => undefined,
  };
}
