/**
 * Public entrypoint for `@ailuracode/alpine-toggle`.
 *
 * Per `.cursor/rules/new-package.mdc`, this file
 * MUST only contain re-exports. The framework-agnostic controller
 * lives in `./controller.ts`, the Alpine integration in
 * `./plugin.ts`, and the supporting pure helpers and types live in
 * `./types.ts`, `./events.ts`, and `./internal/*`.
 *
 * Two ways to consume the package:
 *
 * 1. Standalone — `createToggle({ ... })` returns a
 *    {@link ToggleController} you can mutate directly. Use this in
 *    non-Alpine contexts (tests, vanilla TS widgets, server-side
 *    rendering).
 *
 * 2. Alpine — `togglePlugin({ ... })` returns an `Alpine.plugin()`
 *    callback that wires the `$toggle` magic. Each call to
 *    `$toggle(options)` returns a fresh reactive
 *    {@link ToggleController}.
 *
 * Exports are grouped by domain so consumers can scan the surface in
 * one pass: factory → Alpine adapter → types → events.
 */

export { ToggleController } from "./controller";
// --- Controller primitives shared with other feature packages --------
export type { Unsubscribe } from "./core-deps.js";
// --- Event surface ---------------------------------------------------
export type { ToggleEvents } from "./events";
// --- Public factory (framework-agnostic) -----------------------------
// --- Alpine integration ----------------------------------------------
export { createToggle, togglePlugin, togglePlugin as default } from "./plugin";
export type {
  CreateToggleOptions,
  ToggleAlpine,
  ToggleBinaryStates,
  ToggleChangeDetail,
  ToggleChangeSource,
  ToggleInstance,
  ToggleOptions,
  TogglePluginCallback,
  ToggleReactiveView,
  ToggleReactiveViewValue,
  ToggleStatesView,
  ToggleTernaryStates,
  Writable,
} from "./types";
// --- Public types (state contracts, options, plugin callback) --------
export { DEFAULT_TOGGLE_MAGIC_KEY } from "./types";
