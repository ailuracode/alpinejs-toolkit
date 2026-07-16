/**
 * Public entrypoint for `@ailuracode/alpine-core`.
 *
 * Feature packages SHOULD import granular subpaths instead of this barrel:
 *
 * - `@ailuracode/alpine-core/browser`
 * - `@ailuracode/alpine-core/controller`
 * - `@ailuracode/alpine-core/bridge`
 * - `@ailuracode/alpine-core/registration`
 * - `@ailuracode/alpine-core/singleton`
 * - `@ailuracode/alpine-core/events`
 * - `@ailuracode/alpine-core/types` (type-only)
 *
 * Plugin registry APIs live in `@ailuracode/alpine-plugin-registry`.
 */

export { isBrowser, safeDocument, safeMatchMedia, safeWindow } from "./browser.js";
export { BaseController } from "./controller.js";
export { CleanupStack } from "./core/cleanup.js";
export type { LifecyclePhase } from "./core/controller.js";
export { generateId } from "./core/controller-id.js";
export type { DebugEvent, DebugLogger, DebugOption } from "./core/debug.js";
export type { ToolkitErrorCode } from "./core/error.js";
export { ToolkitError } from "./core/error.js";
export type { EventListener, Unsubscribe } from "./core/event.js";
export { EventEmitter } from "./core/event.js";
export type {
  ChangeSource,
  DispatchPluginEventClone,
  DispatchPluginEventOptions,
  PluginCustomEvent,
  PluginEventMap,
  PluginEventName,
} from "./core/plugin-event.js";
export { dispatchPluginEvent } from "./core/plugin-event.js";
export type { RegisteredInstance } from "./core/registry.js";
export { InstanceRegistry } from "./core/registry.js";
export type { Alpine, PluginCallback } from "./core/type.js";
export type {
  AlpineLifecycleHost,
  BridgeControllerDirectiveOptions,
  ControllerStoreBridge,
  ControllerStoreBridgeOptions,
  Destroyable,
  ReactiveStoreRegistration,
  WireControllerLifecycleOptions,
} from "./exports/bridge.js";
export {
  bridgeControllerDirective,
  bridgeControllerStore,
  registerReactiveStore,
  registerStoreMagic,
  syncRecordFromSnapshot,
  wireControllerLifecycle,
} from "./exports/bridge.js";
export type {
  GuardedStoreResult,
  RegistrationErrorCode,
  RegistrationGuardOptions,
  RegistrationKind,
} from "./exports/registration.js";
export {
  guardDirective,
  guardMagic,
  guardStore,
  RegistrationError,
  resetRegistrationTracking,
} from "./exports/registration.js";
export type { SingletonInitOptions, SingletonScope } from "./singleton.js";
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
} from "./singleton.js";
