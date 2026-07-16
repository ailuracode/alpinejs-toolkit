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

import { createLocalStorageAdapter } from "@ailuracode/alpine-ui";
import { isThemePreference } from "./internal/validation";
import { DEFAULT_THEME_STORAGE_KEY, type ThemePreference, type ThemeStorage } from "./types";

/** Options accepted by {@link createLocalStorageThemeStorage}. */
export interface LocalStorageThemeStorageOptions {
  /** `localStorage` key. Default: {@link DEFAULT_THEME_STORAGE_KEY}. */
  readonly key?: string;
}

export function createLocalStorageThemeStorage(
  options: LocalStorageThemeStorageOptions = {}
): ThemeStorage {
  const key = options.key ?? DEFAULT_THEME_STORAGE_KEY;

  return createLocalStorageAdapter<ThemePreference>({
    key,
    parse: (raw) => (isThemePreference(raw) ? raw : null),
    serialize: (value) => value,
  });
}
