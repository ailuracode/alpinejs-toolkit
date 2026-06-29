import type AlpineType from "alpinejs";
import { resolvePluginLoader, resolvePluginLoaderSync } from "./loader.js";
import { markPluginInitialized, resolvePluginEntries } from "./registry.js";
import type { PluginDefinition, RegisteredPlugin } from "./types.js";

export {
  defineDirectivePlugin,
  defineHybridPlugin,
  defineMagicPlugin,
  defineStorePlugin,
  lazyPlugin,
} from "./define.js";
export { PluginLoaderError } from "./loader.js";
export {
  createMatchMediaWatcher,
  safeMatchMedia,
  watchMatchMedia,
} from "./match-media.js";
export {
  getRegisteredPlugin,
  getRegisteredPlugins,
  isPluginInitialized,
  registerPlugin,
  resetPluginRegistry,
  unregisterPlugin,
} from "./registry.js";
export type { TouchCapabilities } from "./touch-capabilities.js";
export { readTouchCapabilities } from "./touch-capabilities.js";
export type {
  AlpinePluginCallback,
  DirectivePluginDefinition,
  HybridPluginDefinition,
  MagicPluginDefinition,
  PluginDefinition,
  PluginLoader,
  PluginRegistryEntry,
  RegisteredPlugin,
  StorePluginDefinition,
} from "./types.js";

function toRegisteredPlugin(entry: {
  name: string;
  definition: PluginDefinition;
}): RegisteredPlugin {
  return {
    name: entry.name,
    definition: entry.definition,
  };
}

async function initializeEntry(
  Alpine: AlpineType.Alpine,
  entry: ReturnType<typeof resolvePluginEntries>[number]
): Promise<void> {
  if (entry.initialized) {
    return;
  }

  const callback = await resolvePluginLoader(entry.definition.plugin);
  Alpine.plugin(callback);
  markPluginInitialized(entry.name);
}

/**
 * Initializes registered plugins on demand. Supports async dynamic imports.
 * Call before `Alpine.start()` in SSR and client entrypoints.
 */
export async function initPlugins(
  Alpine: AlpineType.Alpine,
  names?: string | readonly string[]
): Promise<readonly RegisteredPlugin[]> {
  const entries = resolvePluginEntries(names);

  for (const entry of entries) {
    await initializeEntry(Alpine, entry);
  }

  return entries.map(toRegisteredPlugin);
}

/**
 * Initializes registered plugins synchronously.
 * Throws when a plugin uses an async loader — use `initPlugins()` instead.
 */
export function initPluginsSync(
  Alpine: AlpineType.Alpine,
  names?: string | readonly string[]
): readonly RegisteredPlugin[] {
  const entries = resolvePluginEntries(names);

  for (const entry of entries) {
    if (entry.initialized) {
      continue;
    }

    const callback = resolvePluginLoaderSync(entry.definition.plugin);
    Alpine.plugin(callback);
    markPluginInitialized(entry.name);
  }

  return entries.map(toRegisteredPlugin);
}

/**
 * Returns an Alpine.js plugin callback that initializes the given registered plugins.
 * Only supports sync loaders — use `initPlugins()` for dynamic imports.
 */
export function createAlpinePlugin(names?: string | readonly string[]): AlpineType.PluginCallback {
  return (Alpine) => {
    initPluginsSync(Alpine, names);
  };
}
