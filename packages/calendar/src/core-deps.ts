/**
 * Shared `@ailuracode/alpine-core` subpath imports.
 * Single module keeps tsup from emitting duplicate external import statements.
 */

export { BaseController } from "@ailuracode/alpine-core/controller";
export { guardMagic } from "@ailuracode/alpine-core/registration";
