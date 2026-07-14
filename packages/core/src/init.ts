/**
 * Plugin initialization — bridges the registry to Alpine by resolving each
 * plugin's loader and forwarding the resolved callback to `Alpine.plugin()`.
 *
 * Entrypoints:
 * - `initPlugins`: async; supports dynamic `import()` loaders.
 * - `initPluginsSync` / `createAlpinePlugin`: sync; ergonomic bridge for the
 *   common case where every plugin has been pre-resolved at registration time.
 *
 * Initialization state is tracked per Alpine runtime. Concurrent async requests
 * for the same runtime/plugin share one in-flight promise. A failed load does
 * not mark the plugin initialized and can be retried on the next call.
 */
import type { Alpine } from "alpinejs";
import { resolvePluginLoader, resolvePluginLoaderSync } from "./loader";
import { resolvePluginEntries } from "./registry";
import {
  assertNoInflightInitialization,
  getRuntimeInitState,
  markRuntimePluginInitialized,
} from "./runtime-init";
import type { PluginRegistryEntry } from "./types";

function initializeEntry(Alpine: Alpine, entry: PluginRegistryEntry): Promise<void> {
  const state = getRuntimeInitState(Alpine, entry.name);

  if (state.initialized) {
    return Promise.resolve();
  }

  if (state.inflight) {
    return state.inflight;
  }

  state.inflight = (async () => {
    try {
      const callback = await resolvePluginLoader(entry.definition.plugin, entry.name);
      Alpine.plugin(callback);
      markRuntimePluginInitialized(Alpine, entry.name);
    } finally {
      const current = getRuntimeInitState(Alpine, entry.name);
      current.inflight = null;
    }
  })();

  return state.inflight;
}

function initializeEntrySync(Alpine: Alpine, entry: PluginRegistryEntry): void {
  const state = getRuntimeInitState(Alpine, entry.name);

  if (state.initialized) {
    return;
  }

  assertNoInflightInitialization(Alpine, entry.name);

  const callback = resolvePluginLoaderSync(entry.definition.plugin, entry.name);
  Alpine.plugin(callback);
  markRuntimePluginInitialized(Alpine, entry.name);
}

/**
 * Initializes registered plugins on demand. Supports async dynamic imports.
 * Call before `Alpine.start()` in SSR and client entrypoints.
 */
export async function initPlugins(
  Alpine: Alpine,
  names?: string | readonly string[]
): Promise<readonly PluginRegistryEntry[]> {
  const entries = resolvePluginEntries(names);

  for (const entry of entries) {
    await initializeEntry(Alpine, entry);
  }

  return entries;
}

/**
 * Initializes registered plugins synchronously.
 * Throws when a plugin uses an async loader — use `initPlugins()` instead.
 */
export function initPluginsSync(
  Alpine: Alpine,
  names?: string | readonly string[]
): readonly PluginRegistryEntry[] {
  const entries = resolvePluginEntries(names);

  for (const entry of entries) {
    initializeEntrySync(Alpine, entry);
  }

  return entries;
}

/**
 * Returns an Alpine.js plugin callback that initializes the given registered
 * plugins. Only supports sync loaders — use `initPlugins()` for dynamic imports.
 */
export function createAlpinePlugin(names?: string | readonly string[]): (Alpine: Alpine) => void {
  return (Alpine) => {
    initPluginsSync(Alpine, names);
  };
}
