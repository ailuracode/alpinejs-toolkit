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

import { createLocalStorageAdapter } from "@ailuracode/alpine-ui";
import {
  DEFAULT_SIDEBAR_STORAGE_KEY,
  type LocalStorageSidebarStorageOptions,
  type SidebarStorage,
} from "../../types";
import { isBooleanString } from "../validation";

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

  return createLocalStorageAdapter<boolean>({
    key,
    crossTab: options.crossTab,
    parse: (raw) => (isBooleanString(raw) ? raw === "true" : null),
    serialize: (value) => (value ? "true" : "false"),
  });
}
