/**
 * Type-only surface for `@ailuracode/alpine-plugin-registry`.
 */

export type { DebugEvent, DebugLogger, DebugOption } from "@ailuracode/alpine-core/types";
export type { DefinePluginOptions, LazyPluginOptions } from "./define.js";
export type { RegistryEventLike } from "./registry.js";
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
