/**
 * Shared `@ailuracode/alpine-core` subpath imports.
 * Single module keeps tsup from emitting duplicate external import statements.
 */

export { bridgeControllerStore } from "@ailuracode/alpine-core/bridge";
export { safeWindow } from "@ailuracode/alpine-core/browser";
export { BaseController, generateId } from "@ailuracode/alpine-core/controller";
export type { Alpine, PluginCallback, Unsubscribe } from "@ailuracode/alpine-core/types";
