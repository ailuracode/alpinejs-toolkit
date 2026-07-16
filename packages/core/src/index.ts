export { isBrowser, safeDocument, safeMatchMedia, safeWindow } from "./browser";
export { CleanupStack } from "./cleanup";
export { BaseController, generateId, type LifecyclePhase } from "./controller";

export { ToolkitError, type ToolkitErrorCode } from "./error";
export { EventEmitter, type EventListener, type Unsubscribe } from "./event";
export type {
  AlpineLifecycleHost,
  BridgeControllerDirectiveOptions,
  ControllerStoreBridgeOptions,
  Destroyable,
  WireControllerLifecycleOptions,
} from "./lifecycle-bridge";
export {
  bridgeControllerDirective,
  bridgeControllerStore,
  syncRecordFromSnapshot,
} from "./lifecycle-bridge";
export type { RegistrationGuardOptions } from "./registration";
export {
  guardDirective,
  guardMagic,
  guardStore,
  RegistrationError,
  resetRegistrationTracking,
} from "./registration";
export type { SingletonInitOptions, SingletonScope } from "./singleton";
export {
  clearAllSingletons,
  createSingleton,
  releaseSingleton,
} from "./singleton";
export type { Alpine, PluginCallback } from "./type";
