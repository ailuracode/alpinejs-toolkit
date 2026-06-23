import type AlpineType from "alpinejs";

/** Alpine.js plugin callback registered with `Alpine.plugin()`. */
export type AlpinePluginCallback = (Alpine: AlpineType.Alpine) => void;

/**
 * Lazy plugin source. Resolved only when `initPlugins()` runs — never at import time.
 * Supports sync callbacks, lazy factories, and dynamic `import()` loaders.
 */
export type PluginLoader =
  | AlpinePluginCallback
  | (() => AlpinePluginCallback)
  | (() => Promise<AlpinePluginCallback>);

/** Plugin that registers one or more Alpine magics (`$share`, `$calendar`, …). */
export interface MagicPluginDefinition {
  readonly kind: "magic";
  readonly magics: readonly string[];
  readonly plugin: PluginLoader;
}

/** Plugin that registers one or more Alpine stores (`$store.theme`, …). */
export interface StorePluginDefinition {
  readonly kind: "store";
  readonly stores: readonly string[];
  readonly plugin: PluginLoader;
}

/** Plugin that registers both magics and stores (`$wakelock` + `$idle`, …). */
export interface HybridPluginDefinition {
  readonly kind: "both";
  readonly magics?: readonly string[];
  readonly stores?: readonly string[];
  readonly plugin: PluginLoader;
}

export type PluginDefinition =
  | MagicPluginDefinition
  | StorePluginDefinition
  | HybridPluginDefinition;

export interface RegisteredPlugin {
  readonly name: string;
  readonly definition: PluginDefinition;
}

export interface PluginRegistryEntry {
  readonly name: string;
  readonly definition: PluginDefinition;
  initialized: boolean;
}
