/**
 * Pure-type surface for `@ailuracode/alpine-core`.
 *
 * Available as the subpath `@ailuracode/alpine-core/types` (mapped to
 * this file) so consumers that need only types — `Unsubscribe`,
 * `LifecyclePhase`, `Alpine<TStores>`, `RegisteredInstance`, … — can
 * import them without dragging any of the package's runtime into their
 * bundle. Every export below is a TypeScript `type`; tsup emits a
 * `dist/types.d.ts` and no `dist/types.js`.
 *
 * The runtime re-exports live in `./index.ts`. The base plugin contracts
 * (`PluginDefinition`, `PluginKind`, …) live in `./types.ts` and are
 * consumed here unchanged.
 *
 * Per [.cursor/rules/new-package.mdc](../../../.cursor/rules/new-package.mdc),
 * this file MUST only contain type re-exports.
 */

// --- Controller type helpers -------------------------------------------
export type { LifecyclePhase } from "./core/controller";
// --- Debug diagnostic types --------------------------------------------
// Type-only shim mirroring `@ailuracode/alpine-debug`. No runtime.
export type { DebugEvent, DebugLogger, DebugOption } from "./core/debug";
// --- Error code union --------------------------------------------------
export type { ToolkitErrorCode } from "./core/error";
// --- Event-emitter type helpers ----------------------------------------
// Pure type helpers from `core/event` (no runtime; tree-shaken away).
export type { EventListener, Unsubscribe } from "./core/event";
// --- Plugin DOM event contract -----------------------------------------
export type {
  ChangeSource,
  DispatchPluginEventOptions,
  PluginCustomEvent,
  PluginEventMap,
  PluginEventName,
} from "./core/plugin-event";

// --- Registry type helpers ---------------------------------------------
export type { RegisteredInstance } from "./core/registry";
// --- Generic Alpine typings (no runtime footprint) ---------------------
export type { Alpine, PluginCallback } from "./core/type";
// --- Base plugin contracts (from ./types) ------------------------------
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
