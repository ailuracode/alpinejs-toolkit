/**
 * Public entrypoint for `@ailuracode/alpine-overlay`.
 *
 * Re-exports only — no domain logic. See module files for the
 * implementation contracts.
 */

export {
  OVERLAY_SINGLETON_KEY,
  OverlayController,
  createOverlay,
} from "./controller.js";
export { overlayPlugin } from "./plugin.js";
export { createOverlayStore } from "./alpine/store.js";
export { OverlayError, isOverlayErrorCode } from "./error.js";
export type { OverlayErrorCode } from "./error.js";
export type {
  OverlayAlpine,
  OverlayChangeDetail,
  OverlayChangeListener,
  OverlayEvents,
  OverlayMagicFacade,
  OverlayOptions,
  OverlayPluginCallback,
  OverlayStackEntry,
  OverlayState,
  OverlayStore,
} from "./types.js";
export { DEFAULT_OVERLAY_OPTIONS, normalizeOverlayOptions } from "./options.js";