/**
 * Shared `@ailuracode/alpine-core` subpath imports.
 * Single module keeps tsup from emitting duplicate external import statements.
 */

export type { Destroyable } from "@ailuracode/alpine-core/bridge";
export { bridgeControllerStore } from "@ailuracode/alpine-core/bridge";
export { BaseController, generateId, ToolkitError } from "@ailuracode/alpine-core/controller";
