/**
 * Headless controller primitives — available as the subpath
 * `@ailuracode/alpine-core/controller` so consumers that need
 * `BaseController` (and only that) don't pull the plugin registry or
 * the browser capability helpers into their bundle.
 *
 * The runtime re-exports live in `./index.ts`. This file is just a
 * narrower entry point for tree-shake: a feature package importing
 * from `./controller` will never see the registry, `definePlugin`,
 * `safeMatchMedia`, etc.
 *
 * Per [public-api.instructions.md](../../../.agents/instructions/public-api.instructions.md),
 * this file MUST only contain re-exports.
 */

export type { LifecyclePhase } from "./core/controller";
export { BaseController } from "./core/controller";
