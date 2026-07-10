/**
 * Public entrypoint for `@ailuracode/alpine-overlay`.
 *
 * Re-exports only — no domain logic. See module files for the
 * implementation contracts.
 */

export { createOverlayStore } from "./alpine/store.js";
export {
  createOverlay,
  OVERLAY_SINGLETON_KEY,
  OverlayController,
} from "./controller.js";
export type { OverlayErrorCode } from "./error.js";
export { isOverlayErrorCode, OverlayError } from "./error.js";
export { DEFAULT_OVERLAY_OPTIONS, normalizeOverlayOptions } from "./options.js";
export { overlayPlugin, overlayPlugin as default } from "./plugin.js";
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
