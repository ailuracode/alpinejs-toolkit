/**
 * Plugin initialization — bridges the registry to Alpine by resolving each
 * plugin's loader and forwarding the resolved callback to `Alpine.plugin()`.
 *
 * Entrypoints:
 * - `initPlugins`: async; supports dynamic `import()` loaders.
 * - `initPluginsSync` / `createAlpinePlugin`: sync; ergonomic bridge for the
 *   common case where every plugin has been pre-resolved at registration time.
 */
import type { Alpine } from 'alpinejs';
import type { PluginDefinition, PluginRegistryEntry } from '../types';
import { resolvePluginLoader, resolvePluginLoaderSync } from './loader';
import {
    markPluginInitialized,
    resolvePluginEntries,
} from './registry';

async function initializeEntry(Alpine: Alpine, entry: PluginRegistryEntry): Promise<void> {
    if (entry.initialized) {
        return;
    }
    const callback = await resolvePluginLoader(entry.definition.plugin, entry.name);
    Alpine.plugin(callback);
    markPluginInitialized(entry.name);
}

/**
 * Initializes registered plugins on demand. Supports async dynamic imports.
 * Call before `Alpine.start()` in SSR and client entrypoints.
 */
export async function initPlugins(
    Alpine: Alpine,
    names?: string | readonly string[],
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
    names?: string | readonly string[],
): readonly PluginRegistryEntry[] {
    const entries = resolvePluginEntries(names);

    for (const entry of entries) {
        if (entry.initialized) {
            continue;
        }
        const callback = resolvePluginLoaderSync(entry.definition.plugin, entry.name);
        Alpine.plugin(callback);
        markPluginInitialized(entry.name);
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