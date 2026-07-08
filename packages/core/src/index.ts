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

// --- Browser capability helpers (SSR-safe) -------------------------------
export { isBrowser, safeDocument, safeWindow, safeMatchMedia } from "./internal/browser";

// --- Plugin definition helpers -------------------------------------------
export {
    definePlugin,
    lazyPlugin,
    type DefinePluginOptions,
    type LazyPluginOptions,
} from "./internal/define";

// --- Plugin initialization ----------------------------------------------
export {
    initPlugins,
    initPluginsSync,
    createAlpinePlugin,
} from "./internal/init";

// --- Plugin registry -----------------------------------------------------
export {
    getRegisteredPlugin,
    getRegisteredPlugins,
    getRegistryDebugSink,
    isPluginInitialized,
    markPluginInitialized,
    registerPlugin,
    resetPluginRegistry,
    resolvePluginEntries,
    setRegistryDebugSink,
    unregisterPlugin,
    type RegistryEventLike,
} from "./internal/registry";

// --- Errors --------------------------------------------------------------
export { PluginLoaderError } from "./internal/loader";

// --- Controller primitives (used by every feature package) ---------------
export { BaseController } from "./core/controller";
export { CleanupStack } from "./core/cleanup";
export { InstanceRegistry } from "./core/registry";
export { ToolkitError } from "./core/error";
export { EventEmitter } from "./core/event";

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

// --- Generic Alpine typings ----------------------------------------------
export type { Alpine, PluginCallback } from "./core/type";

// --- Controller + event-emitter type helpers -----------------------------
export type { LifecyclePhase } from "./core/controller";
export type { EventListener, Unsubscribe } from "./core/event";
export type { RegisteredInstance } from "./core/registry";
export type { ToolkitErrorCode } from "./core/error";
export type { DebugEvent, DebugLogger, DebugOption } from "./core/debug";