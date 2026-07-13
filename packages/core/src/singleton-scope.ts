/**
 * Singleton scope resolution — isolates controller singletons per
 * document or explicit runtime context.
 *
 * Browser code defaults to the active `document`. SSR and tests
 * should pass an explicit `scope` or wrap work in
 * {@link runWithSingletonScope}.
 */

import { safeDocument } from "./browser.js";
import { ToolkitError } from "./core/error.js";

/**
 * Any object can act as a singleton scope. `Document` is the
 * default in browsers; {@link createSingletonScope} builds an
 * explicit scope for SSR, tests, and multi-realm runtimes.
 */
export type SingletonScope = object;

/** Tracks scopes that have been used so tests can reset every slot. */
const knownScopes = new Set<SingletonScope>();

/** Instance property key storing the scope a singleton was created in. */
export const SINGLETON_SCOPE = Symbol.for("@ailuracode/alpine-core/singleton-scope");

/** Ambient scope for nested {@link runWithSingletonScope} calls. */
let ambientScope: SingletonScope | undefined;

/**
 * Creates a fresh explicit singleton scope. Prefer one scope per SSR
 * request, iframe realm, or isolated test fixture.
 */
export function createSingletonScope(): SingletonScope {
  const scope: SingletonScope = { __singletonScope: true };
  knownScopes.add(scope);
  return scope;
}

/**
 * Runs `fn` with `scope` bound as the ambient singleton scope for
 * nested factory calls that omit an explicit `scope` option.
 */
export function runWithSingletonScope<T>(scope: SingletonScope, fn: () => T): T {
  knownScopes.add(scope);
  const previous = ambientScope;
  ambientScope = scope;
  try {
    return fn();
  } finally {
    ambientScope = previous;
  }
}

/**
 * Resolves the effective singleton scope.
 *
 * Priority: explicit `scope` argument → ambient
 * {@link runWithSingletonScope} store → active `document` → error.
 */
export function resolveSingletonScope(explicit?: SingletonScope): SingletonScope {
  if (explicit) {
    knownScopes.add(explicit);
    return explicit;
  }

  if (ambientScope) {
    return ambientScope;
  }

  const document = safeDocument();
  if (document) {
    knownScopes.add(document);
    return document;
  }

  throw new ToolkitError(
    "No singleton scope is available. Pass `scope` to the factory (see `createSingletonScope()`), wrap SSR work in `runWithSingletonScope()`, or run in a browser with `document`.",
    "TOOLKIT_SINGLETON_SCOPE_REQUIRED"
  );
}

/** @internal Test helper — every scope that has hosted a singleton. */
export function getKnownSingletonScopes(): ReadonlySet<SingletonScope> {
  return knownScopes;
}

/** @internal Clears the known-scope tracker. Tests only. */
export function resetKnownSingletonScopes(): void {
  knownScopes.clear();
  ambientScope = undefined;
}

/**
 * Stores `scope` on `instance` so `destroy()` can release the
 * correct registry slot without re-resolving ambient context.
 */
export function attachSingletonScope<T extends object>(instance: T, scope: SingletonScope): T {
  Object.defineProperty(instance, SINGLETON_SCOPE, {
    value: scope,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  return instance;
}

/** Returns the scope recorded on `instance`, if any. */
export function readSingletonScope(instance: object): SingletonScope | undefined {
  return (instance as Record<symbol, SingletonScope | undefined>)[SINGLETON_SCOPE];
}

/**
 * Resolves the scope for `instance`, falling back to
 * {@link resolveSingletonScope} when the instance was not created
 * through the singleton helper.
 */
export function resolveInstanceSingletonScope(
  instance: object,
  fallback?: SingletonScope
): SingletonScope {
  const attached = readSingletonScope(instance);
  if (attached) {
    return attached;
  }
  return resolveSingletonScope(fallback);
}
