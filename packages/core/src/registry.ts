import type { PluginDefinition, PluginRegistryEntry } from "./types.js";

const registry = new Map<string, PluginRegistryEntry>();

function normalizePluginName(name: string): string {
  const normalized = name.trim();

  if (!normalized) {
    throw new Error("Plugin name must be a non-empty string");
  }

  return normalized;
}

function assertValidDefinition(definition: PluginDefinition): void {
  switch (definition.kind) {
    case "magic": {
      if (definition.magics.length === 0) {
        throw new Error(`Magic plugin must declare at least one magic name`);
      }
      break;
    }
    case "store": {
      if (definition.stores.length === 0) {
        throw new Error(`Store plugin must declare at least one store name`);
      }
      break;
    }
    case "both": {
      const hasMagics = (definition.magics?.length ?? 0) > 0;
      const hasStores = (definition.stores?.length ?? 0) > 0;

      if (!(hasMagics || hasStores)) {
        throw new Error(`Hybrid plugin must declare at least one magic or store name`);
      }
      break;
    }
    default: {
      const unknownKind: never = definition;
      throw new Error(`Unknown plugin kind: ${String(unknownKind)}`);
    }
  }
}

/** Registers a plugin definition without initializing it. Safe to call at import time. */
export function registerPlugin(name: string, definition: PluginDefinition): void {
  const normalizedName = normalizePluginName(name);
  assertValidDefinition(definition);

  if (registry.has(normalizedName)) {
    throw new Error(`Plugin "${normalizedName}" is already registered`);
  }

  registry.set(normalizedName, {
    name: normalizedName,
    definition,
    initialized: false,
  });
}

/** Removes a plugin from the registry. Returns whether it existed. */
export function unregisterPlugin(name: string): boolean {
  return registry.delete(normalizePluginName(name));
}

/** Returns a registered plugin entry, if present. */
export function getRegisteredPlugin(name: string): PluginRegistryEntry | undefined {
  return registry.get(normalizePluginName(name));
}

/** Returns all registered plugins in registration order. */
export function getRegisteredPlugins(): readonly PluginRegistryEntry[] {
  return [...registry.values()];
}

/** Returns whether a plugin has been initialized with Alpine. */
export function isPluginInitialized(name: string): boolean {
  return registry.get(normalizePluginName(name))?.initialized ?? false;
}

/** Marks a plugin as initialized. */
export function markPluginInitialized(name: string): void {
  const entry = registry.get(normalizePluginName(name));

  if (!entry) {
    throw new Error(`Cannot mark unknown plugin "${name}" as initialized`);
  }

  entry.initialized = true;
}

/** Clears the registry. Intended for tests. */
export function resetPluginRegistry(): void {
  registry.clear();
}

/** Resolves plugin names to registry entries, preserving registration order. */
export function resolvePluginEntries(names?: string | readonly string[]): PluginRegistryEntry[] {
  if (names === undefined) {
    return [...getRegisteredPlugins()];
  }

  const requested = Array.isArray(names) ? names : [names];

  if (requested.length === 0) {
    return [];
  }

  const entries: PluginRegistryEntry[] = [];

  for (const name of requested) {
    const entry = getRegisteredPlugin(name);

    if (!entry) {
      throw new Error(`Plugin "${name}" is not registered`);
    }

    entries.push(entry);
  }

  return entries;
}
