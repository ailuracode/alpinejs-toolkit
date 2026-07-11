/**
 * Public entrypoint for `@ailuracode/alpine-media`.
 *
 * Per `.cursor/rules/new-package.mdc`, this file
 * MUST only contain re-exports. The framework-agnostic controller
 * lives in `./controller.ts`, the Alpine integration in
 * `./plugin.ts`, and the supporting pure helpers and types live in
 * `./types.ts`, `./events.ts`, and `./internal/*`.
 *
 * Two ways to consume the package:
 *
 * 1. Standalone — `createMedia({ ... })` returns a
 *    {@link MediaController} you can subscribe to directly. Use
 *    this in non-Alpine contexts (tests, vanilla TS widgets,
 *    server-side rendering).
 *
 * 2. Alpine — `mediaPlugin({ ... })` returns an `Alpine.plugin()`
 *    callback that wires the controller into `$store.media` and
 *    `$media`. Each call returns a reactive mirror backed by a
 *    shared controller.
 *
 * Exports are grouped by domain so consumers can scan the surface
 * in one pass: factory → Alpine adapter → types → events → constants.
 */

export type { Unsubscribe } from "@ailuracode/alpine-core";
// --- Pure helpers (re-exported for SSR snapshots / userland) ---------
export { resolveMediaBreakpoint } from "./breakpoint";
// --- Controller primitives shared with other feature packages --------
export { createMedia, MEDIA_SINGLETON_KEY, MediaController } from "./controller";
// --- Event surface ---------------------------------------------------
export type { MediaEvents } from "./events";
// --- Alpine integration ----------------------------------------------
export {
  createMediaStore,
  MEDIA_STORE_KEY,
  mediaIntervals,
  mediaPlugin,
  mediaPlugin as default,
} from "./plugin";
// --- Public types (state contracts, options, plugin callback) --------
export type {
  CreateMediaOptions,
  HoverCapability,
  MediaAlpine,
  MediaChangeDetail,
  MediaChangeSource,
  MediaInterval,
  MediaManager,
  MediaPluginCallback,
  MediaSnapshot,
  MediaStore,
  Orientation,
  PointerCapability,
  PrefersColorScheme,
  PrefersContrast,
} from "./types";
// --- Public constants ------------------------------------------------
export {
  DEFAULT_MEDIA_DEBOUNCE_MS,
  DEFAULT_MEDIA_INTERVALS,
  SSR_MEDIA_DEFAULTS,
} from "./types";
