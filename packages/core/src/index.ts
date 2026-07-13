/**
 * Public entrypoint for `@ailuracode/alpine-core`.
 *
 * Per [.cursor/rules/new-package.mdc](../../../.cursor/rules/new-package.mdc),
 * this file MUST only contain re-exports. Implementations live under
 * `./core/` (the truly internal toolkit helpers) and at the root for the
 * stable public modules (`./browser`, `./define`, `./init`, `./loader`,
 * `./registry`, `./singleton`).
 *
 * Core exposes two layers of functionality:
 *
 * 1. **Plugin registry + Alpine bridge** — register plugins at import time,
 *    initialize them on demand, support both sync and dynamic `import()`
 *    loaders, and stay SSR-safe.
 * 2. **Headless controller primitives** — `BaseController`,
 *    `EventEmitter`, `CleanupStack`, `InstanceRegistry`, and
 *    `ToolkitError`, which every feature package in this monorepo is
 *    expected to use.
 *
 * Imports omit the extension so the file compiles cleanly to ESM under
 * `tsc` (which resolves bare specifiers against the package's own
 * `package.json#type=module`). `allowImportingTsExtensions` is intentionally
 * NOT enabled here because the public source is the `dist/` emitted by
 * the build, not the in-repo source.
 *
 * Re-exports NEVER target `./internal/`. Anything truly private stays
 * inside `./internal/` (currently only `assert.ts`); anything exported
 * from this barrel lives at `src/*` so the public surface is
 * mechanically auditable.
 */

// --- Browser capability helpers (SSR-safe) -------------------------------
export { isBrowser, safeDocument, safeMatchMedia, safeWindow } from "./browser";
// --- Controller primitives (used by every feature package) ---------------
export { BaseController } from "./controller";
export { CleanupStack } from "./core/cleanup";
export type { LifecyclePhase } from "./core/controller";
// --- Controller + event-emitter type helpers -----------------------------
export { generateId } from "./core/controller-id";
export type { DebugEvent, DebugLogger, DebugOption } from "./core/debug";
export type { ToolkitErrorCode } from "./core/error";
export { ToolkitError } from "./core/error";
export type { EventListener, Unsubscribe } from "./core/event";
export { EventEmitter } from "./core/event";
export type { RegisteredInstance } from "./core/registry";
export { InstanceRegistry } from "./core/registry";
// --- Generic Alpine typings ----------------------------------------------
export type { Alpine, PluginCallback } from "./core/type";
// --- Plugin definition helpers -------------------------------------------
export {
  type DefinePluginOptions,
  definePlugin,
  type LazyPluginOptions,
  lazyPlugin,
} from "./define";
// --- Plugin initialization ----------------------------------------------
export {
  createAlpinePlugin,
  initPlugins,
  initPluginsSync,
} from "./init";
// --- Controller-backed Alpine adapter lifecycle bridge -------------------
export type {
  AlpineLifecycleHost,
  ControllerStoreBridge,
  ControllerStoreBridgeOptions,
  Destroyable,
  ReactiveStoreRegistration,
  WireControllerLifecycleOptions,
} from "./lifecycle-bridge";
export {
  bridgeControllerStore,
  registerReactiveStore,
  registerStoreMagic,
  wireControllerLifecycle,
} from "./lifecycle-bridge";
// --- Errors --------------------------------------------------------------
export {
  isPluginSource,
  normalizePluginInput,
  PluginLoaderError,
  pluginCallback,
  pluginLoader,
} from "./loader";
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
} from "./registry";
export type { SingletonInitOptions, SingletonScope } from "./singleton";
// --- Singleton helper (intended for toolkit-internal singleton feature controllers) ---
export {
  attachSingletonScope,
  clearAllSingletons,
  clearSingleton,
  createSingleton,
  createSingletonScope,
  getSingleton,
  readSingletonScope,
  releaseSingleton,
  resolveInstanceSingletonScope,
  resolveSingletonScope,
  runWithSingletonScope,
  setSingleton,
} from "./singleton";
// --- Public types --------------------------------------------------------
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
} from "./types";
