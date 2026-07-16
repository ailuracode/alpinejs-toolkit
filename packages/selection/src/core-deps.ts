/**
 * Shared `@ailuracode/alpine-core` subpath imports.
 * Single module keeps tsup from emitting duplicate external import statements.
 */

export { bridgeControllerStore, syncRecordFromSnapshot } from "@ailuracode/alpine-core/bridge";
export type { ToolkitErrorCode } from "@ailuracode/alpine-core/controller";
export { BaseController, generateId, ToolkitError } from "@ailuracode/alpine-core/controller";
export type { Alpine, PluginCallback, Unsubscribe } from "@ailuracode/alpine-core/types";
