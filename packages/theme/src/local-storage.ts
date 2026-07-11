/**
 * `localStorage`-backed storage adapter.
 *
 * - Reads go through `window.localStorage` (no-op under SSR).
 * - Writes are wrapped in try/catch so Safari private mode /
 *   `SecurityError` failures degrade silently.
 * - `subscribe()` wires the cross-browser `storage` event so other
 *   tabs' updates flow into the local manager.
 *
 * The cross-tab event delivers `newValue: null` when the key was
 * removed in the other tab; the adapter forwards that to the
 * listener as `null` so the manager can distinguish a clear from a
 * regular write.
 *
 * Lives at the package root (rather than under `internal/`) because
 * it is part of the documented plugin options surface —
 * `createTheme({ storage: ... })` accepts instances built by this
 * factory.
 */

import { safeWindow, type Unsubscribe } from "@ailuracode/alpine-core";
import { isThemePreference } from "./internal/validation";
import { DEFAULT_THEME_STORAGE_KEY, type ThemePreference, type ThemeStorage } from "./types";

/** Options accepted by {@link createLocalStorageThemeStorage}. */
export interface LocalStorageThemeStorageOptions {
  /** `localStorage` key. Default: {@link DEFAULT_THEME_STORAGE_KEY}. */
  readonly key?: string;
}

/**
 * Reads `key` from `window.localStorage`. Returns `null` on SSR,
 * storage errors, or invalid values. The default `key` is the one
 * the adapter was constructed with — this helper does NOT fall back
 * to {@link DEFAULT_THEME_STORAGE_KEY}.
 */
function readLocalStorage(key: string): ThemePreference | null {
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
    // to its configured default — never to a coerced `'system'`.
    return isThemePreference(raw) ? raw : null;
  } catch {
    return null;
  }
}

/** Writes `value` to `window.localStorage`. Best-effort — never throws. */
function writeLocalStorage(key: string, value: ThemePreference): void {
  const win = safeWindow();
  if (!win) {
    return;
  }
  try {
    win.localStorage.setItem(key, value);
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
 * cleanup under SSR. Filters out events for unrelated keys and
 * values that are not valid preferences, so a different feature
 * sharing a key prefix cannot poison this manager.
 *
 * Forwards `null` when the key was removed in the other tab so the
 * listener can distinguish a clear from a write.
 */
function subscribeLocalStorage(
  key: string,
  listener: (next: ThemePreference | null) => void
): Unsubscribe {
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
    if (isThemePreference(event.newValue)) {
      listener(event.newValue);
    }
  };
  win.addEventListener("storage", onStorage);
  return () => {
    win.removeEventListener("storage", onStorage);
  };
}

export function createLocalStorageThemeStorage(
  options: LocalStorageThemeStorageOptions = {}
): ThemeStorage {
  const key = options.key ?? DEFAULT_THEME_STORAGE_KEY;

  return {
    get: () => readLocalStorage(key),
    set: (value) => writeLocalStorage(key, value),
    remove: () => removeLocalStorage(key),
    subscribe: (listener) => subscribeLocalStorage(key, listener),
  };
}
