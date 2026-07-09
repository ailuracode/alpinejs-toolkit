/**
 * `localStorage`-backed generic storage adapter.
 *
 * Centralises the SSR-safe read / write / subscribe dance every
 * feature package in `@ailuracode/alpinejs-toolkit` would otherwise
 * re-implement:
 *
 * - Reads go through `window.localStorage` (no-op under SSR).
 * - Writes are wrapped in try/catch so Safari private mode /
 *   `SecurityError` failures degrade silently.
 * - `subscribe()` wires the cross-browser `storage` event so other
 *   tabs' updates flow into the local adapter.
 *
 * The cross-tab event delivers `newValue: null` when the key was
 * removed in the other tab; the adapter forwards that to the
 * listener as `null` so consumers can distinguish a clear from a
 * regular write.
 *
 * Invalid stored values come back as `null` so the consumer falls
 * back to its configured default — never to a coerced value. The
 * shape is intentionally identical to `ThemeStorage` /
 * `SidebarStorage` so feature packages can adopt this factory
 * without breaking their public adapter contract.
 */

import type { LocalStorageAdapterOptions, SubscribableStorageAdapter, Unsubscribe } from "../types.js";

/** Returns `window` if available, `null` under SSR. */
function safeWindow(): Window | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window;
}

/**
 * Reads `key` from `window.localStorage`. Returns `null` on SSR,
 * storage errors, or when `parse()` rejects the raw value.
 */
function readLocalStorage<Value>(key: string, parse: (raw: string) => Value | null): Value | null {
  const win = safeWindow();
  if (!win) {
    return null;
  }
  try {
    const raw = win.localStorage.getItem(key);
    if (raw === null) {
      return null;
    }
    return parse(raw);
  } catch {
    return null;
  }
}

/** Writes `value` to `window.localStorage`. Best-effort — never throws. */
function writeLocalStorage<Value>(
  key: string,
  value: Value,
  serialize: (value: Value) => string
): void {
  const win = safeWindow();
  if (!win) {
    return;
  }
  try {
    win.localStorage.setItem(key, serialize(value));
  } catch {
    // SecurityError (Safari private mode), quota exceeded, etc.
    // Persistence is best-effort — fail silently so the consumer stays alive.
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
 * Subscribes to cross-tab `storage` events for `key`. Returns a
 * no-op cleanup under SSR. Filters out events for unrelated keys
 * and values that `parse()` rejects, so a different feature sharing
 * a key prefix cannot poison this adapter.
 *
 * Forwards `null` when the key was removed in the other tab so the
 * listener can distinguish a clear from a write.
 */
function subscribeLocalStorage<Value>(
  key: string,
  parse: (raw: string) => Value | null,
  listener: (next: Value | null) => void
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
    const parsed = parse(event.newValue);
    if (parsed !== null) {
      listener(parsed);
    }
  };
  win.addEventListener("storage", onStorage);
  return () => {
    win.removeEventListener("storage", onStorage);
  };
}

/**
 * Builds a {@link StorageAdapter} backed by `window.localStorage`.
 *
 * `parse` is the validation gate — invalid stored values (whether
 * because `localStorage` was hand-edited or because a third-party
 * script wrote garbage to the same key) come back as `null`. The
 * caller decides what the fallback is.
 *
 * `subscribe` is ALWAYS present on the returned adapter. When
 * `crossTab === false` it returns a no-op unsubscribe function
 * without registering a `window` listener, so consumers can rely
 * on the member existing regardless of cross-tab preference.
 */
export function createLocalStorageAdapter<Value>(
  options: LocalStorageAdapterOptions<Value>
): SubscribableStorageAdapter<Value> {
  const { key, parse, serialize } = options;
  const crossTab = options.crossTab !== false;

  return {
    get: () => readLocalStorage(key, parse),
    set: (value) => writeLocalStorage(key, value, serialize),
    remove: () => removeLocalStorage(key),
    subscribe: (listener) =>
      crossTab ? subscribeLocalStorage(key, parse, listener) : () => undefined,
  };
}
