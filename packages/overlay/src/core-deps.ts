/**
 * Shared `@ailuracode/alpine-core` subpath imports.
 * Single module keeps tsup from emitting duplicate external import statements.
 */

export { bridgeControllerStore } from "@ailuracode/alpine-core/bridge";
export { safeDocument } from "@ailuracode/alpine-core/browser";
export type { ToolkitErrorCode } from "@ailuracode/alpine-core/controller";
export { BaseController, ToolkitError } from "@ailuracode/alpine-core/controller";
export type { SingletonScope } from "@ailuracode/alpine-core/singleton";
export { createSingleton, releaseSingleton } from "@ailuracode/alpine-core/singleton";
