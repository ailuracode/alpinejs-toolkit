/**
 * Shared `@ailuracode/alpine-core` subpath imports.
 * Single module keeps tsup from emitting duplicate external import statements.
 */

export { guardDirective } from "@ailuracode/alpine-core/registration";
export type { Alpine, PluginCallback } from "@ailuracode/alpine-core/types";
