/**
 * Singleton helper — toolkit-internal plumbing for feature packages
 * whose controller is unique per document or runtime scope (e.g.
 * `@ailuracode/alpine-theme`, `@ailuracode/alpine-media`).
 *
 * Exported from the public barrel so internal feature packages can
 * import it through `@ailuracode/alpine-core`, but **not intended
 * for application-level use**. Application code should not couple
 * to the toolkit's instance-management strategy; this helper exists
 * so feature packages can guarantee a single live controller per
 * scope without each reinventing the pattern.
 *
 * Registry layout: `WeakMap<scope, Map<key, record>>`. Scopes are
 * usually the active `document`, an explicit object from
 * `createSingletonScope()`, or an ambient scope from
 * `runWithSingletonScope()`.
 *
 * Operations:
 *
 * - `createSingleton(key, factory, init?)` — get-or-create inside a
 *   resolved scope. Optionally records `init.options` so conflicting
 *   re-creation emits a diagnostic warning (first call wins).
 * - `getSingleton(key, scope?)` — returns the live instance, or
 *   `undefined`.
 * - `setSingleton(key, instance, scope?)` — registers. Throws if a
 *   live instance already exists for the same key in that scope.
 * - `releaseSingleton(key, instance)` — clears the slot for the
 *   scope stored on `instance` (used by `destroy()`).
 * - `clearSingleton(key, scope?)` — removes one key in a scope.
 * - `clearAllSingletons(scope?)` — clears every key. **Tests only.**
 *
 * `getSingleton()` returns `undefined` for destroyed controllers
 * even if the slot is technically populated, so factories can
 * blindly call `getSingleton()` and re-create on `undefined`
 * without coordinating destroy manually.
 *
 * This module is intentionally framework-agnostic aside from scope
 * resolution, which may consult `document` when no explicit scope is
 * provided.
 */

import { ToolkitError } from "./core/error.js";
import {
  attachSingletonScope,
  getKnownSingletonScopes,
  readSingletonScope,
  resetKnownSingletonScopes,
  resolveSingletonScope,
  type SingletonScope,
} from "./singleton-scope.js";

interface SingletonRecord<T> {
  readonly instance: T;
  destroyed: boolean;
  optionsFingerprint?: string;
}

/** Per-scope key registry. Weakly held so discarded documents release slots. */
const SCOPED_REGISTRY = new WeakMap<SingletonScope, Map<string, SingletonRecord<unknown>>>();

/** Options passed to {@link createSingleton} beyond the factory closure. */
export interface SingletonInitOptions {
  /** Explicit scope. Defaults via {@link resolveSingletonScope}. */
  readonly scope?: SingletonScope;
  /**
   * Serializable options snapshot for conflict diagnostics. When a
   * live singleton already exists and a later call passes different
   * options, the helper warns once and keeps the first configuration.
   */
  readonly options?: unknown;
}

function getScopeRegistry(scope: SingletonScope): Map<string, SingletonRecord<unknown>> {
  let registry = SCOPED_REGISTRY.get(scope);
  if (!registry) {
    registry = new Map();
    SCOPED_REGISTRY.set(scope, registry);
  }
  return registry;
}

function optionsFingerprint(options: unknown): string | undefined {
  if (options === undefined) {
    return undefined;
  }
  try {
    return JSON.stringify(options);
  } catch {
    return undefined;
  }
}

function warnSingletonOptionsConflict(key: string): void {
  // biome-ignore lint/suspicious/noConsole: intentional diagnostic when singleton options conflict
  console.warn(
    `[alpine-toolkit] Singleton "${key}" already exists in this scope with different options. The first configuration wins; later options are ignored.`
  );
}

/**
 * Returns the live singleton instance for `key` in `scope`, or
 * `undefined`. When `scope` is omitted, the ambient scope is
 * resolved via {@link resolveSingletonScope}.
 */
export function getSingleton<T>(key: string, scope?: SingletonScope): T | undefined {
  const resolvedScope = resolveSingletonScope(scope);
  const record = getScopeRegistry(resolvedScope).get(key) as SingletonRecord<T> | undefined;
  if (!record || record.destroyed) {
    return undefined;
  }
  return record.instance;
}

/**
 * High-level helper for the scoped get-or-create pattern. See
 * {@link SingletonInitOptions} for conflict diagnostics.
 */
export function createSingleton<T extends object>(
  key: string,
  factory: () => T,
  init?: SingletonInitOptions
): T {
  const scope = resolveSingletonScope(init?.scope);
  const existing = getSingleton<T>(key, scope);
  if (existing) {
    const record = getScopeRegistry(scope).get(key);
    const nextFingerprint = optionsFingerprint(init?.options);
    if (
      record &&
      nextFingerprint !== undefined &&
      record.optionsFingerprint !== undefined &&
      record.optionsFingerprint !== nextFingerprint
    ) {
      warnSingletonOptionsConflict(key);
    }
    return existing;
  }

  const instance = factory();
  setSingleton(key, instance, scope, init?.options);
  attachSingletonScope(instance, scope);
  return instance;
}

/**
 * Registers `instance` under `key` in `scope`. Throws `ToolkitError`
 * if a non-destroyed instance is already registered for the same
 * key in that scope.
 */
export function setSingleton<T>(
  key: string,
  instance: T,
  scope?: SingletonScope,
  options?: unknown
): void {
  const resolvedScope = resolveSingletonScope(scope);
  const registry = getScopeRegistry(resolvedScope);
  const existing = registry.get(key) as SingletonRecord<T> | undefined;
  if (existing && !existing.destroyed) {
    throw new ToolkitError(
      `Singleton "${key}" is already instantiated in this scope. Destroy the previous instance first or call clearSingleton("${key}", scope).`,
      "TOOLKIT_INVALID_STATE"
    );
  }
  registry.set(key, {
    instance,
    destroyed: false,
    optionsFingerprint: optionsFingerprint(options),
  });
}

/**
 * Releases the singleton slot for `key` using the scope stored on
 * `instance`. Preferred in controller `destroy()` implementations.
 */
export function releaseSingleton(key: string, instance: object): boolean {
  const scope = readSingletonScope(instance);
  if (!scope) {
    return false;
  }
  return clearSingleton(key, scope);
}

/**
 * Removes the singleton at `key` in `scope`. Idempotent: calling it
 * twice or on a missing key is a no-op. Returns `true` if a record
 * was removed.
 */
export function clearSingleton(key: string, scope?: SingletonScope): boolean {
  const resolvedScope = resolveSingletonScope(scope);
  return getScopeRegistry(resolvedScope).delete(key);
}

/**
 * Clears singleton slots. **Tests only** — production code should
 * release slots through `destroy()` / {@link releaseSingleton}.
 *
 * When `scope` is omitted, every known scope is cleared.
 */
export function clearAllSingletons(scope?: SingletonScope): void {
  if (scope !== undefined) {
    SCOPED_REGISTRY.delete(resolveSingletonScope(scope));
    return;
  }

  for (const knownScope of getKnownSingletonScopes()) {
    SCOPED_REGISTRY.delete(knownScope);
  }
  resetKnownSingletonScopes();
}

export type { SingletonScope } from "./singleton-scope.js";
export {
  attachSingletonScope,
  createSingletonScope,
  readSingletonScope,
  resolveInstanceSingletonScope,
  resolveSingletonScope,
  runWithSingletonScope,
} from "./singleton-scope.js";
