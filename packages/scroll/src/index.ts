/**
 * Public entrypoint for `@ailuracode/alpine-scroll` v1.0.0.
 *
 * Per `.cursor/rules/new-package.mdc`, this file MUST
 * only contain re-exports. The framework-agnostic controller lives
 * in `./controller.ts`; the Alpine plugin adapter lives in
 * `./plugin.ts`; pure helpers and types live under `./internal/*`,
 * `./types.ts`, `./events.ts`, `./options.ts`, and `./error.ts`.
 *
 * The v1.0.0 public surface exposes:
 *
 * - `ScrollController` — headless controller class.
 * - `scrollPlugin(options)` — Alpine adapter factory returning the
 *   `Alpine.plugin()` callback.
 * - `createScrollStore(controller)` — pure helper used by the
 *   adapter (also exposed for advanced consumers).
 * - All public type contracts from `./types.ts` and `./events.ts`.
 * - All public error types from `./error.ts`.
 * - The lock helpers and metrics constants from `./internal/*`.
 *
 * Migration from v0.x: see `.changeset/scroll-migration.md`.
 */

export type { Unsubscribe } from "@ailuracode/alpine-core";
export { createScroll, SCROLL_SINGLETON_KEY, ScrollController } from "./controller.js";
// --- Public types (state contracts, options, plugin callback) --------
export type { ScrollErrorCode } from "./error.js";
export { isScrollErrorCode, ScrollError } from "./error.js";
// --- Event surface ---------------------------------------------------
export type {
  ScrollChangeListener,
  ScrollEvents,
  ScrollLockListener,
  ScrollNavigationListener,
  ScrollPositionListener,
  ScrollReachListener,
  ScrollSectionListener,
} from "./events.js";
export type { LockChangeDetail } from "./internal/lock-manager.js";
export { LockManager } from "./internal/lock-manager.js";
// --- Pure helpers (re-exported for advanced consumers) ---------------
export {
  computeScrollDirection,
  computeScrollMetrics,
  readScrollSnapshot,
  SCROLL_BEHAVIORS,
  SCROLL_DIRECTIONS,
  SCROLL_LOCK_AXES,
} from "./internal/metrics.js";
export {
  applyScrollbarGap,
  clearScrollbarGap,
  measureScrollbarWidth,
  resetScrollbarGapCache,
  SCROLLBAR_GAP_VAR,
} from "./internal/scrollbar-gap.js";
export {
  isBrowserWithMedia,
  prefersReducedMotion,
} from "./internal/util.js";
// --- Alpine plugin adapter -----------------------------------------
export { createScrollStore, scrollPlugin, scrollPlugin as default } from "./plugin.js";
export type {
  ScrollAlpine,
  ScrollBehavior,
  ScrollChangeDetail,
  ScrollChangeSource,
  ScrollDirection,
  ScrollIntoViewAbsoluteOptions,
  ScrollIntoViewOptions,
  ScrollLockAxis,
  ScrollLockChangeDetail,
  ScrollLockDetail,
  ScrollLockReason,
  ScrollMagicListener,
  ScrollManager,
  ScrollNavigationDetail,
  ScrollNavigationOptions,
  ScrollOptions,
  ScrollPluginCallback,
  ScrollPositionDetail,
  ScrollReachDetail,
  ScrollSectionChangeDetail,
  ScrollSectionMode,
  ScrollSectionOptions,
  ScrollState,
  ScrollStore,
} from "./types.js";
