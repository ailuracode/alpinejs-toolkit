import { safeDocument } from "./browser.js";
import { ToolkitError } from "./error.js";

export type SingletonScope = object;

export interface SingletonInitOptions {
  readonly scope?: SingletonScope;
}

interface SingletonRecord<T> {
  readonly instance: T;
}

const SCOPED_REGISTRY = new WeakMap<SingletonScope, Map<string, SingletonRecord<unknown>>>();
const trackedScopes = new Set<SingletonScope>();
const INSTANCE_SCOPE = new WeakMap<object, SingletonScope>();

function resolveScope(explicit?: SingletonScope): SingletonScope {
  if (explicit) {
    return explicit;
  }
  const document = safeDocument();
  if (document) {
    return document;
  }
  throw new ToolkitError("No singleton scope available.", "TOOLKIT_SINGLETON_SCOPE_REQUIRED");
}

function getScopeRegistry(scope: SingletonScope): Map<string, SingletonRecord<unknown>> {
  trackedScopes.add(scope);
  let registry = SCOPED_REGISTRY.get(scope);
  if (!registry) {
    registry = new Map();
    SCOPED_REGISTRY.set(scope, registry);
  }
  return registry;
}

export function createSingleton<T extends object>(
  key: string,
  factory: () => T,
  init?: SingletonInitOptions
): T {
  const scope = resolveScope(init?.scope);
  const registry = getScopeRegistry(scope);
  const existing = registry.get(key) as SingletonRecord<T> | undefined;
  if (existing) {
    return existing.instance;
  }

  const instance = factory();
  registry.set(key, { instance });
  INSTANCE_SCOPE.set(instance, scope);
  return instance;
}

export function releaseSingleton<T extends object>(key: string, instance: T): boolean {
  const registry = SCOPED_REGISTRY.get(INSTANCE_SCOPE.get(instance) as SingletonScope);
  const record = registry?.get(key) as SingletonRecord<T> | undefined;
  if (record?.instance === instance) {
    registry?.delete(key);
    INSTANCE_SCOPE.delete(instance);
    return true;
  }
  return false;
}

export function clearAllSingletons(): void {
  for (const scope of trackedScopes) {
    SCOPED_REGISTRY.delete(scope);
  }
  trackedScopes.clear();
}
