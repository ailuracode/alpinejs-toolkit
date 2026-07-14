/**
 * Public entrypoint for `@ailuracode/alpine-geo`.
 *
 * Per public-api instructions, this file MUST only contain re-exports.
 * The framework-agnostic controller lives in `./controller.ts`, the
 * Alpine integration in `./plugin.ts`, and the supporting types in
 * `./types.ts` and `./events.ts`.
 *
 * Two ways to consume the package:
 *
 * 1. Standalone — `createGeoController()` returns a
 *    framework-agnostic controller.
 * 2. Alpine — `geoPlugin()` returns an `Alpine.plugin()` callback
 *    that wires the controller into `$store.geo` and `$geo`.
 */

// --- Re-export core types ------------------------------------------------
export type { Unsubscribe } from "@ailuracode/alpine-core";
// --- Controller (framework-agnostic) -------------------------------------
export { createGeoController, createGeoStore, GeoController } from "./controller";
// --- Event surface -------------------------------------------------------
export type { GeoErrorDetail, GeoEvents, GeoPositionDetail } from "./events";
export {
  createGeoPermissionAdapter,
  GEOLOCATION_PERMISSION_NAME,
} from "./permission-adapter";
// --- Alpine integration --------------------------------------------------
export { geoOptions, geoPlugin, geoPlugin as default } from "./plugin";
// --- Public types ---------------------------------------------------------
export type {
  GeoAlpine,
  GeoPluginCallback,
  GeoPositionOptions,
  GeoStore,
} from "./types";
