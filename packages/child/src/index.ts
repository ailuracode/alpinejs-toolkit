/**
 * Public entrypoint for `@ailuracode/alpine-child`.
 *
 * Per `.cursor/rules/new-package.mdc`, this file
 * MUST only contain re-exports. The framework-agnostic controller lives
 * in `./controller.ts`, the Alpine integration in `./plugin.ts`, and
 * the supporting pure helpers and types live in `./internal/transfer.ts`
 * and `./types.ts`.
 *
 * Two ways to consume the package:
 *
 * 1. Standalone — import any of the helpers in `./controller` directly
 *    for tests, custom directives, or non-Alpine adapters. The helpers
 *    are pure: no `window` / `document` / `Alpine.*` access.
 * 2. Alpine — `childPlugin({ ... })` returns the `Alpine.plugin()`
 *    callback that registers the `x-child` directive.
 *
 * Exports are grouped by domain so consumers can scan the surface in
 * one pass: framework-agnostic controller → Alpine adapter →
 * re-exports → public types.
 */

// --- Framework-agnostic controller (pure DOM logic) -----------------
export {
  clearTransferredAttributes,
  countElementChildren,
  findFirstElementChild,
  parseChildDirective,
  transferAttributes,
} from "./controller.js";
// --- Alpine integration ----------------------------------------------
export { childPlugin, default } from "./plugin.js";
// --- Public types ----------------------------------------------------
export type {
  ChildAlpine,
  ChildDirectiveConfig,
  ChildMergeMode,
  ChildMorphOptions,
  ChildPluginCallback,
  ChildPluginOptions,
} from "./types.js";
// --- Public constants -------------------------------------------------
export { DEFAULT_CHILD_DIRECTIVE_KEY } from "./types.js";
