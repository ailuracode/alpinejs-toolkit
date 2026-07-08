/**
 * Public entrypoint for `@ailuracode/alpine-core`.
 *
 * Per [public-api.instructions.md](../../../.agents/instructions/public-api.instructions.md),
 * this file MUST only contain re-exports. Implementations live under
 * `./internal/` and `./core/` so the public surface is easy to audit and
 * the package stays tree-shakeable (each export resolves to a single named
 * binding).
 *
 * Core exposes two layers of functionality:
 *
 * 1. **Plugin registry + Alpine bridge** — register plugins at import time,
 *    initialize them on demand, support both sync and dynamic `import()`
 *    loaders, and stay SSR-safe.
 * 2. **Headless controller primitives** — `BaseController`,
 *    `TypedEventEmitter`, `CleanupStack`, `InstanceRegistry`, and
 *    `ToolkitError`, which every feature package in this monorepo is
 *    expected to use.
 *
 * Imports omit the extension so the file compiles cleanly to ESM under
 * `tsc` (which resolves bare specifiers against the package's own
 * `package.json#type=module`). `allowImportingTsExtensions` is intentionally
 * NOT enabled here because the public source is the `dist/` emitted by
 * the build, not the in-repo source.
 */

export { CleanupStack } from "./core/cleanup";
// --- Controller + event-emitter type helpers -----------------------------
export type { LifecyclePhase } from "./core/controller";
// --- Controller primitives (used by every feature package) ---------------
export { BaseController } from "./core/controller";
export type { DebugEvent, DebugLogger, DebugOption } from "./core/debug";
export type { ToolkitErrorCode } from "./core/error";
export { ToolkitError } from "./core/error";
export type { EventListener, Unsubscribe } from "./core/event";
export { EventEmitter } from "./core/event";
export type { RegisteredInstance } from "./core/registry";
export { InstanceRegistry } from "./core/registry";
// --- Generic Alpine typings ----------------------------------------------
export type { Alpine, PluginCallback } from "./core/type";
// --- Browser capability helpers (SSR-safe) -------------------------------
export { isBrowser, safeDocument, safeMatchMedia, safeWindow } from "./internal/browser";
// --- Plugin definition helpers -------------------------------------------
export {
  type DefinePluginOptions,
  definePlugin,
  type LazyPluginOptions,
  lazyPlugin,
} from "./internal/define";
// --- Plugin initialization ----------------------------------------------
export {
  createAlpinePlugin,
  initPlugins,
  initPluginsSync,
} from "./internal/init";
// --- Errors --------------------------------------------------------------
export { PluginLoaderError } from "./internal/loader";
// --- Plugin registry -----------------------------------------------------
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
} from "./internal/registry";
// --- Public types --------------------------------------------------------
export type {
  AlpinePluginCallback,
  PluginDefinition,
  PluginKind,
  PluginLoader,
  PluginNames,
  PluginRegistryEntry,
  RegisteredPlugin,
} from "./types";
