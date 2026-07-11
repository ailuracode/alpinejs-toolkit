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
 * definePlugin(['magic'], { names: ['share'], plugin: cb })
 *
 * // Single kind — same form for store / directive
 * definePlugin(['store'],     { names: ['theme'],   plugin: cb })
 * definePlugin(['directive'], { names: ['x-child'], plugin: cb })
 *
 * // Multi kind — names becomes an object keyed by kind
 * definePlugin(['magic', 'store'], {
 *   names: { magic: ['wakelock'], store: ['idle'] },
 *   plugin: cb,
 * })
 * ```
 */

import { typeIs } from "./core/utils";
import { assertValidDefinition } from "./internal/assert";
import type { PluginDefinition, PluginKind, PluginLoader, PluginNames } from "./types";

/** Options for {@link definePlugin}. The shape of `names` depends on `kinds`. */
export interface DefinePluginOptions {
  /**
   * The names the plugin registers. Pass a flat array when the plugin
   * declares a single kind; pass an object keyed by kind otherwise.
   */
  readonly names: PluginNames;
  /**
   * The loader that runs against Alpine when `initPlugins()` is called.
   * Either a direct `AlpinePluginCallback`, a 0-arg sync factory, or a
   * 0-arg async factory.
   */
  readonly plugin: PluginLoader;
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
 * `default` is a {@link PluginLoader}, not a raw callback — the loader itself
 * is what `initPlugins()` resolves later.
 */
export type LazyPluginModule = { default: PluginLoader };

/** Options for {@link lazyPlugin} — same shape as {@link DefinePluginOptions} plus `import`. */
export interface LazyPluginOptions extends DefinePluginOptions {
  /**
   * Dynamic import that returns a module whose `default` export is a
   * {@link PluginLoader}. The loader is invoked lazily by `initPlugins()`.
   */
  readonly import: () => Promise<LazyPluginModule>;
}

type AsyncImportFn = () => Promise<unknown>;

const resolveLoader = async (importFn: AsyncImportFn): Promise<PluginLoader> => {
  const loaded = await importFn();
  if (typeIs(loaded, "function")) {
    return loaded as PluginLoader;
  }
  return (loaded as LazyPluginModule).default;
};

const buildAsyncLoader =
  (importFn: AsyncImportFn): PluginLoader =>
  async () =>
    resolveLoader(importFn);

/**
 * Async import-style: accepts an async function that returns the plugin loader.
 * Matches the original toolkit usage: `lazyPlugin(async () => mod.pluginFn())`.
 */
export function lazyPlugin(importFn: () => Promise<() => unknown>): PluginDefinition;
/**
 * Kinds + options: accepts `kinds` array and options with `names` and
 * a dynamic `import()` returning {@link LazyPluginModule}.
 */
export function lazyPlugin(
  kinds: readonly PluginKind[],
  options: LazyPluginOptions
): PluginDefinition;
export function lazyPlugin(
  kindsOrOptions: readonly PluginKind[] | AsyncImportFn,
  maybeOptions?: LazyPluginOptions
): PluginDefinition {
  // Async import-style: single function argument (most common in demo).
  if (typeof kindsOrOptions === "function") {
    return definePlugin([], {
      names: [],
      plugin: buildAsyncLoader(kindsOrOptions),
    });
  }

  const options = maybeOptions as LazyPluginOptions;
  return definePlugin(kindsOrOptions, {
    names: options.names,
    plugin: async () => (await options.import()).default,
  });
}
