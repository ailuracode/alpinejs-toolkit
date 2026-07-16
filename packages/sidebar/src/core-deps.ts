/**
 * Shared `@ailuracode/alpine-core` subpath imports.
 * Single module keeps tsup from emitting duplicate external import statements.
 */

export { bridgeControllerStore } from "@ailuracode/alpine-core/bridge";
export { safeMatchMedia, safeWindow } from "@ailuracode/alpine-core/browser";
export { BaseController, generateId, ToolkitError } from "@ailuracode/alpine-core/controller";
export type { SingletonScope } from "@ailuracode/alpine-core/singleton";
export { createSingleton, releaseSingleton } from "@ailuracode/alpine-core/singleton";
export type { Alpine, PluginCallback, Unsubscribe } from "@ailuracode/alpine-core/types";
