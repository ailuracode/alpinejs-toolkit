/**
 * Plugin definition helpers — small factories that produce typed
 * {@link PluginDefinition} objects so consumers declare the Alpine
 * extension points they want explicitly.
 *
 * The public surface is `definePlugin()` (eager loader) and `lazyPlugin()`
 * (deferred via `import()`). Both take a list of kinds and the names
 * they register, and validate eagerly through {@link assertValidDefinition}.
 *
 * Examples:
 *
 * ```ts
 * // Single kind — flat names array
 * definePlugin(['magic'], { names: ['share'], plugin: pluginCallback(cb) })
 *
 * // Single kind — same form for store / directive
 * definePlugin(['store'],     { names: ['theme'],   plugin: pluginCallback(cb) })
 * definePlugin(['directive'], { names: ['x-child'], plugin: pluginCallback(cb) })
 *
 * // Lazy sync factory
 * definePlugin(['store'], {
 *   names: ['theme'],
 *   plugin: pluginLoader(() => themePlugin()),
 * })
 *
 * // Multi kind — names becomes an object keyed by kind
 * definePlugin(['magic', 'store'], {
 *   names: { magic: ['wakelock'], store: ['idle'] },
 *   plugin: pluginCallback(cb),
 * })
 * ```
 */

import { assertValidDefinition } from "./internal/assert";
import { pluginLoader, resolvePluginLoader } from "./loader";
import type {
  AlpinePluginCallback,
  PluginDefinition,
  PluginKind,
  PluginNames,
  PluginSource,
} from "./types";

/** Options for {@link definePlugin}. The shape of `names` depends on `kinds`. */
export interface DefinePluginOptions {
  /**
   * The names the plugin registers. Pass a flat array when the plugin
   * declares a single kind; pass an object keyed by kind otherwise.
   */
  readonly names: PluginNames;
  /**
   * The plugin source that runs against Alpine when `initPlugins()` is called.
   * Pass a raw {@link AlpinePluginCallback} for direct callbacks, or wrap lazy
   * factories with {@link pluginLoader}.
   */
  readonly plugin: PluginSource | AlpinePluginCallback;
  /**
   * When `true`, the same name MAY appear under multiple kinds of this
   * plugin. See {@link PluginDefinition.allowNameCrossKind} for the
   * rationale. Default: `false`.
   */
  readonly allowNameCrossKind?: boolean;
}

/**
 * Creates a typed plugin definition and validates it eagerly. A plugin
 * that declares no kinds, omits names for a declared kind, or repeats a
 * name across kinds throws `ToolkitError('PLUGIN_INVALID_DEFINITION')` at
 * the call site — not later inside `registerPlugin()`.
 *
 * Pass `{ allowNameCrossKind: true }` in {@link DefinePluginOptions} to
 * allow the same name under multiple kinds of the same plugin (e.g.
 * `magic: ['theme']` + `store: ['theme']`).
 */
export const definePlugin = (
  kinds: readonly PluginKind[],
  options: DefinePluginOptions
): PluginDefinition =>
  assertValidDefinition({
    kinds,
    names: options.names,
    plugin: options.plugin,
    allowNameCrossKind: options.allowNameCrossKind,
  });

/**
 * Module shape returned by the dynamic `import()` passed to {@link lazyPlugin}.
 * `default` is a {@link PluginSource} or raw callback — resolved by
 * `initPlugins()` later.
 */
export type LazyPluginModule = { default: PluginSource | AlpinePluginCallback };

/** Options for {@link lazyPlugin} — same metadata as {@link DefinePluginOptions} plus `import`. */
export interface LazyPluginOptions extends Omit<DefinePluginOptions, "plugin"> {
  /**
   * Dynamic import that returns a module whose `default` export is a
   * {@link PluginSource} or raw callback. The loader is invoked lazily by
   * `initPlugins()`.
   */
  readonly import: () => Promise<LazyPluginModule>;
}

/**
 * Builds a typed plugin definition with a deferred dynamic `import()` loader.
 * Requires the same `kinds` and `names` metadata as {@link definePlugin}.
 */
export function lazyPlugin(
  kinds: readonly PluginKind[],
  options: LazyPluginOptions
): PluginDefinition {
  return definePlugin(kinds, {
    names: options.names,
    plugin: pluginLoader(async () => resolvePluginLoader((await options.import()).default)),
    allowNameCrossKind: options.allowNameCrossKind,
  });
}
