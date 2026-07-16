/**
 * Public type contracts for `@ailuracode/alpine-geo`.
 *
 * Every public type lives in a `types.ts` module so consumers can import
 * them without pulling the implementation. The shape IS the contract.
 */

import type { Alpine as AlpineBase } from "alpinejs";
import type { Alpine, PluginCallback } from "./core-deps.js";

/** Geolocation request/watch options. */
export interface GeoPositionOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/** Alpine-facing store surface. */
export interface GeoStore {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number | null;
  error: string | null;
  errorCode: number | null;
  loading: boolean;
  watching: boolean;
  request(options?: GeoPositionOptions): Promise<boolean>;
  watch(options?: GeoPositionOptions): boolean;
  unwatch(): boolean;
  reset(): boolean;
  readonly hasPosition: boolean;
  readonly isSupported: boolean;
  readonly isWatching: boolean;
  readonly isLoading: boolean;
  readonly hasError: boolean;
}

/** Typed view of `Alpine` the geo plugin uses internally. */
export type GeoAlpine = Alpine<{ geo: GeoStore }> & {
  cleanup?(callback: () => void): void;
};

/** `Alpine.plugin()` callback signature. */
export type GeoPluginCallback = PluginCallback<AlpineBase>;

/** Options accepted by the geo plugin factory. */
export interface CreateGeoOptions {
  /**
   * `$store` key the Alpine plugin registers under. Defaults to
   * {@link DEFAULT_GEO_STORE_KEY}. Set when the host already owns
   * a `geo` store or another toolkit plugin would collide on that
   * name — the rename avoids the collision without touching the
   * controller. Ignored by the standalone `createGeoController`.
   */
  readonly storeKey?: string;
  /**
   * `$geo` magic key the Alpine plugin registers under. Defaults to
   * {@link DEFAULT_GEO_MAGIC_KEY}, or to `storeKey` when that is
   * renamed (the magic follows the store so consumers only rename
   * one). Ignored by the standalone factory.
   */
  readonly magicKey?: string;
}

/** Default `$store` key registered by {@link geoPlugin}. */
export const DEFAULT_GEO_STORE_KEY = "geo";

/** Default `$geo` magic key registered by {@link geoPlugin}. */
export const DEFAULT_GEO_MAGIC_KEY = "geo";
