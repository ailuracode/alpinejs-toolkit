/**
 * Shared `@ailuracode/alpine-core` subpath imports.
 * Single module keeps tsup from emitting duplicate external import statements.
 */

export type { ToolkitErrorCode } from "@ailuracode/alpine-core/controller";
export { BaseController, ToolkitError } from "@ailuracode/alpine-core/controller";
