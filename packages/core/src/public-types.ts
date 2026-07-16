/**
 * Pure-type surface for `@ailuracode/alpine-core`.
 *
 * Available as `@ailuracode/alpine-core/types` so consumers can import
 * shared contracts without dragging runtime into their bundle.
 */

export type { LifecyclePhase } from "./core/controller.js";
export type { DebugEvent, DebugLogger, DebugOption } from "./core/debug.js";
export type { ToolkitErrorCode } from "./core/error.js";
export type { EventListener, Unsubscribe } from "./core/event.js";
export type {
  ChangeSource,
  DispatchPluginEventClone,
  DispatchPluginEventOptions,
  PluginCustomEvent,
  PluginEventMap,
  PluginEventName,
} from "./core/plugin-event.js";
export type { RegisteredInstance } from "./core/registry.js";
export type { Alpine, PluginCallback } from "./core/type.js";
export type {
  AlpineLifecycleHost,
  BridgeControllerDirectiveOptions,
  ControllerStoreBridge,
  ControllerStoreBridgeOptions,
  Destroyable,
  ReactiveStoreRegistration,
  WireControllerLifecycleOptions,
} from "./lifecycle-bridge.js";
export type {
  GuardedStoreResult,
  RegistrationErrorCode,
  RegistrationGuardOptions,
  RegistrationKind,
} from "./registration.js";
export type { SingletonInitOptions, SingletonScope } from "./singleton.js";
