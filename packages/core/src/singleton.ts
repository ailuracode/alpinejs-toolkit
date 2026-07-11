/**
 * Singleton helper — toolkit-internal plumbing for feature packages
 * whose controller is unique per document (e.g.
 * `@ailuracode/alpine-theme`, `@ailuracode/alpine-media`).
 *
 * Exported from the public barrel so internal feature packages can
 * import it through `@ailuracode/alpine-core`, but **not intended
 * for application-level use**. Application code should not couple
 * to the toolkit's instance-management strategy; this helper exists
 * so feature packages can guarantee a single live controller per
 * document without each reinventing the pattern.
 *
 * The helper is a tiny `Map<key, T>` with five operations:
 *
 * - `createSingleton(key, factory)` — high-level helper. Returns
 *   the live instance under `key` or builds (and registers) a new
 *   one via the 0-arg `factory()`. This is what feature-package
 *   factories should call.
 * - `getSingleton(key)` — returns the live instance, or `undefined`.
 * - `setSingleton(key, instance)` — registers. Throws if a live
 *   instance already exists for the same key.
 * - `clearSingleton(key)` — removes one key (used by `destroy()`
 *   to release the slot). Idempotent.
 * - `clearAllSingletons()` — clears every key. **Tests only.**
 *
 * `getSingleton()` returns `undefined` for destroyed controllers
 * even if the slot is technically populated, so factories can
 * blindly call `getSingleton()` and re-create on `undefined`
 * without coordinating destroy manually.
 *
 * This module is intentionally framework-agnostic. It does not
 * touch `window`, `document`, or any Web API. SSR-safe by
 * construction: it is pure in-memory state.
 */

import { ToolkitError } from "./core/error";

interface SingletonRecord<T> {
  readonly instance: T;
  destroyed: boolean;
}

const REGISTRY = new Map<string, SingletonRecord<unknown>>();

/**
 * Returns the live singleton instance for `key`, or `undefined`.
 * A destroyed instance is treated as `undefined` so callers can
 * blindly call `getSingleton()` and re-create.
 */
export function getSingleton<T>(key: string): T | undefined {
  const record = REGISTRY.get(key) as SingletonRecord<T> | undefined;
  if (!record || record.destroyed) {
    return undefined;
  }
  return record.instance;
}

/**
 * High-level helper for the "get-or-create" pattern that every
 * singleton factory needs. Returns the live instance under `key`,
 * or — if the slot is empty (or the previous instance was
 * destroyed) — invokes `factory()`, registers the result, and
 * returns it.
 *
 * `factory` MUST be 0-arg; the caller is expected to close over
 * any per-instance options in the factory's own closure (this
 * keeps the singleton policy in the helper while leaving
 * option-merging to the feature package).
 *
 * Re-invocation after a previous instance was destroyed reuses
 * the same key and rebuilds. The factory's options are locked
 * on the FIRST successful build — subsequent calls return the
 * existing instance regardless of new options, matching the
 * "document-level singleton" contract.
 *
 * This helper does NOT call `mount()` on the instance; lifecycle
 * steps like `mount()` are domain-specific and stay in the
 * feature-package factory. The helper's job is purely
 * get-or-create bookkeeping.
 */
export function createSingleton<T>(key: string, factory: () => T): T {
  const existing = getSingleton<T>(key);
  if (existing) {
    return existing;
  }
  const instance = factory();
  setSingleton(key, instance);
  return instance;
}

/**
 * Registers `instance` under `key`. Throws `ToolkitError` if a
 * non-destroyed instance is already registered for the same key —
 * that means the factory was called twice without an intervening
 * destroy, which is a bug.
 */
export function setSingleton<T>(key: string, instance: T): void {
  const existing = REGISTRY.get(key) as SingletonRecord<T> | undefined;
  if (existing && !existing.destroyed) {
    throw new ToolkitError(
      `Singleton "${key}" is already instantiated. Destroy the previous instance first or call clearSingleton("${key}").`,
      "TOOLKIT_INVALID_STATE"
    );
  }
  REGISTRY.set(key, { instance, destroyed: false });
}

/**
 * Marks the singleton at `key` as destroyed and removes it from
 * the registry. Idempotent: calling it twice or on a missing key
 * is a no-op. Returns `true` if a record was removed.
 */
export function clearSingleton(key: string): boolean {
  return REGISTRY.delete(key);
}

/**
 * Clears every registered singleton. **Tests only** — production
 * code should never need this; lifecycle is owned by the
 * controller's `destroy()` calling `clearSingleton()`.
 */
export function clearAllSingletons(): void {
  REGISTRY.clear();
}
