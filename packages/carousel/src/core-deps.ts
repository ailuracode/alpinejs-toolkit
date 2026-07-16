/**
 * Shared `@ailuracode/alpine-core` subpath imports.
 * Single module keeps tsup from emitting duplicate external import statements.
 */

export { bridgeControllerStore, syncRecordFromSnapshot } from "@ailuracode/alpine-core/bridge";
export { BaseController, generateId } from "@ailuracode/alpine-core/controller";
export type { Alpine, PluginCallback, Unsubscribe } from "@ailuracode/alpine-core/types";
