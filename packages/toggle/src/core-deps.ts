/**
 * Shared `@ailuracode/alpine-core` subpath imports.
 * Single module keeps tsup from emitting duplicate external import statements.
 */

export type { Unsubscribe } from "@ailuracode/alpine-core/controller";
export { EventEmitter, generateId } from "@ailuracode/alpine-core/controller";
export { guardMagic } from "@ailuracode/alpine-core/registration";
export type { Alpine, PluginCallback } from "@ailuracode/alpine-core/types";
