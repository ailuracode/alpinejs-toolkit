/**
 * Public type contracts for `@ailuracode/alpine-plugin-registry`.
 * Imported by every internal module and by consuming feature packages.
 */
import type { Alpine as AlpineBase } from "alpinejs";

/** Alpine.js plugin callback registered with `Alpine.plugin()`. */
export type AlpinePluginCallback = (alpine: AlpineBase) => void;

/** Direct Alpine callback registered with `Alpine.plugin()` as-is. */
export type PluginCallbackSource = {
  readonly source: "callback";
  readonly callback: AlpinePluginCallback;
};

/** Lazy loader invoked by `initPlugins()` to obtain an Alpine callback. */
export type PluginLoaderSource = {
  readonly source: "loader";
  readonly load: () => AlpinePluginCallback | Promise<AlpinePluginCallback>;
};

/**
 * Explicit plugin source. Use {@link pluginCallback} for direct callbacks and
 * {@link pluginLoader} for deferred sync or async resolution.
 */
export type PluginSource = PluginCallbackSource | PluginLoaderSource;

/**
 * @deprecated Use {@link PluginSource} with {@link pluginCallback} or
 * {@link pluginLoader} instead of passing bare factory functions.
 */
export type PluginLoader = PluginSource;

/**
 * Alpine extension points a plugin can register.
 * Order-insensitive: `['magic', 'store']` and `['store', 'magic']` are equivalent.
 */
export type PluginKind = "magic" | "store" | "directive";

/**
 * Names the plugin registers per kind.
 *
 * - Single-kind plugin → flat array: `names: ['share']`
 * - Multi-kind plugin  → object keyed by kind: `names: { magic: ['share'], store: ['theme'] }`
 *
 * The flat-array form requires that the plugin declares exactly one kind.
 * The object form requires an entry for every declared kind.
 */
export type PluginNames =
  | readonly string[]
  | {
      magic?: readonly string[];
      store?: readonly string[];
      directive?: readonly string[];
    };

/**
 * Every plugin in the toolkit is a {@link PluginDefinition}: a list of Alpine
 * extension points it registers, the names it uses, and a loader that runs
 * against Alpine. Unifies the previous `magic` / `store` / `directive` / `both`
 * shapes — `kinds: ['magic']` covers what `defineMagicPlugin` did,
 * `kinds: ['magic', 'store']` covers what `defineHybridPlugin` did.
 */
export interface PluginDefinition {
  readonly kinds: readonly PluginKind[];
  readonly names: PluginNames;
  readonly plugin: PluginSource | AlpinePluginCallback;
  /**
   * Allow the same name to appear under multiple kinds of this plugin.
   * Default `false` — duplicate names raise `PLUGIN_INVALID_DEFINITION`.
   * Escape hatch for plugins that genuinely expose the same identifier
   * under several kinds (e.g. a store and a magic sharing one name).
   */
  readonly allowNameCrossKind?: boolean;
}

/** Snapshot returned by the registry — the public, immutable shape. */
export interface RegisteredPlugin {
  readonly name: string;
  readonly definition: PluginDefinition;
}

/**
 * Internal registry entry. Initialization state is tracked per Alpine runtime
 * via {@link getRuntimeInitState} — not on this object — so multiple Alpine
 * instances can initialize the same registered plugin independently.
 */
export interface PluginRegistryEntry {
  readonly name: string;
  readonly definition: PluginDefinition;
}
