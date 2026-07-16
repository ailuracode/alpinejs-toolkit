/**
 * Public entrypoint for `@ailuracode/alpine-plugin-registry`.
 */

export {
  type DefinePluginOptions,
  definePlugin,
  type LazyPluginOptions,
  lazyPlugin,
} from "./define.js";
export { createAlpinePlugin, initPlugins, initPluginsSync } from "./init.js";
export {
  isPluginSource,
  normalizePluginInput,
  PluginLoaderError,
  pluginCallback,
  pluginLoader,
} from "./loader.js";
export {
  getRegisteredPlugin,
  getRegisteredPlugins,
  getRegistryDebugSink,
  isPluginInitialized,
  markPluginInitialized,
  type RegistryEventLike,
  registerPlugin,
  resetPluginRegistry,
  resolvePluginEntries,
  setRegistryDebugSink,
  unregisterPlugin,
} from "./registry.js";
export type {
  AlpinePluginCallback,
  PluginCallbackSource,
  PluginDefinition,
  PluginKind,
  PluginLoader,
  PluginLoaderSource,
  PluginNames,
  PluginRegistryEntry,
  PluginSource,
  RegisteredPlugin,
} from "./types.js";
