/**
 * Explicit plugin source helpers — discriminates direct Alpine callbacks
 * from lazy loaders without relying on {@link Function.length}.
 */
import type {
  AlpinePluginCallback,
  PluginCallbackSource,
  PluginLoaderSource,
  PluginSource,
} from "./types.js";

export function isPluginSource(value: unknown): value is PluginSource {
  if (typeof value !== "object" || value === null || !("source" in value)) {
    return false;
  }

  const source = (value as PluginSource).source;
  return source === "callback" || source === "loader";
}

/** Marks a direct Alpine plugin callback. */
export function pluginCallback(callback: AlpinePluginCallback): PluginCallbackSource {
  return { source: "callback", callback };
}

/** Marks a lazy loader that resolves to an Alpine plugin callback. */
export function pluginLoader(
  load: () => AlpinePluginCallback | Promise<AlpinePluginCallback>
): PluginLoaderSource {
  return { source: "loader", load };
}

/**
 * Normalizes plugin input for {@link definePlugin}. Explicit {@link PluginSource}
 * values pass through; raw callbacks are wrapped as direct callbacks.
 */
export function normalizePluginInput(plugin: PluginSource | AlpinePluginCallback): PluginSource {
  if (isPluginSource(plugin)) {
    return plugin;
  }

  return pluginCallback(plugin);
}
