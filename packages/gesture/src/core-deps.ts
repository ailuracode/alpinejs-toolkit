/**
 * Shared `@ailuracode/alpine-core` subpath imports.
 * Single module keeps tsup from emitting duplicate external import statements.
 */

export { bridgeControllerDirective, bridgeControllerStore } from "@ailuracode/alpine-core/bridge";
export { isBrowser } from "@ailuracode/alpine-core/browser";
export type { ToolkitErrorCode } from "@ailuracode/alpine-core/controller";
export { BaseController, ToolkitError } from "@ailuracode/alpine-core/controller";
export type { Alpine, PluginCallback, Unsubscribe } from "@ailuracode/alpine-core/types";
